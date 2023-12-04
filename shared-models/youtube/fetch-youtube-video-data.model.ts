import { TrainingSessionVisibilityCategoryDbOption } from "../train/training-session.model";

export interface FetchYoutubeVideoData {
  videoId: string,
  visibilityCategory: TrainingSessionVisibilityCategoryDbOption
}

export const FETCH_YOUTUBE_VIDEO_DUPLICATE_ERROR_MESSAGE = 'That video already exists in our public database. Please try a different video or change the visibility settings.';
export type FetchYoutubeVideoDuplicateErrorMessage = typeof FETCH_YOUTUBE_VIDEO_DUPLICATE_ERROR_MESSAGE;