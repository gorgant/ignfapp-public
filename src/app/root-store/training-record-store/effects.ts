import { Injectable, inject } from "@angular/core";
import { FirebaseError } from "@angular/fire/app";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, concatMap, map, switchMap } from "rxjs/operators";
import { TrainingRecordService } from "src/app/core/services/training-record.service";
import * as TrainingRecordStoreActions from './actions';

@Injectable()
export class TrainingRecordStoreEffects {

  private actions$ = inject(Actions);
  private trainingRecordService = inject(TrainingRecordService);

  constructor() { }

  createTrainingRecordEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingRecordStoreActions.createTrainingRecordRequested),
      concatMap(action => 
        this.trainingRecordService.createTrainingRecord(action.userId, action.trainingRecordNoId).pipe(
          map(trainingRecord => {
            return TrainingRecordStoreActions.createTrainingRecordCompleted({trainingRecord});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingRecordStoreActions.createTrainingRecordFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  deleteTrainingRecordEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingRecordStoreActions.deleteTrainingRecordRequested),
      concatMap(action => 
        this.trainingRecordService.deleteTrainingRecord(action.userId, action.recordId).pipe(
          map(recordId => {
            return TrainingRecordStoreActions.deleteTrainingRecordCompleted({recordId});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingRecordStoreActions.deleteTrainingRecordFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchAllTrainingRecordsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingRecordStoreActions.fetchAllTrainingRecordsRequested),
      switchMap(action => 
        this.trainingRecordService.fetchAllTrainingRecords(action.userId).pipe(
          map(trainingRecords => {
            return TrainingRecordStoreActions.fetchAllTrainingRecordsCompleted({trainingRecords});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingRecordStoreActions.fetchAllTrainingRecordsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchMultipleTrainingRecordsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingRecordStoreActions.fetchMultipleTrainingRecordsRequested),
      switchMap(action => 
        this.trainingRecordService.fetchMultipleTrainingRecords(action.userId, action.queryParams).pipe(
          map(trainingRecords => {
            return TrainingRecordStoreActions.fetchMultipleTrainingRecordsCompleted({trainingRecords});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingRecordStoreActions.fetchMultipleTrainingRecordsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchSingleTrainingRecordEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingRecordStoreActions.fetchSingleTrainingRecordRequested),
      switchMap(action => 
        this.trainingRecordService.fetchSingleTrainingRecord(action.userId, action.recordId).pipe(
          map(trainingRecord => {
            return TrainingRecordStoreActions.fetchSingleTrainingRecordCompleted({trainingRecord});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingRecordStoreActions.fetchSingleTrainingRecordFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  updateTrainingRecordEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingRecordStoreActions.updateTrainingRecordRequested),
      concatMap(action => 
        this.trainingRecordService.updateTrainingRecord(action.userId, action.trainingRecordUpdates).pipe(
          map(trainingRecordUpdates => {
            return TrainingRecordStoreActions.updateTrainingRecordCompleted({trainingRecordUpdates});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingRecordStoreActions.updateTrainingRecordFailed({error: fbError}));
          })
        )
      ),
    ),
  );

}