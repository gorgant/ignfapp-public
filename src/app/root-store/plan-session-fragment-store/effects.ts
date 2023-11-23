import { Injectable } from "@angular/core";
import { FirebaseError } from "@angular/fire/app";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, concatMap, map, switchMap } from "rxjs/operators";
import { PlanSessionFragmentService } from "src/app/core/services/plan-session-fragment.service";
import * as PlanSessionFragmentStoreActions from './actions';

@Injectable()
export class PlanSessionFragmentStoreEffects {

  constructor(
    private actions$: Actions,
    private planSessionFragmentService: PlanSessionFragmentService,
  ) { }

  batchDeletePlanSessionFragmentsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PlanSessionFragmentStoreActions.batchDeletePlanSessionFragmentsRequested),
      concatMap(action => 
        this.planSessionFragmentService.batchDeletePlanSessionFragments(action.trainingPlan, action.planSessionFragmentIds, action.userId).pipe(
          map(planSessionFragmentIds => {
            return PlanSessionFragmentStoreActions.batchDeletePlanSessionFragmentsCompleted({planSessionFragmentIds});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PlanSessionFragmentStoreActions.batchDeletePlanSessionFragmentsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  batchModifyPlanSessionFragmentsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PlanSessionFragmentStoreActions.batchModifyPlanSessionFragmentsRequested),
      concatMap(action => 
        this.planSessionFragmentService.batchModifyPlanSessionFragments(action.trainingPlan, action.planSessionFragmentUpdates, action.userId).pipe(
          map(planSessionFragmentUpdates => {
            return PlanSessionFragmentStoreActions.batchModifyPlanSessionFragmentsCompleted({planSessionFragmentUpdates});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PlanSessionFragmentStoreActions.batchModifyPlanSessionFragmentsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  createPlanSessionFragmentEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PlanSessionFragmentStoreActions.createPlanSessionFragmentRequested),
      concatMap(action => 
        this.planSessionFragmentService.createPlanSessionFragment(action.trainingPlanId, action.planSessionFragmentNoId, action.userId).pipe(
          map(planSessionFragment => {
            return PlanSessionFragmentStoreActions.createPlanSessionFragmentCompleted({planSessionFragment});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PlanSessionFragmentStoreActions.createPlanSessionFragmentFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  deletePlanSessionFragmentEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PlanSessionFragmentStoreActions.deletePlanSessionFragmentRequested),
      concatMap(action => 
        this.planSessionFragmentService.deletePlanSessionFragment(action.trainingPlanId, action.planSessionFragment, action.userId).pipe(
          map(planSessionFragmentId => {
            return PlanSessionFragmentStoreActions.deletePlanSessionFragmentCompleted({planSessionFragmentId});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PlanSessionFragmentStoreActions.deletePlanSessionFragmentFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchAllPlanSessionFragmentsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsRequested),
      switchMap(action => 
        this.planSessionFragmentService.fetchAllPlanSessionFragments(action.trainingPlan, action.userId).pipe(
          map(planSessionFragments => {
            return PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsCompleted({planSessionFragments});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchMultiplePlanSessionFragmentsEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PlanSessionFragmentStoreActions.fetchMultiplePlanSessionFragmentsRequested),
      switchMap(action => 
        this.planSessionFragmentService.fetchMultiplePlanSessionFragments(action.trainingPlan, action.queryParams, action.userId).pipe(
          map(planSessionFragments => {
            return PlanSessionFragmentStoreActions.fetchMultiplePlanSessionFragmentsCompleted({planSessionFragments});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PlanSessionFragmentStoreActions.fetchMultiplePlanSessionFragmentsFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchSinglePlanSessionFragmentEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PlanSessionFragmentStoreActions.fetchSinglePlanSessionFragmentRequested),
      switchMap(action => 
        this.planSessionFragmentService.fetchSinglePlanSessionFragment(action.trainingPlanId, action.planSessionFragmentId, action.userId, action.visibilityCategory).pipe(
          map(planSessionFragment => {
            return PlanSessionFragmentStoreActions.fetchSinglePlanSessionFragmentCompleted({planSessionFragment});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PlanSessionFragmentStoreActions.fetchSinglePlanSessionFragmentFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  updatePlanSessionFragmentEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(PlanSessionFragmentStoreActions.updatePlanSessionFragmentRequested),
      concatMap(action => 
        this.planSessionFragmentService.updatePlanSessionFragment(action.trainingPlanId, action.planSessionFragmentUpdates, action.userId, action.visibilityCategory).pipe(
          map(planSessionFragmentUpdates => {
            return PlanSessionFragmentStoreActions.updatePlanSessionFragmentCompleted({planSessionFragmentUpdates});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(PlanSessionFragmentStoreActions.updatePlanSessionFragmentFailed({error: fbError}));
          })
        )
      ),
    ),
  );

}