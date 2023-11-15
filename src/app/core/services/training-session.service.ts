import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { collection, setDoc, doc, docData, DocumentReference, CollectionReference, Firestore, deleteDoc, collectionData, query, where, limit, QueryConstraint, updateDoc, orderBy } from '@angular/fire/firestore';
import { Update } from '@ngrx/entity';
import { from, Observable, Subject, throwError } from 'rxjs';
import { catchError, filter, map, shareReplay, take, takeUntil } from 'rxjs/operators';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';
import { TrainingSession, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps } from 'shared-models/train/training-session.model';
import { YoutubeVideoDataCompact } from 'shared-models/youtube/youtube-video-data.model';
import { UiService } from './ui.service';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionQueryParams } from 'shared-models/firestore/fs-collection-query-params.model';
import { TrainingSessionRating, TrainingSessionRatingNoIdOrTimestamp } from 'shared-models/train/session-rating.model';
import { Timestamp } from '@angular/fire/firestore';

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

  createTrainingSession(trainingSessionNoIdOrTimestamp: TrainingSessionNoIdOrTimestamps): Observable<TrainingSession> {
    const currentTimeTimestamp: Timestamp = Timestamp.now();

    const newId = this.generateNewTrainingSessionDocumentId();

    const trainingSessionWithIdAndTimestamps: TrainingSession = {
      ...trainingSessionNoIdOrTimestamp, 
      createdTimestamp: currentTimeTimestamp,
      id: newId,
      lastModifiedTimestamp: currentTimeTimestamp,
    };

    const trainingSessionWithIdAndMs: TrainingSession = {
      ...trainingSessionNoIdOrTimestamp, 
      createdTimestamp: currentTimeTimestamp.toMillis(),
      id: newId,
      lastModifiedTimestamp: currentTimeTimestamp.toMillis(),
    };

    const trainingSessionDocRef = this.getTrainingSessionDoc(newId);
    const trainingSessionAddRequest = setDoc(trainingSessionDocRef, trainingSessionWithIdAndTimestamps);

    return from(trainingSessionAddRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(empty => {
          console.log('Created new trainingSession', trainingSessionWithIdAndMs);
          return trainingSessionWithIdAndMs; // Use new version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error creating trainingSession', error);
          return throwError(() => new Error(error));
        })
      );
  }

  deleteTrainingSession(trainingSessionId: string): Observable<string> {
    const trainingSessionDeleteRequest = deleteDoc(this.getTrainingSessionDoc(trainingSessionId));
    
    this.triggerDeleteTrainingPlanObserver();

    return from(trainingSessionDeleteRequest)
      .pipe(
        map(empty => {
          console.log('Deleted trainingSession', trainingSessionId);
          return trainingSessionId;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error deleting trainingSession', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchAllTrainingSessions() {
    const trainingSessionCollectionDataRequest = collectionData(this.getTrainingSessionCollection());

    return from(trainingSessionCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        // takeUntil(this.deleteTrainingSessionTriggered$),
        map(trainingSessions => {
          if (!trainingSessions) {
            throw new Error(`Error fetching trainingSessions`);
          }
          const trainingSessionsWithUpdatedTimestamps = trainingSessions.map(trainingSession => {
            const formattedTrainingSessions: TrainingSession = {
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

  fetchMultipleTrainingSessions(queryParams: FirestoreCollectionQueryParams): Observable<TrainingSession[]> {

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
    
    const trainingSessionCollectionQuery = query(
      this.getTrainingSessionCollection(),
      ...combinedQueryConstraints,
    );

    const trainingSessionCollectionDataRequest = collectionData(trainingSessionCollectionQuery);

    return from(trainingSessionCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(trainingSessions => {
          if (!trainingSessions) {
            throw new Error(`Error fetching trainingSessions with query: ${queryParams}`);
          }
          const trainingSessionsWithUpdatedTimestamps = trainingSessions.map(trainingSession => {
            const formattedTrainingSessions: TrainingSession = {
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

  fetchSingleTrainingSession(trainingSessionId: string): Observable<TrainingSession> {
    const trainingSession = docData(this.getTrainingSessionDoc(trainingSessionId));
    return trainingSession
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        takeUntil(this.deleteTrainingSessionTriggered$),
        map(trainingSession => {
          if (!trainingSession) {
            throw new Error(`Error fetching trainingSession with id: ${trainingSessionId}`);
          }
          const formattedTrainingSession: TrainingSession = {
            ...trainingSession,
            createdTimestamp: (trainingSession.createdTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (trainingSession.lastModifiedTimestamp as Timestamp).toMillis()
          };
          console.log(`Fetched single trainingSession`, formattedTrainingSession);
          return formattedTrainingSession;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching trainingSession', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchYoutubeVideoData(videoId: string): Observable<YoutubeVideoDataCompact> {
    const fetchYoutubeDataHttpCall: (videoId: string) => 
      Observable<YoutubeVideoDataCompact | null> = httpsCallableData(this.functions, PublicFunctionNames.ON_CALL_FETCH_YOUTUBE_VIDEO_DATA);
    
    const duplicateVideoErrorMessage = `That video already exists in our database. Please try a different video.`;

    return fetchYoutubeDataHttpCall(videoId)
      .pipe(
        take(1),
        map( videoData => {
          if (!videoData) {
            throw new Error(duplicateVideoErrorMessage);
          }
          console.log('Video data retreived', videoData)
          return videoData;
        }),
        shareReplay(),
        catchError(error => {
          console.log('Error fetching youtube video data', error);
          // If duplicate video error, show that specific error message
          if (error.message === duplicateVideoErrorMessage) {
            this.uiService.showSnackBar(duplicateVideoErrorMessage, 10000);  
          } else {
          // Otherwise show generic message
            this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          }
          return throwError(() => new Error(error));
        })
      );
  }

  updateTrainingSession(trainingSessionUpdates: Update<TrainingSession>): Observable<Update<TrainingSession>> {
    const changesWithTimestamp: Partial<TrainingSession> = {
      ...trainingSessionUpdates.changes,
      lastModifiedTimestamp: Timestamp.now()
    }

    const trainingSessionUpdatesWithTimestamp: Update<TrainingSession> = {
      ...trainingSessionUpdates,
      changes: changesWithTimestamp
    }
    const trainingSessionDoc = this.getTrainingSessionDoc(trainingSessionUpdatesWithTimestamp.id as string);
    const trainingSessionUpdateRequest = updateDoc(trainingSessionDoc, changesWithTimestamp);

    return from(trainingSessionUpdateRequest)
      .pipe(
        map(empty => {
          console.log('Updated trainingSession', trainingSessionUpdates);
          return trainingSessionUpdates; // Use original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error updating trainingSession', error);
          return throwError(() => new Error(error));
        })
      );
  }

  updateSessionRating(trainingSessionRatingNoIdOrTimestamp: TrainingSessionRatingNoIdOrTimestamp): Observable<string> {

    const currentTime = Timestamp.now();

    const newId = this.generateNewSessionRatingDocumentId(trainingSessionRatingNoIdOrTimestamp.trainingSessionId);
    const trainingSessionRatingWithIdAndTimestamp: TrainingSessionRating = {
      ...trainingSessionRatingNoIdOrTimestamp, 
      id: newId,
      ratingTimestamp: currentTime
    };

    const updateSessionRatingHttpCall: (trainingSessionRatingWithId: TrainingSessionRating) => 
      Observable<string> = httpsCallableData(this.functions, PublicFunctionNames.ON_CALL_UPDATE_SESSION_RATING);
    
    return updateSessionRatingHttpCall(trainingSessionRatingWithIdAndTimestamp)
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

  // This prevents Firebase from fetching a document after it has been deleted
  private triggerDeleteTrainingPlanObserver() {
    this.deleteTrainingSessionTriggered$.next();
    this.deleteTrainingSessionTriggered$.complete();
    this.deleteTrainingSessionTriggered$ = new Subject<void>();
  }

  private getTrainingSessionCollection(): CollectionReference<TrainingSession> {
    return collection(this.firestore, PublicCollectionPaths.TRAINING_SESSIONS) as CollectionReference<TrainingSession>;
  }

  private getTrainingSessionDoc(trainingSessionId: string): DocumentReference<TrainingSession> {
    return doc(this.getTrainingSessionCollection(), trainingSessionId);
  }

  private generateNewTrainingSessionDocumentId(): string {
    return doc(this.getTrainingSessionCollection()).id;
  }

  private getSessionRatingCollection(trainingSessionId: string): CollectionReference<TrainingSessionRating> {
    return collection(this.firestore, `${PublicCollectionPaths.TRAINING_SESSIONS}/${trainingSessionId}/${PublicCollectionPaths.SESSION_RATINGS}}`) as CollectionReference<TrainingSessionRating>;
  }

  private getSessionRatingDoc(trainingSessionId: string, trainingSessionRatingId: string): DocumentReference<TrainingSessionRating> {
    return doc(this.getSessionRatingCollection(trainingSessionId), trainingSessionRatingId);
  }

  private generateNewSessionRatingDocumentId(trainingSessionId: string): string {
    return doc(this.getSessionRatingCollection(trainingSessionId)).id;
  }

}
