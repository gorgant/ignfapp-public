import { Injectable } from "@angular/core";
import { FirebaseError } from "@angular/fire/app";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, concatMap, map, switchMap } from "rxjs/operators";
import { TrainingSessionService } from "src/app/core/services/training-session.service";
import * as TrainingSessionStoreActions from './actions';

@Injectable()
export class TrainingSessionStoreEffects {

  constructor(
    private actions$: Actions,
    private trainingSessionService: TrainingSessionService,
  ) { }

  createTrainingSessionEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingSessionStoreActions.createTrainingSessionRequested),
      concatMap(action => 
        this.trainingSessionService.createTrainingSession(action.trainingSessionNoId, action.userId).pipe(
          map(trainingSession => {
            return TrainingSessionStoreActions.createTrainingSessionCompleted({trainingSession});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingSessionStoreActions.createTrainingSessionFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  deleteTrainingSessionEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingSessionStoreActions.deleteTrainingSessionRequested),
      concatMap(action => 
        this.trainingSessionService.deleteTrainingSession(action.trainingSession, action.userId).pipe(
          map(sessionId => {
            return TrainingSessionStoreActions.deleteTrainingSessionCompleted({sessionId});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingSessionStoreActions.deleteTrainingSessionFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchAllTrainingSessionsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingSessionStoreActions.fetchAllTrainingSessionsRequested),
      switchMap(action => 
        this.trainingSessionService.fetchAllTrainingSessions(action.userId).pipe(
          map(trainingSessions => {
            return TrainingSessionStoreActions.fetchAllTrainingSessionsCompleted({trainingSessions});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingSessionStoreActions.fetchAllTrainingSessionsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchMultipleTrainingSessionsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingSessionStoreActions.fetchMultipleTrainingSessionsRequested),
      switchMap(action => 
        this.trainingSessionService.fetchMultipleTrainingSessions(action.queryParams, action.userId).pipe(
          map(trainingSessions => {
            return TrainingSessionStoreActions.fetchMultipleTrainingSessionsCompleted({trainingSessions});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingSessionStoreActions.fetchMultipleTrainingSessionsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchSingleTrainingSessionEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingSessionStoreActions.fetchSingleTrainingSessionRequested),
      switchMap(action => 
        this.trainingSessionService.fetchSingleTrainingSession(action.sessionId, action.userId, action.visibilityCategory).pipe(
          map(trainingSession => {
            return TrainingSessionStoreActions.fetchSingleTrainingSessionCompleted({trainingSession});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingSessionStoreActions.fetchSingleTrainingSessionFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchYoutubeVideoDataEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingSessionStoreActions.fetchYoutubeVideoDataRequested),
      switchMap(action => 
        this.trainingSessionService.fetchYoutubeVideoData(action.fetchYoutubeVideoData).pipe(
          map(youtubeVideoData => {
            return TrainingSessionStoreActions.fetchYoutubeVideoDataCompleted({youtubeVideoData});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingSessionStoreActions.fetchYoutubeVideoDataFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  updateSessionRatingEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingSessionStoreActions.updateSessionRatingRequested),
      concatMap(action => 
        this.trainingSessionService.createSessionRating(action.sessionRating).pipe(
          map(pubSubMessageId => {
            return TrainingSessionStoreActions.updateSessionRatingCompleted({pubSubMessageId});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingSessionStoreActions.updateSessionRatingFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  updateTrainingSessionEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingSessionStoreActions.updateTrainingSessionRequested),
      concatMap(action => 
        this.trainingSessionService.updateTrainingSession(action.trainingSessionUpdates, action.userId, action.visibilityCategory).pipe(
          map(trainingSessionUpdates => {
            return TrainingSessionStoreActions.updateTrainingSessionCompleted({trainingSessionUpdates});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingSessionStoreActions.updateTrainingSessionFailed({error: fbError}));
          })
        )
      ),
    ),
  );

}