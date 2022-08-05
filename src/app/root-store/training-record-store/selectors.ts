import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { TrainingRecord } from "shared-models/train/training-record.model";
import { TrainingRecordState } from "./state";
import * as fromTrainingRecords from './reducer';

const selectTrainingRecordState = createFeatureSelector<TrainingRecordState>(PublicStoreFeatureKeys.TRAINING_RECORD);

const getAllTrainingRecordsFetched = (state: TrainingRecordState) => state.allTrainingRecordsFetched;
const getCreateTrainingRecordError = (state: TrainingRecordState) => state.createTrainingRecordError;
const getCreateTrainingRecordProcessing = (state: TrainingRecordState) => state.createTrainingRecordProcessing;
const getDeleteTrainingRecordError = (state: TrainingRecordState) => state.deleteTrainingRecordError;
const getDeleteTrainingRecordProcessing = (state: TrainingRecordState) => state.deleteTrainingRecordProcessing;
const getFetchAllTrainingRecordsError = (state: TrainingRecordState) => state.fetchAllTrainingRecordsError;
const getFetchAllTrainingRecordsProcessing = (state: TrainingRecordState) => state.fetchAllTrainingRecordsProcessing;
const getFetchMultipleTrainingRecordsError = (state: TrainingRecordState) => state.fetchMultipleTrainingRecordsError;
const getFetchMultipleTrainingRecordsProcessing = (state: TrainingRecordState) => state.fetchMultipleTrainingRecordsProcessing;
const getFetchSingleTrainingRecordError = (state: TrainingRecordState) => state.fetchSingleTrainingRecordError;
const getFetchSingleTrainingRecordProcessing = (state: TrainingRecordState) => state.fetchSingleTrainingRecordProcessing;
const getUpdateTrainingRecordError = (state: TrainingRecordState) => state.updateTrainingRecordError;
const getUpdateTrainingRecordProcessing = (state: TrainingRecordState) => state.updateTrainingRecordProcessing;

export const selectAllRecordsInStore: (state: object) => TrainingRecord[] = createSelector(
  selectTrainingRecordState,
  fromTrainingRecords.selectAll
);

export const selectAllTrainingRecordsFetched = createSelector(
  selectTrainingRecordState,
  getAllTrainingRecordsFetched
);

export const selectCreateTrainingRecordError = createSelector(
  selectTrainingRecordState,
  getCreateTrainingRecordError
);

export const selectCreateTrainingRecordProcessing = createSelector(
  selectTrainingRecordState,
  getCreateTrainingRecordProcessing
);

export const selectDeleteTrainingRecordError = createSelector(
  selectTrainingRecordState,
  getDeleteTrainingRecordError
);

export const selectDeleteTrainingRecordProcessing = createSelector(
  selectTrainingRecordState,
  getDeleteTrainingRecordProcessing
);

export const selectFetchSingleTrainingRecordError = createSelector(
  selectTrainingRecordState,
  getFetchSingleTrainingRecordError
);

export const selectFetchSingleTrainingRecordProcessing = createSelector(
  selectTrainingRecordState,
  getFetchSingleTrainingRecordProcessing
);

export const selectFetchAllTrainingRecordsError = createSelector(
  selectTrainingRecordState,
  getFetchAllTrainingRecordsError
);

export const selectFetchAllTrainingRecordsProcessing = createSelector(
  selectTrainingRecordState,
  getFetchAllTrainingRecordsProcessing
);

export const selectFetchMultipleTrainingRecordsError = createSelector(
  selectTrainingRecordState,
  getFetchMultipleTrainingRecordsError
);

export const selectFetchMultipleTrainingRecordsProcessing = createSelector(
  selectTrainingRecordState,
  getFetchMultipleTrainingRecordsProcessing
);

export const selectTrainingRecordById: (recordId: string) => MemoizedSelector<object, TrainingRecord | undefined> = (recordId: string) => createSelector(
  selectTrainingRecordState,
  trainingRecordState => trainingRecordState.entities[recordId]
);

export const selectUpdateTrainingRecordError = createSelector(
  selectTrainingRecordState,
  getUpdateTrainingRecordError
);

export const selectUpdateTrainingRecordProcessing = createSelector(
  selectTrainingRecordState,
  getUpdateTrainingRecordProcessing
);
