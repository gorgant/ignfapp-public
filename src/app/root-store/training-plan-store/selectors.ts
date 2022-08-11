import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { TrainingPlan } from "shared-models/train/training-plan.model";
import { TrainingPlanState } from "./state";
import * as fromTrainingPlans from './reducer';

const selectTrainingPlanState = createFeatureSelector<TrainingPlanState>(PublicStoreFeatureKeys.TRAINING_PLAN);

const getAllTrainingPlansFetched = (state: TrainingPlanState) => state.allTrainingPlansFetched;
const getCreateTrainingPlanError = (state: TrainingPlanState) => state.createTrainingPlanError;
const getCreateTrainingPlanProcessing = (state: TrainingPlanState) => state.createTrainingPlanProcessing;
const getDeleteTrainingPlanError = (state: TrainingPlanState) => state.deleteTrainingPlanError;
const getDeleteTrainingPlanProcessing = (state: TrainingPlanState) => state.deleteTrainingPlanProcessing;
const getFetchAllTrainingPlansError = (state: TrainingPlanState) => state.fetchAllTrainingPlansError;
const getFetchAllTrainingPlansProcessing = (state: TrainingPlanState) => state.fetchAllTrainingPlansProcessing;
const getFetchMultipleTrainingPlansError = (state: TrainingPlanState) => state.fetchMultipleTrainingPlansError;
const getFetchMultipleTrainingPlansProcessing = (state: TrainingPlanState) => state.fetchMultipleTrainingPlansProcessing;
const getFetchSingleTrainingPlanError = (state: TrainingPlanState) => state.fetchSingleTrainingPlanError;
const getFetchSingleTrainingPlanProcessing = (state: TrainingPlanState) => state.fetchSingleTrainingPlanProcessing;
const getNewTrainingPlanId = (state: TrainingPlanState) => state.newTrainingPlanId;
const getUpdateTrainingPlanError = (state: TrainingPlanState) => state.updateTrainingPlanError;
const getUpdateTrainingPlanProcessing = (state: TrainingPlanState) => state.updateTrainingPlanProcessing;

export const selectAllTrainingPlansInStore: (state: object) => TrainingPlan[] = createSelector(
  selectTrainingPlanState,
  fromTrainingPlans.selectAll
);

export const selectAllTrainingPlansFetched = createSelector(
  selectTrainingPlanState,
  getAllTrainingPlansFetched
);

export const selectCreateTrainingPlanError = createSelector(
  selectTrainingPlanState,
  getCreateTrainingPlanError
);

export const selectCreateTrainingPlanProcessing = createSelector(
  selectTrainingPlanState,
  getCreateTrainingPlanProcessing
);

export const selectDeleteTrainingPlanError = createSelector(
  selectTrainingPlanState,
  getDeleteTrainingPlanError
);

export const selectDeleteTrainingPlanProcessing = createSelector(
  selectTrainingPlanState,
  getDeleteTrainingPlanProcessing
);

export const selectFetchSingleTrainingPlanError = createSelector(
  selectTrainingPlanState,
  getFetchSingleTrainingPlanError
);

export const selectFetchSingleTrainingPlanProcessing = createSelector(
  selectTrainingPlanState,
  getFetchSingleTrainingPlanProcessing
);

export const selectFetchAllTrainingPlansError = createSelector(
  selectTrainingPlanState,
  getFetchAllTrainingPlansError
);

export const selectFetchAllTrainingPlansProcessing = createSelector(
  selectTrainingPlanState,
  getFetchAllTrainingPlansProcessing
);

export const selectFetchMultipleTrainingPlansError = createSelector(
  selectTrainingPlanState,
  getFetchMultipleTrainingPlansError
);

export const selectFetchMultipleTrainingPlansProcessing = createSelector(
  selectTrainingPlanState,
  getFetchMultipleTrainingPlansProcessing
);

export const selectNewTrainingPlanId = createSelector(
  selectTrainingPlanState,
  getNewTrainingPlanId
);

export const selectTrainingPlanById: (trainingPlanId: string) => MemoizedSelector<object, TrainingPlan | undefined> = (trainingPlanId: string) => createSelector(
  selectTrainingPlanState,
  trainingPlanState => trainingPlanState.entities[trainingPlanId]
);

export const selectUpdateTrainingPlanError = createSelector(
  selectTrainingPlanState,
  getUpdateTrainingPlanError
);

export const selectUpdateTrainingPlanProcessing = createSelector(
  selectTrainingPlanState,
  getUpdateTrainingPlanProcessing
);
