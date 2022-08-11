import { Update } from "@ngrx/entity";
import { createAction, props } from "@ngrx/store";
import { FirebaseError } from "firebase/app";
import { FirestoreCollectionQueryParams } from "shared-models/firestore/fs-collection-query-params.model";
import { PlanSessionFragment, PlanSessionFragmentNoIdOrTimestamp } from "shared-models/train/plan-session-fragment.model";

// Create Plan Session Fragment

export const createPlanSessionFragmentRequested = createAction(
  '[AppWide] Create Plan Session Fragment Requested',
  props<{trainingPlanId: string, planSessionFragmentNoId: PlanSessionFragmentNoIdOrTimestamp}>()
);

export const createPlanSessionFragmentCompleted = createAction(
  '[Train Service] Create Plan Session Fragment Completed',
  props<{planSessionFragment: PlanSessionFragment}>()
);

export const createPlanSessionFragmentFailed = createAction(
  '[Train Service] Create Plan Session Fragment Failed',
  props<{error: FirebaseError}>()
);

// Delete Plan Session Fragment

export const deletePlanSessionFragmentRequested = createAction(
  '[Edit Plan Session Fragment] Delete Plan Session Fragment Requested',
  props<{trainingPlanId: string, planSessionFragmentId: string}>()
);

export const deletePlanSessionFragmentCompleted = createAction(
  '[Train Service] Delete Plan Session Fragment Completed',
  props<{planSessionFragmentId: string}>()
);

export const deletePlanSessionFragmentFailed = createAction(
  '[Train Service] Delete Plan Session Fragment Failed',
  props<{error: FirebaseError}>()
);

// Fetch All Plan Session Fragments

export const fetchAllPlanSessionFragmentsRequested = createAction(
  '[AppWide] Fetch All Plan Session Fragments Requested',
  props<{trainingPlanId: string}>()
);

export const fetchAllPlanSessionFragmentsCompleted = createAction(
  '[Train Service] Fetch All Plan Session Fragments Completed',
  props<{planSessionFragments: PlanSessionFragment[]}>()
);

export const fetchAllPlanSessionFragmentsFailed = createAction(
  '[Train Service] Fetch All Plan Session Fragments Failed',
  props<{error: FirebaseError}>()
);

// Fetch Multiple Plan Session Fragments

export const fetchMultiplePlanSessionFragmentsRequested = createAction(
  '[AppWide] Fetch Multiple Plan Session Fragments Requested',
  props<{trainingPlanId: string, queryParams: FirestoreCollectionQueryParams}>()
);

export const fetchMultiplePlanSessionFragmentsCompleted = createAction(
  '[Train Service] Fetch Multiple Plan Session Fragments Completed',
  props<{planSessionFragments: PlanSessionFragment[]}>()
);

export const fetchMultiplePlanSessionFragmentsFailed = createAction(
  '[Train Service] Fetch Multiple Plan Session Fragments Failed',
  props<{error: FirebaseError}>()
);

// Fetch Single Plan Session Fragment

export const fetchSinglePlanSessionFragmentRequested = createAction(
  '[AppWide] Fetch Single Plan Session Fragment Requested',
  props<{trainingPlanId: string, planSessionFragmentId: string}>()
);

export const fetchSinglePlanSessionFragmentCompleted = createAction(
  '[Train Service] Fetch Single Plan Session Fragment Completed',
  props<{planSessionFragment: PlanSessionFragment}>()
);

export const fetchSinglePlanSessionFragmentFailed = createAction(
  '[Train Service] Fetch Single Plan Session Fragment Failed',
  props<{error: FirebaseError}>()
);

// Purge Trainining PlanSessionFragment Data

export const purgePlanSessionFragmentData = createAction(
  '[AppWide] Purge Plan Session Fragment Data'
);

// Update Plan Session Fragment

export const updatePlanSessionFragmentRequested = createAction(
  '[Edit Plan Session Fragment] Update Plan Session Fragment Requested',
  props<{trainingPlanId: string, planSessionFragmentUpdates: Update<PlanSessionFragment>}>()
);

export const updatePlanSessionFragmentCompleted = createAction(
  '[Train Service] Update Plan Session Fragment Completed',
  props<{planSessionFragmentUpdates: Update<PlanSessionFragment>}>()
);

export const updatePlanSessionFragmentFailed = createAction(
  '[Train Service] Update Plan Session Fragment Failed',
  props<{error: FirebaseError}>()
);

