import { Injectable, inject } from "@angular/core";
import { FirebaseError } from "@angular/fire/app";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, concatMap, map, switchMap } from "rxjs/operators";
import { TrainingPlanService } from "src/app/core/services/training-plan.service";
import * as TrainingPlanStoreActions from './actions';

@Injectable()
export class TrainingPlanStoreEffects {

  private actions$ = inject(Actions);
  private trainingPlanService = inject(TrainingPlanService);

  constructor() { }

  createTrainingPlanEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingPlanStoreActions.createTrainingPlanRequested),
      concatMap(action => 
        this.trainingPlanService.createTrainingPlan(action.trainingPlanNoId, action.userId).pipe(
          map(trainingPlan => {
            return TrainingPlanStoreActions.createTrainingPlanCompleted({trainingPlan});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingPlanStoreActions.createTrainingPlanFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  deleteTrainingPlanEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingPlanStoreActions.deleteTrainingPlanRequested),
      concatMap(action => 
        this.trainingPlanService.deleteTrainingPlan(action.trainingPlan, action.userId).pipe(
          map(trainingPlanId => {
            return TrainingPlanStoreActions.deleteTrainingPlanCompleted({trainingPlanId});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingPlanStoreActions.deleteTrainingPlanFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchAllTrainingPlansEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingPlanStoreActions.fetchAllTrainingPlansRequested),
      switchMap(action => 
        this.trainingPlanService.fetchAllTrainingPlans(action.userId).pipe(
          map(trainingPlans => {
            return TrainingPlanStoreActions.fetchAllTrainingPlansCompleted({trainingPlans});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingPlanStoreActions.fetchAllTrainingPlansFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchMultipleTrainingPlansEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingPlanStoreActions.fetchMultipleTrainingPlansRequested),
      switchMap(action => 
        this.trainingPlanService.fetchMultipleTrainingPlans(action.queryParams, action.userId).pipe(
          map(trainingPlans => {
            return TrainingPlanStoreActions.fetchMultipleTrainingPlansCompleted({trainingPlans});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingPlanStoreActions.fetchMultipleTrainingPlansFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchSingleTrainingPlanEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingPlanStoreActions.fetchSingleTrainingPlanRequested),
      switchMap(action => 
        this.trainingPlanService.fetchSingleTrainingPlan(action.trainingPlanId, action.userId, action.visibilityCategory).pipe(
          map(trainingPlan => {
            return TrainingPlanStoreActions.fetchSingleTrainingPlanCompleted({trainingPlan});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingPlanStoreActions.fetchSingleTrainingPlanFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  updateTrainingPlanEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(TrainingPlanStoreActions.updateTrainingPlanRequested),
      concatMap(action => 
        this.trainingPlanService.updateTrainingPlan(action.trainingPlanUpdates, action.userId, action.visibilityCategory).pipe(
          map(trainingPlanUpdates => {
            return TrainingPlanStoreActions.updateTrainingPlanCompleted({trainingPlanUpdates});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(TrainingPlanStoreActions.updateTrainingPlanFailed({error: fbError}));
          })
        )
      ),
    ),
  );

}