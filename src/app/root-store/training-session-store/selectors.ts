import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { TrainingSessionState } from "./state";

const selectTrainingSessionState = createFeatureSelector<TrainingSessionState>(PublicStoreFeatureKeys.TRAINING_SESSION);

const getCreateTrainingSessionError = (state: TrainingSessionState) => state.createTrainingSessionError;
const getCreateTrainingSessionProcessing = (state: TrainingSessionState) => state.createTrainingSessionProcessing;
const getDeleteTrainingSessionError = (state: TrainingSessionState) => state.deleteTrainingSessionError;
const getDeleteTrainingSessionProcessing = (state: TrainingSessionState) => state.deleteTrainingSessionProcessing;
const getFetchSingleTrainingSessionError = (state: TrainingSessionState) => state.fetchSingleTrainingSessionError;
const getFetchSingleTrainingSessionProcessing = (state: TrainingSessionState) => state.fetchSingleTrainingSessionProcessing;
const getFetchMultipleTrainingSessionsError = (state: TrainingSessionState) => state.fetchMultipleTrainingSessionsError;
const getFetchMultipleTrainingSessionsProcessing = (state: TrainingSessionState) => state.fetchMultipleTrainingSessionsProcessing;
const getFetchYoutubeVideoDataError = (state: TrainingSessionState) => state.fetchYoutubeVideoDataError;
const getFetchYoutubeVideoDataProcessing = (state: TrainingSessionState) => state.fetchYoutubeVideoDataProcessing;
const getUpdateTrainingSessionError = (state: TrainingSessionState) => state.updateTrainingSessionError;
const getUpdateTrainingSessionProcessing = (state: TrainingSessionState) => state.updateTrainingSessionProcessing;
const getYoutubeVideoData = (state: TrainingSessionState) => state.youtubeVideoData;

export const selectCreateTrainingSessionError = createSelector(
  selectTrainingSessionState,
  getCreateTrainingSessionError
);

export const selectCreateTrainingSessionProcessing = createSelector(
  selectTrainingSessionState,
  getCreateTrainingSessionProcessing
);

export const selectDeleteTrainingSessionError = createSelector(
  selectTrainingSessionState,
  getDeleteTrainingSessionError
);

export const selectDeleteTrainingSessionProcessing = createSelector(
  selectTrainingSessionState,
  getDeleteTrainingSessionProcessing
);

export const selectFetchSingleTrainingSessionError = createSelector(
  selectTrainingSessionState,
  getFetchSingleTrainingSessionError
);

export const selectFetchSingleTrainingSessionProcessing = createSelector(
  selectTrainingSessionState,
  getFetchSingleTrainingSessionProcessing
);

export const selectFetchMultipleTrainingSessionsError = createSelector(
  selectTrainingSessionState,
  getFetchMultipleTrainingSessionsError
);

export const selectFetchMultipleTrainingSessionsProcessing = createSelector(
  selectTrainingSessionState,
  getFetchMultipleTrainingSessionsProcessing
);

export const selectFetchYoutubeVideoDataError = createSelector(
  selectTrainingSessionState,
  getFetchYoutubeVideoDataError
);

export const selectFetchYoutubeVideoDataProcessing = createSelector(
  selectTrainingSessionState,
  getFetchYoutubeVideoDataProcessing
);

export const selectUpdateTrainingSessionError = createSelector(
  selectTrainingSessionState,
  getUpdateTrainingSessionError
);

export const selectUpdateTrainingSessionProcessing = createSelector(
  selectTrainingSessionState,
  getUpdateTrainingSessionProcessing
);

export const selectYoutubeVideoData = createSelector(
  selectTrainingSessionState,
  getYoutubeVideoData
);