import { FirebaseError } from "@angular/fire/app";
import { createAction, props } from "@ngrx/store";
import { TrainingSession } from "shared-models/train/training-session.model";
import { YoutubeVideoData } from "shared-models/youtube/youtube-video-data.model";

// Get Youtube Video Data

export const getYoutubeVideoDataRequested = createAction(
  '[Edit Training Session] Get Youtube Video Data Requested',
  props<{videoId: string}>()
);

export const getYoutubeVideoDataCompleted = createAction(
  '[Youtube Service] Get Youtube Video Data Completed',
  props<{youtubeVideoData: YoutubeVideoData}>()
);

export const getYoutubeVideoDataFailed = createAction(
  '[Youtube Service] Get Youtube Video Data Failed',
  props<{error: FirebaseError}>()
);

// Create Training Session

export const createTrainingSessionRequested = createAction(
  '[Edit Training Session] Create TrainingSession Requested',
  props<{trainingSession: TrainingSession}>()
);

export const createTrainingSessionCompleted = createAction(
  '[Train Service] Create TrainingSession Completed',
);

export const createTrainingSessionFailed = createAction(
  '[Train Service] Create TrainingSession Failed',
  props<{error: FirebaseError}>()
);

// Get Training Session

export const getTrainingSessionRequested = createAction(
  '[AppWide] Get Training Session Requested',
  props<{sessionId: string}>()
);

export const getTrainingSessionCompleted = createAction(
  '[Train Service] Get Training Session Completed',
  props<{trainingSession: TrainingSession}>()
);

export const getTrainingSessionFailed = createAction(
  '[Train Service] Get Training Session Failed',
  props<{error: FirebaseError}>()
);

// Update Training Session

export const updateTrainingSessionRequested = createAction(
  '[Edit Training Session] Update Training Session Requested',
  props<{trainingSession: TrainingSession}>()
);

export const updateTrainingSessionCompleted = createAction(
  '[Train Service] Update Training Session Completed',
);

export const updateTrainingSessionFailed = createAction(
  '[Train Service] Update Training Session Failed',
  props<{error: FirebaseError}>()
);

// Delete Training Session

export const deleteTrainingSessionRequested = createAction(
  '[Edit Training Session] Delete Training Session Requested',
  props<{sessionId: string}>()
);

export const deleteTrainingSessionCompleted = createAction(
  '[Train Service] Delete Training Session Completed',
);

export const deleteTrainingSessionFailed = createAction(
  '[Train Service] Delete Training Session Failed',
  props<{error: FirebaseError}>()
);
