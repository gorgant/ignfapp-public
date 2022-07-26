import { Injectable } from '@angular/core';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { collection, setDoc, doc, docData, DocumentReference, CollectionReference, Firestore, deleteDoc, collectionData, query, where, limit, QueryConstraint, updateDoc } from '@angular/fire/firestore';
import { Update } from '@ngrx/entity';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, take, takeUntil } from 'rxjs/operators';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';
import { TrainingSession, TrainingSessionNoId } from 'shared-models/train/training-session.model';
import { YoutubeVideoDataCompact } from 'shared-models/youtube/youtube-video-data.model';
import { UiService } from './ui.service';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionQueryParams } from 'shared-models/firestore/fs-collection-query-params.model';
import { SessionRating, SessionRatingNoId } from 'shared-models/train/session-rating.model';

@Injectable({
  providedIn: 'root'
})
export class TrainingSessionService {

  constructor(
    private afs: Firestore,
    private fns: Functions,
    private authService: AuthService,
    private uiService: UiService
  ) { }

  createTrainingSession(trainingSessionNoId: TrainingSessionNoId): Observable<TrainingSession> {

    const newId = this.generateNewTrainingSessionDocumentId();
    const trainingSessionWithId = {...trainingSessionNoId, id: newId};
    const trainingSessionDocRef = this.getTrainingSessionDoc(newId);
    const trainingSessionAddRequest = setDoc(trainingSessionDocRef, trainingSessionWithId);

    return from(trainingSessionAddRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(empty => {
          return trainingSessionWithId;
        }),
        catchError(error => {
          console.log('Error creating training session', error);
          return throwError(() => new Error(error));
        })
      );
  }

  deleteTrainingSession(sessionId: string): Observable<string> {
    const trainingSessionDeleteRequest = deleteDoc(this.getTrainingSessionDoc(sessionId));

    return from(trainingSessionDeleteRequest)
      .pipe(
        map(empty => {
          console.log('Deleted training session', sessionId);
          return sessionId;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error deleting training session', error);
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
      combinedQueryConstraints = [...whereQueryConditions]
    }
    if (limitQueryCondition) {
      combinedQueryConstraints = [...combinedQueryConstraints, limitQueryCondition]
    }
    
    const trainingSessionCollectionQuery = query(
      this.getTrainingSessionCollection(),
      ...combinedQueryConstraints
    );

    const trainingSessionCollectionDataRequest = collectionData(trainingSessionCollectionQuery);

    return from(trainingSessionCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(trainingSessions => {
          if (!trainingSessions) {
            throw new Error(`Error fetching training sessions with query: ${queryParams}`, );
          }
          console.log(`Fetched ${trainingSessions.length} training sessions`, );
          return trainingSessions;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching training sessions', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchSingleTrainingSession(sessionId: string): Observable<TrainingSession> {
    const trainingSession = docData(this.getTrainingSessionDoc(sessionId));
    return trainingSession
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(session => {
          if (!session) {
            throw new Error(`Error fetching training session with id: ${sessionId}`);
          }
          console.log('Fetched trainingSession', session);
          return session;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching training session', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchYoutubeVideoData(videoId: string): Observable<YoutubeVideoDataCompact> {
    const fetchYoutubeDataHttpCall: (videoId: string) => 
      Observable<YoutubeVideoDataCompact | null> = httpsCallableData(this.fns, PublicFunctionNames.ON_CALL_FETCH_YOUTUBE_VIDEO_DATA);
    
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
    const trainingSessionDoc = this.getTrainingSessionDoc(trainingSessionUpdates.id as string);
    const trainingSessionUpdateRequest = updateDoc(trainingSessionDoc, trainingSessionUpdates.changes);

    return from(trainingSessionUpdateRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        map(docRef => {
          console.log('Updated training session', trainingSessionUpdates.changes);
          return trainingSessionUpdates;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error creating training session', error);
          return throwError(() => new Error(error));
        })
      );
  }

  updateSessionRating(sessionRatingNoId: SessionRatingNoId): Observable<string> {

    const newId = this.generateNewSessionRatingDocumentId(sessionRatingNoId.sessionId);
    const sessionRatingWithId = {...sessionRatingNoId, id: newId};

    const updateSessionRatingHttpCall: (sessionRatingWithId: SessionRating) => 
      Observable<string> = httpsCallableData(this.fns, PublicFunctionNames.ON_CALL_UPDATE_SESSION_RATING);
    
    return updateSessionRatingHttpCall(sessionRatingWithId)
      .pipe(
        take(1),
        map( pubSubMessageId => {
          console.log('Session rating submitted', pubSubMessageId)
          return pubSubMessageId;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error submitting sessionRating', error);
          return throwError(() => new Error(error));
        })
      );
  }

  private getTrainingSessionCollection(): CollectionReference<TrainingSession> {
    return collection(this.afs, PublicCollectionPaths.TRAINING_SESSIONS) as CollectionReference<TrainingSession>;
  }

  private getTrainingSessionDoc(sessionId: string): DocumentReference<TrainingSession> {
    return doc(this.getTrainingSessionCollection(), sessionId);
  }

  private generateNewTrainingSessionDocumentId(): string {
    return doc(this.getTrainingSessionCollection()).id;
  }

  private getSessionRatingCollection(sessionId: string): CollectionReference<SessionRating> {
    return collection(this.afs, `${PublicCollectionPaths.TRAINING_SESSIONS}/${sessionId}/${PublicCollectionPaths.SESSION_RATINGS}}`) as CollectionReference<SessionRating>;
  }

  private getSessionRatingDoc(sessionId: string, sessionRatingId: string): DocumentReference<SessionRating> {
    return doc(this.getSessionRatingCollection(sessionId), sessionRatingId);
  }

  private generateNewSessionRatingDocumentId(sessionId: string): string {
    return doc(this.getSessionRatingCollection(sessionId)).id;
  }

}
