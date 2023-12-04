import { FirebaseError } from "@angular/fire/app";
import { Update } from "@ngrx/entity";
import { createAction, props } from "@ngrx/store";
import { FirestoreCollectionQueryParams } from "shared-models/firestore/fs-collection-query-params.model";
import { TrainingSessionRatingNoIdOrTimestamp } from "shared-models/train/session-rating.model";
import { CanonicalTrainingSession, CanonicalTrainingSessionNoIdOrTimestamps, TrainingSessionVisibilityCategoryDbOption } from "shared-models/train/training-session.model";
import { FetchYoutubeVideoData } from "shared-models/youtube/fetch-youtube-video-data.model";
import { YoutubeVideoDataCompact } from "shared-models/youtube/youtube-video-data.model";

// Create Training Session

export const createTrainingSessionRequested = createAction(
  '[Edit Training Session] Create Training Session Requested',
  props<{trainingSessionNoId: CanonicalTrainingSessionNoIdOrTimestamps, userId: string}>()
);

export const createTrainingSessionCompleted = createAction(
  '[Train Service] Create Training Session Completed',
  props<{trainingSession: CanonicalTrainingSession}>()
);

export const createTrainingSessionFailed = createAction(
  '[Train Service] Create Training Session Failed',
  props<{error: FirebaseError}>()
);

// Delete Training Session

export const deleteTrainingSessionRequested = createAction(
  '[Edit Training Session] Delete Training Session Requested',
  props<{trainingSession: CanonicalTrainingSession, userId: string}>()
);

export const deleteTrainingSessionCompleted = createAction(
  '[Train Service] Delete Training Session Completed',
  props<{sessionId: string}>()
);

export const deleteTrainingSessionFailed = createAction(
  '[Train Service] Delete Training Session Failed',
  props<{error: FirebaseError}>()
);

// Fetch All Training Sessions

export const fetchAllTrainingSessionsRequested = createAction(
  '[AppWide] Fetch All Training Sessions Requested',
  props<{userId: string}>()
);

export const fetchAllTrainingSessionsCompleted = createAction(
  '[Train Service] Fetch All Training Sessions Completed',
  props<{trainingSessions: CanonicalTrainingSession[]}>()
);

export const fetchAllTrainingSessionsFailed = createAction(
  '[Train Service] Fetch All Training Sessions Failed',
  props<{error: FirebaseError}>()
);

// Fetch Multiple Training Sessions

export const fetchMultipleTrainingSessionsRequested = createAction(
  '[AppWide] Fetch Multiple Training Sessions Requested',
  props<{queryParams: FirestoreCollectionQueryParams, userId: string}>()
);

export const fetchMultipleTrainingSessionsCompleted = createAction(
  '[Train Service] Fetch Multiple Training Sessions Completed',
  props<{trainingSessions: CanonicalTrainingSession[]}>()
);

export const fetchMultipleTrainingSessionsFailed = createAction(
  '[Train Service] Fetch Multiple Training Sessions Failed',
  props<{error: FirebaseError}>()
);

// Fetch Single Training Session

export const fetchSingleTrainingSessionRequested = createAction(
  '[AppWide] Fetch Single Training Session Requested',
  props<{sessionId: string, userId: string, visibilityCategory: TrainingSessionVisibilityCategoryDbOption}>()
);

export const fetchSingleTrainingSessionCompleted = createAction(
  '[Train Service] Fetch Single Training Session Completed',
  props<{trainingSession: CanonicalTrainingSession}>()
);

export const fetchSingleTrainingSessionFailed = createAction(
  '[Train Service] Fetch Single Training Session Failed',
  props<{error: FirebaseError}>()
);

// Fetch Youtube Video Data

export const fetchYoutubeVideoDataRequested = createAction(
  '[Edit Training Session] Fetch Youtube Video Data Requested',
  props<{fetchYoutubeVideoData: FetchYoutubeVideoData}>()
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

// Purge Training Session Errors

export const purgeTrainingSessionErrors = createAction(
  '[AppWide] Purge Training Session Errors'
);

// Purge Youtube Video Data

export const purgeYoutubeVideoData = createAction(
  '[Edit Training Session] Purge Youtube Video Data'
)

// Set Youtube Video Data

export const setYoutubeVideoData = createAction(
  '[Edit Training Session Step One] Set Youtube Video Data',
  props<{youtubeVideoData: YoutubeVideoDataCompact}>()
)

// Update Session Rating

export const updateSessionRatingRequested = createAction(
  '[Training Session Complete Dialogue] Update Session Rating Requested',
  props<{sessionRating: TrainingSessionRatingNoIdOrTimestamp}>()
);

export const updateSessionRatingCompleted = createAction(
  '[Train Service] Update Session Rating Completed',
  props<{pubSubMessageId: string}>()
);

export const updateSessionRatingFailed = createAction(
  '[Train Service] Update Session Rating Failed',
  props<{error: FirebaseError}>()
);

// Update Training Session

export const updateTrainingSessionRequested = createAction(
  '[Edit Training Session] Update Training Session Requested',
  props<{trainingSessionUpdates: Update<CanonicalTrainingSession>, userId: string, visibilityCategory: TrainingSessionVisibilityCategoryDbOption}>()
);

export const updateTrainingSessionCompleted = createAction(
  '[Train Service] Update Training Session Completed',
  props<{trainingSessionUpdates: Update<CanonicalTrainingSession>}>()
);

export const updateTrainingSessionFailed = createAction(
  '[Train Service] Update Training Session Failed',
  props<{error: FirebaseError}>()
);

