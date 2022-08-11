import { Update } from "@ngrx/entity";
import { createAction, props } from "@ngrx/store";
import { FirebaseError } from "firebase/app";
import { FirestoreCollectionQueryParams } from "shared-models/firestore/fs-collection-query-params.model";
import { TrainingPlan, TrainingPlanNoIdOrTimestamp } from "shared-models/train/training-plan.model";

// Create Training Plan

export const createTrainingPlanRequested = createAction(
  '[Edit Training Plan] Create Training Plan Requested',
  props<{trainingPlanNoId: TrainingPlanNoIdOrTimestamp}>()
);

export const createTrainingPlanCompleted = createAction(
  '[Train Service] Create Training Plan Completed',
  props<{trainingPlan: TrainingPlan}>()
);

export const createTrainingPlanFailed = createAction(
  '[Train Service] Create Training Plan Failed',
  props<{error: FirebaseError}>()
);

// Delete Training Plan

export const deleteTrainingPlanRequested = createAction(
  '[Edit Training Plan] Delete Training Plan Requested',
  props<{trainingPlanId: string}>()
);

export const deleteTrainingPlanCompleted = createAction(
  '[Train Service] Delete Training Plan Completed',
  props<{trainingPlanId: string}>()
);

export const deleteTrainingPlanFailed = createAction(
  '[Train Service] Delete Training Plan Failed',
  props<{error: FirebaseError}>()
);

// Fetch All Training Plans

export const fetchAllTrainingPlansRequested = createAction(
  '[AppWide] Fetch All Training Plans Requested'
);

export const fetchAllTrainingPlansCompleted = createAction(
  '[Train Service] Fetch All Training Plans Completed',
  props<{trainingPlans: TrainingPlan[]}>()
);

export const fetchAllTrainingPlansFailed = createAction(
  '[Train Service] Fetch All Training Plans Failed',
  props<{error: FirebaseError}>()
);

// Fetch Multiple Training Plans

export const fetchMultipleTrainingPlansRequested = createAction(
  '[AppWide] Fetch Multiple Training Plans Requested',
  props<{queryParams: FirestoreCollectionQueryParams}>()
);

export const fetchMultipleTrainingPlansCompleted = createAction(
  '[Train Service] Fetch Multiple Training Plans Completed',
  props<{trainingPlans: TrainingPlan[]}>()
);

export const fetchMultipleTrainingPlansFailed = createAction(
  '[Train Service] Fetch Multiple Training Plans Failed',
  props<{error: FirebaseError}>()
);

// Fetch Single Training Plan

export const fetchSingleTrainingPlanRequested = createAction(
  '[AppWide] Fetch Single Training Plan Requested',
  props<{trainingPlanId: string}>()
);

export const fetchSingleTrainingPlanCompleted = createAction(
  '[Train Service] Fetch Single Training Plan Completed',
  props<{trainingPlan: TrainingPlan}>()
);

export const fetchSingleTrainingPlanFailed = createAction(
  '[Train Service] Fetch Single Training Plan Failed',
  props<{error: FirebaseError}>()
);

// Purge New Training Plan Id

export const purgeNewTrainingPlanId = createAction(
  '[Edit Training Plan] Purge New Training Plan Id'
);

// Purge Trainining Plan Data

export const purgeTrainingPlanData = createAction(
  '[AppWide] Purge Training Plan Data'
);

// Update Training Plan

export const updateTrainingPlanRequested = createAction(
  '[Edit Training Plan] Update Training Plan Requested',
  props<{trainingPlanUpdates: Update<TrainingPlan>}>()
);

export const updateTrainingPlanCompleted = createAction(
  '[Train Service] Update Training Plan Completed',
  props<{trainingPlanUpdates: Update<TrainingPlan>}>()
);

export const updateTrainingPlanFailed = createAction(
  '[Train Service] Update Training Plan Failed',
  props<{error: FirebaseError}>()
);

