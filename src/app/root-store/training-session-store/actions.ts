import { FirebaseError } from "@angular/fire/app";
import { Update } from "@ngrx/entity";
import { createAction, props } from "@ngrx/store";
import { FirestoreCollectionQueryParams } from "shared-models/firestore/fs-collection-query-params.model";
import { TrainingSession, TrainingSessionNoId } from "shared-models/train/training-session.model";
import { YoutubeVideoDataCompact } from "shared-models/youtube/youtube-video-data.model";

// Create Training Session

export const createTrainingSessionRequested = createAction(
  '[Edit Training Session] Create Training Session Requested',
  props<{trainingSessionNoId: TrainingSessionNoId}>()
);

export const createTrainingSessionCompleted = createAction(
  '[Train Service] Create Training Session Completed',
  props<{trainingSession: TrainingSession}>()
);

export const createTrainingSessionFailed = createAction(
  '[Train Service] Create Training Session Failed',
  props<{error: FirebaseError}>()
);

// Delete Training Session

export const deleteTrainingSessionRequested = createAction(
  '[Edit Training Session] Delete Training Session Requested',
  props<{sessionId: string}>()
);

export const deleteTrainingSessionCompleted = createAction(
  '[Train Service] Delete Training Session Completed',
  props<{sessionId: string}>()
);

export const deleteTrainingSessionFailed = createAction(
  '[Train Service] Delete Training Session Failed',
  props<{error: FirebaseError}>()
);

// Fetch Multiple Training Sessions

export const fetchMultipleTrainingSessionsRequested = createAction(
  '[AppWide] Fetch Multiple Training Sessions Requested',
  props<{queryParams: FirestoreCollectionQueryParams}>()
);

export const fetchMultipleTrainingSessionsCompleted = createAction(
  '[Train Service] Fetch Multiple Training Sessions Completed',
  props<{trainingSessions: TrainingSession[]}>()
);

export const fetchMultipleTrainingSessionsFailed = createAction(
  '[Train Service] Fetch Multiple Training Sessions Failed',
  props<{error: FirebaseError}>()
);

// Fetch Single Training Session

export const fetchSingleTrainingSessionRequested = createAction(
  '[AppWide] Fetch Single Training Session Requested',
  props<{sessionId: string}>()
);

export const fetchSingleTrainingSessionCompleted = createAction(
  '[Train Service] Fetch Single Training Session Completed',
  props<{trainingSession: TrainingSession}>()
);

export const fetchSingleTrainingSessionFailed = createAction(
  '[Train Service] Fetch Single Training Session Failed',
  props<{error: FirebaseError}>()
);

// Fetch Youtube Video Data

export const fetchYoutubeVideoDataRequested = createAction(
  '[Edit Training Session] Fetch Youtube Video Data Requested',
  props<{videoId: string}>()
);

export const fetchYoutubeVideoDataCompleted = createAction(
  '[Youtube Service] Fetch Youtube Video Data Completed',
  props<{youtubeVideoData: YoutubeVideoDataCompact}>()
);

export const fetchYoutubeVideoDataFailed = createAction(
  '[Youtube Service] Fetch Youtube Video Data Failed',
  props<{error: FirebaseError}>()
);

// Purge Train Data

export const purgeTrainingSessionData = createAction(
  '[AppWide] Purge Training Session Data'
);

// Purge Youtube Video Data

export const purgeYoutubeVideoData = createAction(
  '[AppWide] Purge Youtube Video Data'
)

// Update Training Session

export const updateTrainingSessionRequested = createAction(
  '[Edit Training Session] Update Training Session Requested',
  props<{trainingSessionUpdates: Update<TrainingSession>}>()
);

export const updateTrainingSessionCompleted = createAction(
  '[Train Service] Update Training Session Completed',
  props<{trainingSessionUpdates: Update<TrainingSession>}>()
);

export const updateTrainingSessionFailed = createAction(
  '[Train Service] Update Training Session Failed',
  props<{error: FirebaseError}>()
);

