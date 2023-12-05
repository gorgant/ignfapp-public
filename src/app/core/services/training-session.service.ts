import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { collection, setDoc, doc, docData, DocumentReference, CollectionReference, Firestore, deleteDoc, collectionData, query, where, limit, QueryConstraint, updateDoc, orderBy } from '@angular/fire/firestore';
import { Update } from '@ngrx/entity';
import { combineLatest, from, Observable, Subject, throwError } from 'rxjs';
import { catchError, filter, map, shareReplay, take, takeUntil } from 'rxjs/operators';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';
import { CanonicalTrainingSession, CanonicalTrainingSessionNoIdOrTimestamps, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps, TrainingSessionVisibilityCategoryDbOption } from 'shared-models/train/training-session.model';
import { YoutubeVideoDataCompact } from 'shared-models/youtube/youtube-video-data.model';
import { UiService } from './ui.service';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionQueryParams } from 'shared-models/firestore/fs-collection-query-params.model';
import { TrainingSessionRating, TrainingSessionRatingNoIdOrTimestamp } from 'shared-models/train/session-rating.model';
import { Timestamp } from '@angular/fire/firestore';
import { FETCH_YOUTUBE_VIDEO_DUPLICATE_ERROR_MESSAGE, FetchYoutubeVideoData, FetchYoutubeVideoDuplicateErrorMessage } from 'shared-models/youtube/fetch-youtube-video-data.model';
import { DeleteTrainingSessionData } from 'shared-models/train/delete-training-session-data.model';

@Injectable({
  providedIn: 'root'
})
export class TrainingSessionService {

  private firestore = inject(Firestore);
  private functions = inject(Functions);
  private authService = inject(AuthService);
  private uiService = inject(UiService);

  deleteTrainingSessionTriggered$: Subject<void> = new Subject();

  constructor() { }

  createTrainingSession(trainingSessionNoIdOrTimestamp: CanonicalTrainingSessionNoIdOrTimestamps, userId: string): Observable<CanonicalTrainingSession> {
    const currentTimeTimestamp: Timestamp = Timestamp.now();

    const newId = this.generateNewTrainingSessionDocumentId();

    const visibilityCategory = trainingSessionNoIdOrTimestamp[TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY];
    const isPublicTrainingSession = visibilityCategory === TrainingSessionVisibilityCategoryDbOption.PUBLIC;

    let trainingSessionDocRef: DocumentReference<CanonicalTrainingSession>;

    if (isPublicTrainingSession) {
      trainingSessionDocRef = this.getPublicTrainingSessionDoc(newId);
    } else {
      trainingSessionDocRef = this.getPrivateTrainingSessionDoc(newId, userId);
    }

    const trainingSessionWithIdAndTimestamps: CanonicalTrainingSession = {
      ...trainingSessionNoIdOrTimestamp, 
      createdTimestamp: currentTimeTimestamp,
      id: newId,
      lastModifiedTimestamp: currentTimeTimestamp,
    };

    const trainingSessionWithIdAndMs: CanonicalTrainingSession = {
      ...trainingSessionNoIdOrTimestamp, 
      createdTimestamp: currentTimeTimestamp.toMillis(),
      id: newId,
      lastModifiedTimestamp: currentTimeTimestamp.toMillis(),
    };
    
    const trainingSessionAddRequest = setDoc(trainingSessionDocRef, trainingSessionWithIdAndTimestamps);

    return from(trainingSessionAddRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(empty => {
          console.log(`Created new ${visibilityCategory} trainingSession`, trainingSessionWithIdAndMs);
          return trainingSessionWithIdAndMs; // Use new version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error creating ${visibilityCategory} trainingSession`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  // This triggers a recursive delete cloud function which also deletes all the subcollections
  deleteTrainingSession(trainingSession: CanonicalTrainingSession, userId: string): Observable<string> {
    const visibilityCategory = trainingSession[TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY];

    const deleteTrainingSessionData: DeleteTrainingSessionData = {
      trainingSession,
      userId
    };
    const deleteTrainingSessionHttpCall: (deleteData: DeleteTrainingSessionData) => 
      Observable<void> = httpsCallableData(this.functions, PublicFunctionNames.ON_CALL_DELETE_TRAINING_SESSION);

    this.triggerDeleteTrainingSessionObserver();

    return deleteTrainingSessionHttpCall(deleteTrainingSessionData)
      .pipe(
        take(1),
        map(empty => {
          console.log(`Deleted ${visibilityCategory} trainingSession`);
          return trainingSession.id;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error deleting ${visibilityCategory} trainingSession`, error);
          return throwError(() => new Error(error));
        })
      );
    }

  fetchAllTrainingSessions(userId: string) {
    const publicTrainingSessionCollectionDataRequest = collectionData(this.getPublicTrainingSessionCollection());
    const privateTrainingSessionCollectionDataRequest = collectionData(this.getPrivateTrainingSessionCollection(userId));

    // Combine both public and private training sessions
    return combineLatest([publicTrainingSessionCollectionDataRequest, privateTrainingSessionCollectionDataRequest])
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        // takeUntil(this.deleteTrainingSessionTriggered$),
        map(([publicTrainingSessions, privateTrainingSessions]) => {
          if (!publicTrainingSessions && !privateTrainingSessions) {
            throw new Error(`Error fetching trainingSessions`);
          }
          const combinedTrainingSessions = publicTrainingSessions.concat(privateTrainingSessions);
          const trainingSessionsWithUpdatedTimestamps = combinedTrainingSessions.map(trainingSession => {
            const formattedTrainingSessions: CanonicalTrainingSession = {
              ...trainingSession,
              createdTimestamp: (trainingSession.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (trainingSession.lastModifiedTimestamp as Timestamp).toMillis()
            };
            return formattedTrainingSessions;
          });
          console.log(`Fetched all ${trainingSessionsWithUpdatedTimestamps.length} trainingSessions`);
          return trainingSessionsWithUpdatedTimestamps;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching trainingSessions', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchMultipleTrainingSessions(queryParams: FirestoreCollectionQueryParams, userId: string): Observable<CanonicalTrainingSession[]> {

    const whereQueryConditions: QueryConstraint[] | undefined = queryParams.whereQueries ? 
      queryParams.whereQueries.map(condition => where(condition.property, condition.operator, condition.value)) :
      undefined;

    const limitQueryCondition: QueryConstraint | undefined = queryParams.limit ? 
      limit(queryParams.limit) : 
      undefined;

    // Aggregate query constraints if they exist
    let combinedQueryConstraints: QueryConstraint[] = [];
    
    if (whereQueryConditions) {
      combinedQueryConstraints = [...whereQueryConditions];
    }
    if (limitQueryCondition) {
      combinedQueryConstraints = [...combinedQueryConstraints, limitQueryCondition];
    }

    // Order by most popular based on complexity rating count
    const orderQueryCondition: QueryConstraint = orderBy(TrainingSessionKeys.COMPLEXITY_RATING_COUNT);

    combinedQueryConstraints = [...combinedQueryConstraints, orderQueryCondition];

    const publicTrainingSessionCollectionQuery = query(
      this.getPublicTrainingSessionCollection(),
      ...combinedQueryConstraints,
    );

    const privateTrainingSessionCollectionQuery = query(
      this.getPrivateTrainingSessionCollection(userId),
      ...combinedQueryConstraints,
    );

    const publicTrainingSessionCollectionDataRequest = collectionData(publicTrainingSessionCollectionQuery);
    const privateTrainingSessionCollectionDataRequest = collectionData(privateTrainingSessionCollectionQuery);

    return combineLatest([publicTrainingSessionCollectionDataRequest, privateTrainingSessionCollectionDataRequest])
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(([publicTrainingSessions, privateTrainingSessions]) => {
          if (!publicTrainingSessions && !privateTrainingSessions) {
            throw new Error(`Error fetching trainingSessions`);
          }
          const combinedTrainingSessions = publicTrainingSessions.concat(privateTrainingSessions);
          const trainingSessionsWithUpdatedTimestamps = combinedTrainingSessions.map(trainingSession => {
            const formattedTrainingSessions: CanonicalTrainingSession = {
              ...trainingSession,
              createdTimestamp: (trainingSession.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (trainingSession.lastModifiedTimestamp as Timestamp).toMillis()
            };
            return formattedTrainingSessions;
          });
          console.log(`Fetched ${trainingSessionsWithUpdatedTimestamps.length} trainingSessions`);
          return trainingSessionsWithUpdatedTimestamps;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching trainingSessions', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchSingleTrainingSession(trainingSessionId: string, userId: string, visibilityCategory: TrainingSessionVisibilityCategoryDbOption): Observable<CanonicalTrainingSession> {
    const isPublicTrainingSession = visibilityCategory === TrainingSessionVisibilityCategoryDbOption.PUBLIC;
    let trainingSession: Observable<CanonicalTrainingSession>;

    if (isPublicTrainingSession) {
      trainingSession = docData(this.getPublicTrainingSessionDoc(trainingSessionId));
    } else {
      trainingSession = docData(this.getPrivateTrainingSessionDoc(trainingSessionId, userId));
    }

    return trainingSession
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        takeUntil(this.deleteTrainingSessionTriggered$),
        map(trainingSession => {
          if (!trainingSession) {
            throw new Error(`Error fetching trainingSession with id: ${trainingSessionId}`);
          }
          const formattedTrainingSession: CanonicalTrainingSession = {
            ...trainingSession,
            createdTimestamp: (trainingSession.createdTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (trainingSession.lastModifiedTimestamp as Timestamp).toMillis()
          };
          console.log(`Fetched single ${visibilityCategory} trainingSession`, formattedTrainingSession);
          return formattedTrainingSession;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error fetching ${visibilityCategory} trainingSession`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchYoutubeVideoData(fetchYoutubeVideoData: FetchYoutubeVideoData): Observable<YoutubeVideoDataCompact> {
    const fetchYoutubeDataHttpCall: (fetchVideoData: FetchYoutubeVideoData) => 
      Observable<YoutubeVideoDataCompact | FetchYoutubeVideoDuplicateErrorMessage> = httpsCallableData(this.functions, PublicFunctionNames.ON_CALL_FETCH_YOUTUBE_VIDEO_DATA);
    
    const duplicateVideoErrorMessage = `That video already exists in our database. Please try a different video.`;

    return fetchYoutubeDataHttpCall(fetchYoutubeVideoData)
      .pipe(
        take(1),
        map( videoData => {
          // This ensures that only video data makes it through
          if (videoData === FETCH_YOUTUBE_VIDEO_DUPLICATE_ERROR_MESSAGE) {
            throw new Error(FETCH_YOUTUBE_VIDEO_DUPLICATE_ERROR_MESSAGE);
          }
          console.log('Video data retreived', videoData)
          return videoData;
        }),
        shareReplay(),
        catchError(error => {
          console.log('Error fetching youtube video data', error);
          // If duplicate video error, show that specific error message
          if (error.message === FETCH_YOUTUBE_VIDEO_DUPLICATE_ERROR_MESSAGE) {
            this.uiService.showSnackBar(FETCH_YOUTUBE_VIDEO_DUPLICATE_ERROR_MESSAGE, 10000);  
          } else {
          // Otherwise show generic message
            this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          }
          return throwError(() => new Error(error));
        })
      );
  }

  createSessionRating(trainingSessionRatingNoIdOrTimestamp: TrainingSessionRatingNoIdOrTimestamp): Observable<string> {
    const currentTime = Timestamp.now();

    const newId = this.generateNewSessionRatingDocumentId(trainingSessionRatingNoIdOrTimestamp.canonicalTrainingSessionId);
    const trainingSessionRatingWithIdAndTimestamp: TrainingSessionRating = {
      ...trainingSessionRatingNoIdOrTimestamp, 
      id: newId,
      ratingTimestamp: currentTime
    };

    const createSessionRatingHttpCall: (trainingSessionRatingWithId: TrainingSessionRating) => 
      Observable<string> = httpsCallableData(this.functions, PublicFunctionNames.ON_CALL_CREATE_SESSION_RATING);
    
    return createSessionRatingHttpCall(trainingSessionRatingWithIdAndTimestamp)
      .pipe(
        take(1),
        map( pubSubMessageId => {
          console.log('Session rating submitted', pubSubMessageId)
          return pubSubMessageId;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error submitting trainingSessionRating', error);
          return throwError(() => new Error(error));
        })
      );
  }

  updateTrainingSession(trainingSessionUpdates: Update<CanonicalTrainingSession>, userId: string, visibilityCategory: TrainingSessionVisibilityCategoryDbOption): Observable<Update<CanonicalTrainingSession>> {
    const currentTimeTimestamp: Timestamp = Timestamp.now();

    const isPublicTrainingSession = visibilityCategory === TrainingSessionVisibilityCategoryDbOption.PUBLIC;
    const documentId = trainingSessionUpdates.id as string;

    let trainingSessionDoc: DocumentReference<CanonicalTrainingSession>;

    if (isPublicTrainingSession) {
      trainingSessionDoc = this.getPublicTrainingSessionDoc(documentId!);
    } else {
      trainingSessionDoc = this.getPrivateTrainingSessionDoc(documentId!, userId);
    }

    const changesWithTimestamp: Partial<CanonicalTrainingSession> = {
      ...trainingSessionUpdates.changes,
      lastModifiedTimestamp: currentTimeTimestamp
    };

    const changesWithMs: Update<CanonicalTrainingSession> = {
      ...trainingSessionUpdates,
      changes: {
        ...trainingSessionUpdates.changes,
        lastModifiedTimestamp: currentTimeTimestamp.toMillis()
      }
    };

    const trainingSessionUpdateRequest = updateDoc(trainingSessionDoc, changesWithTimestamp);

    return from(trainingSessionUpdateRequest)
      .pipe(
        map(empty => {
          console.log(`Updated ${visibilityCategory} trainingSession`, changesWithMs);
          return changesWithMs; // Use original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error updating ${visibilityCategory} trainingSession`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  // This prevents Firebase from fetching a document after it has been deleted
  private triggerDeleteTrainingSessionObserver() {
    this.deleteTrainingSessionTriggered$.next();
    this.deleteTrainingSessionTriggered$.complete();
    this.deleteTrainingSessionTriggered$ = new Subject<void>();
  }

  private getPrivateTrainingSessionDoc(trainingSessionId: string, userId: string): DocumentReference<CanonicalTrainingSession> {
    return doc(this.getPrivateTrainingSessionCollection(userId), trainingSessionId);
  }

  private getPrivateTrainingSessionCollection(userId: string): CollectionReference<CanonicalTrainingSession> {
    // Note that the privateTrainingSession collection is nested in Public User document
    return collection(this.firestore, `${PublicCollectionPaths.PUBLIC_USERS}/${userId}/${PublicCollectionPaths.PRIVATE_TRAINING_SESSIONS}`) as CollectionReference<CanonicalTrainingSession>;
  }

  private getPublicTrainingSessionCollection(): CollectionReference<CanonicalTrainingSession> {
    return collection(this.firestore, PublicCollectionPaths.PUBLIC_TRAINING_SESSIONS) as CollectionReference<CanonicalTrainingSession>;
  }

  private getPublicTrainingSessionDoc(trainingSessionId: string): DocumentReference<CanonicalTrainingSession> {
    return doc(this.getPublicTrainingSessionCollection(), trainingSessionId);
  }

  private generateNewTrainingSessionDocumentId(): string {
    return doc(this.getPublicTrainingSessionCollection()).id;
  }

  private getPrivateSessionRatingCollection(trainingSessionId: string, userId: string): CollectionReference<TrainingSessionRating> {
    return collection(this.firestore, `${PublicCollectionPaths.PUBLIC_USERS}/${userId}/${PublicCollectionPaths.PRIVATE_TRAINING_SESSIONS}/${trainingSessionId}/${PublicCollectionPaths.SESSION_RATINGS}}`) as CollectionReference<TrainingSessionRating>;
  }

  private getPrivateSessionRatingDoc(trainingSessionId: string, trainingSessionRatingId: string, userId: string): DocumentReference<TrainingSessionRating> {
    return doc(this.getPrivateSessionRatingCollection(trainingSessionId, userId), trainingSessionRatingId);
  }

  private getPublicSessionRatingCollection(trainingSessionId: string): CollectionReference<TrainingSessionRating> {
    return collection(this.firestore, `${PublicCollectionPaths.PUBLIC_TRAINING_SESSIONS}/${trainingSessionId}/${PublicCollectionPaths.SESSION_RATINGS}}`) as CollectionReference<TrainingSessionRating>;
  }

  private getPublicSessionRatingDoc(trainingSessionId: string, trainingSessionRatingId: string): DocumentReference<TrainingSessionRating> {
    return doc(this.getPublicSessionRatingCollection(trainingSessionId), trainingSessionRatingId);
  }

  private generateNewSessionRatingDocumentId(trainingSessionId: string): string {
    return doc(this.getPublicSessionRatingCollection(trainingSessionId)).id;
  }

}
