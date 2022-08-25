import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { PlanSessionFragment } from "shared-models/train/plan-session-fragment.model";
import { PlanSessionFragmentState } from "./state";
import * as fromPlanSessionFragments from './reducer';

const selectPlanSessionFragmentState = createFeatureSelector<PlanSessionFragmentState>(PublicStoreFeatureKeys.PLAN_SESSSION_FRAGMENT);

const getAllPlanSessionFragmentsFetched = (state: PlanSessionFragmentState) => state.allPlanSessionFragmentsFetched;
const getBatchModifyPlanSessionFragmentsError = (state: PlanSessionFragmentState) => state.batchModifyPlanSessionFragmentsError;
const getBatchModifyPlanSessionFragmentsProcessing = (state: PlanSessionFragmentState) => state.batchModifyPlanSessionFragmentsProcessing;
const getCreatePlanSessionFragmentError = (state: PlanSessionFragmentState) => state.createPlanSessionFragmentError;
const getCreatePlanSessionFragmentProcessing = (state: PlanSessionFragmentState) => state.createPlanSessionFragmentProcessing;
const getDeletePlanSessionFragmentError = (state: PlanSessionFragmentState) => state.deletePlanSessionFragmentError;
const getDeletePlanSessionFragmentProcessing = (state: PlanSessionFragmentState) => state.deletePlanSessionFragmentProcessing;
const getFetchAllPlanSessionFragmentsError = (state: PlanSessionFragmentState) => state.fetchAllPlanSessionFragmentsError;
const getFetchAllPlanSessionFragmentsProcessing = (state: PlanSessionFragmentState) => state.fetchAllPlanSessionFragmentsProcessing;
const getFetchMultiplePlanSessionFragmentsError = (state: PlanSessionFragmentState) => state.fetchMultiplePlanSessionFragmentsError;
const getFetchMultiplePlanSessionFragmentsProcessing = (state: PlanSessionFragmentState) => state.fetchMultiplePlanSessionFragmentsProcessing;
const getFetchSinglePlanSessionFragmentError = (state: PlanSessionFragmentState) => state.fetchSinglePlanSessionFragmentError;
const getFetchSinglePlanSessionFragmentProcessing = (state: PlanSessionFragmentState) => state.fetchSinglePlanSessionFragmentProcessing;
const getUpdatePlanSessionFragmentError = (state: PlanSessionFragmentState) => state.updatePlanSessionFragmentError;
const getUpdatePlanSessionFragmentProcessing = (state: PlanSessionFragmentState) => state.updatePlanSessionFragmentProcessing;

export const selectAllPlanSessionFragmentsInStore: (state: object) => PlanSessionFragment[] = createSelector(
  selectPlanSessionFragmentState,
  fromPlanSessionFragments.selectAll
);

export const selectAllPlanSessionFragmentsFetched = createSelector(
  selectPlanSessionFragmentState,
  getAllPlanSessionFragmentsFetched
);

export const selectBatchModifyPlanSessionFragmentsError = createSelector(
  selectPlanSessionFragmentState,
  getBatchModifyPlanSessionFragmentsError
);

export const selectBatchModifyPlanSessionFragmentsProcessing = createSelector(
  selectPlanSessionFragmentState,
  getBatchModifyPlanSessionFragmentsProcessing
);

export const selectCreatePlanSessionFragmentError = createSelector(
  selectPlanSessionFragmentState,
  getCreatePlanSessionFragmentError
);

export const selectCreatePlanSessionFragmentProcessing = createSelector(
  selectPlanSessionFragmentState,
  getCreatePlanSessionFragmentProcessing
);

export const selectDeletePlanSessionFragmentError = createSelector(
  selectPlanSessionFragmentState,
  getDeletePlanSessionFragmentError
);

export const selectDeletePlanSessionFragmentProcessing = createSelector(
  selectPlanSessionFragmentState,
  getDeletePlanSessionFragmentProcessing
);

export const selectFetchSinglePlanSessionFragmentError = createSelector(
  selectPlanSessionFragmentState,
  getFetchSinglePlanSessionFragmentError
);

export const selectFetchSinglePlanSessionFragmentProcessing = createSelector(
  selectPlanSessionFragmentState,
  getFetchSinglePlanSessionFragmentProcessing
);

export const selectFetchAllPlanSessionFragmentsError = createSelector(
  selectPlanSessionFragmentState,
  getFetchAllPlanSessionFragmentsError
);

export const selectFetchAllPlanSessionFragmentsProcessing = createSelector(
  selectPlanSessionFragmentState,
  getFetchAllPlanSessionFragmentsProcessing
);

export const selectFetchMultiplePlanSessionFragmentsError = createSelector(
  selectPlanSessionFragmentState,
  getFetchMultiplePlanSessionFragmentsError
);

export const selectFetchMultiplePlanSessionFragmentsProcessing = createSelector(
  selectPlanSessionFragmentState,
  getFetchMultiplePlanSessionFragmentsProcessing
);

export const selectPlanSessionFragmentById: (planSessionFragmentId: string) => MemoizedSelector<object, PlanSessionFragment | undefined> = (planSessionFragmentId: string) => createSelector(
  selectPlanSessionFragmentState,
  planSessionFragmentState => planSessionFragmentState.entities[planSessionFragmentId]
);

export const selectUpdatePlanSessionFragmentError = createSelector(
  selectPlanSessionFragmentState,
  getUpdatePlanSessionFragmentError
);

export const selectUpdatePlanSessionFragmentProcessing = createSelector(
  selectPlanSessionFragmentState,
  getUpdatePlanSessionFragmentProcessing
);
