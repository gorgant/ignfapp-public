import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { TrainingSession } from "shared-models/train/training-session.model";
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { YoutubeVideoDataCompact } from "shared-models/youtube/youtube-video-data.model";
import { FirebaseError } from "firebase/app";

export const trainFeatureKey = PublicStoreFeatureKeys.TRAINING_SESSION;

export const featureAdapter: EntityAdapter<TrainingSession> = createEntityAdapter<TrainingSession>({
  selectId: (trainingSession: TrainingSession) => trainingSession.id,
});

export interface TrainingSessionState extends EntityState<TrainingSession> {
  createTrainingSessionError: FirebaseError | Error | null,
  createTrainingSessionProcessing: boolean,
  deleteTrainingSessionError: FirebaseError | Error | null,
  deleteTrainingSessionProcessing: boolean,
  fetchMultipleTrainingSessionsError: FirebaseError | Error | null,
  fetchMultipleTrainingSessionsProcessing: boolean,
  fetchSingleTrainingSessionError: FirebaseError | Error | null,
  fetchSingleTrainingSessionProcessing: boolean,
  fetchYoutubeVideoDataError: FirebaseError | Error | null,
  fetchYoutubeVideoDataProcessing: boolean,
  updateTrainingSessionError: FirebaseError | Error | null,
  updateTrainingSessionProcessing: boolean,
  youtubeVideoData: YoutubeVideoDataCompact | null,
}

export const initialTrainingSessionState: TrainingSessionState = featureAdapter.getInitialState(
  {
    createTrainingSessionError: null,
    createTrainingSessionProcessing: false,
    deleteTrainingSessionError: null,
    deleteTrainingSessionProcessing: false,
    fetchMultipleTrainingSessionsError: null,
    fetchMultipleTrainingSessionsProcessing: false,
    fetchSingleTrainingSessionError: null,
    fetchSingleTrainingSessionProcessing: false,
    fetchYoutubeVideoDataError: null,
    fetchYoutubeVideoDataProcessing: false,
    updateTrainingSessionError: null,
    updateTrainingSessionProcessing: false,
    youtubeVideoData: null,
  }
);