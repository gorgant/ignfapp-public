import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { CanonicalTrainingSession } from "shared-models/train/training-session.model";
import { TrainingSessionState } from "./state";
import * as fromTrainingSessions from './reducer';

const selectTrainingSessionState = createFeatureSelector<TrainingSessionState>(PublicStoreFeatureKeys.TRAINING_SESSION);

const getAllTrainingSessionsFetched = (state: TrainingSessionState) => state.allTrainingSessionsFetched;
const getCreateTrainingSessionError = (state: TrainingSessionState) => state.createTrainingSessionError;
const getCreateTrainingSessionProcessing = (state: TrainingSessionState) => state.createTrainingSessionProcessing;
const getDeleteTrainingSessionError = (state: TrainingSessionState) => state.deleteTrainingSessionError;
const getDeleteTrainingSessionProcessing = (state: TrainingSessionState) => state.deleteTrainingSessionProcessing;
const getFetchSingleTrainingSessionError = (state: TrainingSessionState) => state.fetchSingleTrainingSessionError;
const getFetchSingleTrainingSessionProcessing = (state: TrainingSessionState) => state.fetchSingleTrainingSessionProcessing;
const getFetchAllTrainingSessionsError = (state: TrainingSessionState) => state.fetchAllTrainingSessionsError;
const getFetchAllTrainingSessionsProcessing = (state: TrainingSessionState) => state.fetchAllTrainingSessionsProcessing;
const getFetchMultipleTrainingSessionsError = (state: TrainingSessionState) => state.fetchMultipleTrainingSessionsError;
const getFetchMultipleTrainingSessionsProcessing = (state: TrainingSessionState) => state.fetchMultipleTrainingSessionsProcessing;
const getFetchYoutubeVideoDataError = (state: TrainingSessionState) => state.fetchYoutubeVideoDataError;
const getFetchYoutubeVideoDataProcessing = (state: TrainingSessionState) => state.fetchYoutubeVideoDataProcessing;
const getUpdateSessionRatingError = (state: TrainingSessionState) => state.updateSessionRatingError;
const getUpdateSessionRatingProcessing = (state: TrainingSessionState) => state.updateSessionRatingProcessing;
const getUpdateTrainingSessionError = (state: TrainingSessionState) => state.updateTrainingSessionError;
const getUpdateTrainingSessionProcessing = (state: TrainingSessionState) => state.updateTrainingSessionProcessing;
const getYoutubeVideoData = (state: TrainingSessionState) => state.youtubeVideoData;

export const selectAllTrainingSessionsInStore: (state: object) => CanonicalTrainingSession[] = createSelector(
  selectTrainingSessionState,
  fromTrainingSessions.selectAll
);

export const selectAllTrainingSessionsFetched = createSelector(
  selectTrainingSessionState,
  getAllTrainingSessionsFetched
);

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

export const selectFetchAllTrainingSessionsError = createSelector(
  selectTrainingSessionState,
  getFetchAllTrainingSessionsError
);

export const selectFetchAllTrainingSessionsProcessing = createSelector(
  selectTrainingSessionState,
  getFetchAllTrainingSessionsProcessing
);

export const selectFetchMultipleTrainingSessionsError = createSelector(
  selectTrainingSessionState,
  getFetchMultipleTrainingSessionsError
);

export const selectFetchMultipleTrainingSessionsProcessing = createSelector(
  selectTrainingSessionState,
  getFetchMultipleTrainingSessionsProcessing
);

export const selectFetchSingleTrainingSessionError = createSelector(
  selectTrainingSessionState,
  getFetchSingleTrainingSessionError
);

export const selectFetchSingleTrainingSessionProcessing = createSelector(
  selectTrainingSessionState,
  getFetchSingleTrainingSessionProcessing
);

export const selectFetchYoutubeVideoDataError = createSelector(
  selectTrainingSessionState,
  getFetchYoutubeVideoDataError
);

export const selectFetchYoutubeVideoDataProcessing = createSelector(
  selectTrainingSessionState,
  getFetchYoutubeVideoDataProcessing
);

export const selectTrainingSessionById: (sessionId: string) => MemoizedSelector<object, CanonicalTrainingSession | undefined> = (sessionId: string) => createSelector(
  selectTrainingSessionState,
  trainingSessionState => trainingSessionState.entities[sessionId]
);

export const selectUpdateSessionRatingError = createSelector(
  selectTrainingSessionState,
  getUpdateSessionRatingError
);

export const selectUpdateSessionRatingProcessing = createSelector(
  selectTrainingSessionState,
  getUpdateSessionRatingProcessing
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