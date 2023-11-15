import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { PersonalSessionFragment } from "shared-models/train/personal-session-fragment.model";
import { PersonalSessionFragmentState } from "./state";
import * as fromPersonalSessionFragments from './reducer';

const selectPersonalSessionFragmentState = createFeatureSelector<PersonalSessionFragmentState>(PublicStoreFeatureKeys.PERSONAL_SESSSION_FRAGMENT);

const getAllPersonalSessionFragmentsFetched = (state: PersonalSessionFragmentState) => state.allPersonalSessionFragmentsFetched;
const getBatchCreatePersonalSessionFragmentsError = (state: PersonalSessionFragmentState) => state.batchCreatePersonalSessionFragmentsError;
const getBatchCreatePersonalSessionFragmentsProcessing = (state: PersonalSessionFragmentState) => state.batchCreatePersonalSessionFragmentsProcessing;
const getBatchDeletePersonalSessionFragmentsError = (state: PersonalSessionFragmentState) => state.batchDeletePersonalSessionFragmentsError;
const getBatchDeletePersonalSessionFragmentsProcessing = (state: PersonalSessionFragmentState) => state.batchDeletePersonalSessionFragmentsProcessing;
const getBatchModifyPersonalSessionFragmentsError = (state: PersonalSessionFragmentState) => state.batchModifyPersonalSessionFragmentsError;
const getBatchModifyPersonalSessionFragmentsProcessing = (state: PersonalSessionFragmentState) => state.batchModifyPersonalSessionFragmentsProcessing;
const getCreatePersonalSessionFragmentError = (state: PersonalSessionFragmentState) => state.createPersonalSessionFragmentError;
const getCreatePersonalSessionFragmentProcessing = (state: PersonalSessionFragmentState) => state.createPersonalSessionFragmentProcessing;
const getDeletePersonalSessionFragmentError = (state: PersonalSessionFragmentState) => state.deletePersonalSessionFragmentError;
const getDeletePersonalSessionFragmentProcessing = (state: PersonalSessionFragmentState) => state.deletePersonalSessionFragmentProcessing;
const getFetchAllPersonalSessionFragmentsError = (state: PersonalSessionFragmentState) => state.fetchAllPersonalSessionFragmentsError;
const getFetchAllPersonalSessionFragmentsProcessing = (state: PersonalSessionFragmentState) => state.fetchAllPersonalSessionFragmentsProcessing;
const getFetchMultiplePersonalSessionFragmentsError = (state: PersonalSessionFragmentState) => state.fetchMultiplePersonalSessionFragmentsError;
const getFetchMultiplePersonalSessionFragmentsProcessing = (state: PersonalSessionFragmentState) => state.fetchMultiplePersonalSessionFragmentsProcessing;
const getFetchSinglePersonalSessionFragmentError = (state: PersonalSessionFragmentState) => state.fetchSinglePersonalSessionFragmentError;
const getFetchSinglePersonalSessionFragmentProcessing = (state: PersonalSessionFragmentState) => state.fetchSinglePersonalSessionFragmentProcessing;
const getUpdatePersonalSessionFragmentError = (state: PersonalSessionFragmentState) => state.updatePersonalSessionFragmentError;
const getUpdatePersonalSessionFragmentProcessing = (state: PersonalSessionFragmentState) => state.updatePersonalSessionFragmentProcessing;

export const selectAllPersonalSessionFragmentsInStore: (state: object) => PersonalSessionFragment[] = createSelector(
  selectPersonalSessionFragmentState,
  fromPersonalSessionFragments.selectAll
);

export const selectAllPersonalSessionFragmentsFetched = createSelector(
  selectPersonalSessionFragmentState,
  getAllPersonalSessionFragmentsFetched
);

export const selectBatchCreatePersonalSessionFragmentsError = createSelector(
  selectPersonalSessionFragmentState,
  getBatchCreatePersonalSessionFragmentsError
);

export const selectBatchCreatePersonalSessionFragmentsProcessing = createSelector(
  selectPersonalSessionFragmentState,
  getBatchCreatePersonalSessionFragmentsProcessing
);

export const selectBatchDeletePersonalSessionFragmentsError = createSelector(
  selectPersonalSessionFragmentState,
  getBatchDeletePersonalSessionFragmentsError
);

export const selectBatchDeletePersonalSessionFragmentsProcessing = createSelector(
  selectPersonalSessionFragmentState,
  getBatchDeletePersonalSessionFragmentsProcessing
);

export const selectBatchModifyPersonalSessionFragmentsError = createSelector(
  selectPersonalSessionFragmentState,
  getBatchModifyPersonalSessionFragmentsError
);

export const selectBatchModifyPersonalSessionFragmentsProcessing = createSelector(
  selectPersonalSessionFragmentState,
  getBatchModifyPersonalSessionFragmentsProcessing
);

export const selectCreatePersonalSessionFragmentError = createSelector(
  selectPersonalSessionFragmentState,
  getCreatePersonalSessionFragmentError
);

export const selectCreatePersonalSessionFragmentProcessing = createSelector(
  selectPersonalSessionFragmentState,
  getCreatePersonalSessionFragmentProcessing
);

export const selectDeletePersonalSessionFragmentError = createSelector(
  selectPersonalSessionFragmentState,
  getDeletePersonalSessionFragmentError
);

export const selectDeletePersonalSessionFragmentProcessing = createSelector(
  selectPersonalSessionFragmentState,
  getDeletePersonalSessionFragmentProcessing
);

export const selectFetchSinglePersonalSessionFragmentError = createSelector(
  selectPersonalSessionFragmentState,
  getFetchSinglePersonalSessionFragmentError
);

export const selectFetchSinglePersonalSessionFragmentProcessing = createSelector(
  selectPersonalSessionFragmentState,
  getFetchSinglePersonalSessionFragmentProcessing
);

export const selectFetchAllPersonalSessionFragmentsError = createSelector(
  selectPersonalSessionFragmentState,
  getFetchAllPersonalSessionFragmentsError
);

export const selectFetchAllPersonalSessionFragmentsProcessing = createSelector(
  selectPersonalSessionFragmentState,
  getFetchAllPersonalSessionFragmentsProcessing
);

export const selectFetchMultiplePersonalSessionFragmentsError = createSelector(
  selectPersonalSessionFragmentState,
  getFetchMultiplePersonalSessionFragmentsError
);

export const selectFetchMultiplePersonalSessionFragmentsProcessing = createSelector(
  selectPersonalSessionFragmentState,
  getFetchMultiplePersonalSessionFragmentsProcessing
);

export const selectPersonalSessionFragmentById: (personalSessionFragmentId: string) => MemoizedSelector<object, PersonalSessionFragment | undefined> = (personalSessionFragmentId: string) => createSelector(
  selectPersonalSessionFragmentState,
  personalSessionFragmentState => personalSessionFragmentState.entities[personalSessionFragmentId]
);

export const selectUpdatePersonalSessionFragmentError = createSelector(
  selectPersonalSessionFragmentState,
  getUpdatePersonalSessionFragmentError
);

export const selectUpdatePersonalSessionFragmentProcessing = createSelector(
  selectPersonalSessionFragmentState,
  getUpdatePersonalSessionFragmentProcessing
);
