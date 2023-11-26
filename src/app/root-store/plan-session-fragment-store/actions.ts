import { Update } from "@ngrx/entity";
import { createAction, props } from "@ngrx/store";
import { FirebaseError } from "firebase/app";
import { FirestoreCollectionQueryParams } from "shared-models/firestore/fs-collection-query-params.model";
import { PlanSessionFragment, PlanSessionFragmentNoIdOrTimestamp } from "shared-models/train/plan-session-fragment.model";
import { TrainingPlan, TrainingPlanVisibilityCategoryDbOption } from "shared-models/train/training-plan.model";

// Batch Delete Plan Session Fragments

export const batchDeletePlanSessionFragmentsRequested = createAction(
  '[Edit Plan Session Fragment] Batch Delete Plan Session Fragments Requested',
  props<{trainingPlan: TrainingPlan, planSessionFragmentIds: string[], userId: string}>()
);

export const batchDeletePlanSessionFragmentsCompleted = createAction(
  '[Plan Session Fragment Service] Batch Delete Plan Session Fragments Completed',
  props<{planSessionFragmentIds: string[]}>()
);

export const batchDeletePlanSessionFragmentsFailed = createAction(
  '[Plan Session Fragment Service] Batch Delete Plan Session Fragments Failed',
  props<{error: FirebaseError}>()
);

// Batch Modify Plan Session Fragments

export const batchModifyPlanSessionFragmentsRequested = createAction(
  '[Edit Plan Session Fragment] Batch Modify Plan Session Fragments Requested',
  props<{trainingPlan: TrainingPlan, planSessionFragmentUpdates: Update<PlanSessionFragment>[], userId: string}>()
);

export const batchModifyPlanSessionFragmentsCompleted = createAction(
  '[Plan Session Fragment Service] Batch Modify Plan Session Fragments Completed',
  props<{planSessionFragmentUpdates: Update<PlanSessionFragment>[]}>()
);

export const batchModifyPlanSessionFragmentsFailed = createAction(
  '[Plan Session Fragment Service] Batch Modify Plan Session Fragments Failed',
  props<{error: FirebaseError}>()
);

// Create Plan Session Fragment

export const createPlanSessionFragmentRequested = createAction(
  '[AppWide] Create Plan Session Fragment Requested',
  props<{trainingPlanId: string, planSessionFragmentNoId: PlanSessionFragmentNoIdOrTimestamp, userId: string}>()
);

export const createPlanSessionFragmentCompleted = createAction(
  '[Plan Session Fragment Service] Create Plan Session Fragment Completed',
  props<{planSessionFragment: PlanSessionFragment}>()
);

export const createPlanSessionFragmentFailed = createAction(
  '[Plan Session Fragment Service] Create Plan Session Fragment Failed',
  props<{error: FirebaseError}>()
);

// Delete Plan Session Fragment

export const deletePlanSessionFragmentRequested = createAction(
  '[Edit Plan Session Fragment] Delete Plan Session Fragment Requested',
  props<{trainingPlanId: string, planSessionFragment: PlanSessionFragment, userId: string}>()
);

export const deletePlanSessionFragmentCompleted = createAction(
  '[Plan Session Fragment Service] Delete Plan Session Fragment Completed',
  props<{planSessionFragmentId: string}>()
);

export const deletePlanSessionFragmentFailed = createAction(
  '[Plan Session Fragment Service] Delete Plan Session Fragment Failed',
  props<{error: FirebaseError}>()
);

// Fetch All Plan Session Fragments

export const fetchAllPlanSessionFragmentsRequested = createAction(
  '[AppWide] Fetch All Plan Session Fragments Requested',
  props<{trainingPlan: TrainingPlan, userId: string}>()
);

export const fetchAllPlanSessionFragmentsCompleted = createAction(
  '[Plan Session Fragment Service] Fetch All Plan Session Fragments Completed',
  props<{planSessionFragments: PlanSessionFragment[]}>()
);

export const fetchAllPlanSessionFragmentsFailed = createAction(
  '[Plan Session Fragment Service] Fetch All Plan Session Fragments Failed',
  props<{error: FirebaseError}>()
);

// Fetch Multiple Plan Session Fragments

export const fetchMultiplePlanSessionFragmentsRequested = createAction(
  '[AppWide] Fetch Multiple Plan Session Fragments Requested',
  props<{trainingPlan: TrainingPlan, queryParams: FirestoreCollectionQueryParams, userId: string}>()
);

export const fetchMultiplePlanSessionFragmentsCompleted = createAction(
  '[Plan Session Fragment Service] Fetch Multiple Plan Session Fragments Completed',
  props<{planSessionFragments: PlanSessionFragment[]}>()
);

export const fetchMultiplePlanSessionFragmentsFailed = createAction(
  '[Plan Session Fragment Service] Fetch Multiple Plan Session Fragments Failed',
  props<{error: FirebaseError}>()
);

// Fetch Single Plan Session Fragment

export const fetchSinglePlanSessionFragmentRequested = createAction(
  '[AppWide] Fetch Single Plan Session Fragment Requested',
  props<{trainingPlanId: string, planSessionFragmentId: string, userId: string, visibilityCategory: TrainingPlanVisibilityCategoryDbOption}>()
);

export const fetchSinglePlanSessionFragmentCompleted = createAction(
  '[Plan Session Fragment Service] Fetch Single Plan Session Fragment Completed',
  props<{planSessionFragment: PlanSessionFragment}>()
);

export const fetchSinglePlanSessionFragmentFailed = createAction(
  '[Plan Session Fragment Service] Fetch Single Plan Session Fragment Failed',
  props<{error: FirebaseError}>()
);

// Purge Plan Session Fragment Data

export const purgePlanSessionFragmentData = createAction(
  '[AppWide] Purge Plan Session Fragment Data'
);

// Purge Plan Session Fragment Errors

export const purgePlanSessionFragmentErrors = createAction(
  '[AppWide] Purge Plan Session Fragment Errors'
);

// Update Plan Session Fragment

export const updatePlanSessionFragmentRequested = createAction(
  '[Edit Plan Session Fragment] Update Plan Session Fragment Requested',
  props<{trainingPlanId: string, planSessionFragmentUpdates: Update<PlanSessionFragment>, userId: string, visibilityCategory: TrainingPlanVisibilityCategoryDbOption}>()
);

export const updatePlanSessionFragmentCompleted = createAction(
  '[Plan Session Fragment Service] Update Plan Session Fragment Completed',
  props<{planSessionFragmentUpdates: Update<PlanSessionFragment>}>()
);

export const updatePlanSessionFragmentFailed = createAction(
  '[Plan Session Fragment Service] Update Plan Session Fragment Failed',
  props<{error: FirebaseError}>()
);

