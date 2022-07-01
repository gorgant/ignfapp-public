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
        this.trainingSessionService.createTrainingSession(action.trainingSessionNoId).pipe(
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
        this.trainingSessionService.deleteTrainingSession(action.sessionId).pipe(
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

  fetchMultipleTrainingSessionsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingSessionStoreActions.fetchMultipleTrainingSessionsRequested),
      switchMap(action => 
        this.trainingSessionService.fetchMultipleTrainingSessions(action.queryParams).pipe(
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
        this.trainingSessionService.fetchSingleTrainingSession(action.sessionId).pipe(
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
        this.trainingSessionService.fetchYoutubeVideoData(action.videoId).pipe(
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

  updateTrainingSessionEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingSessionStoreActions.updateTrainingSessionRequested),
      concatMap(action => 
        this.trainingSessionService.updateTrainingSession(action.trainingSessionUpdates).pipe(
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