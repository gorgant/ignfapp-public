import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { CanonicalTrainingSession } from "shared-models/train/training-session.model";
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { YoutubeVideoDataCompact } from "shared-models/youtube/youtube-video-data.model";
import { FirebaseError } from "firebase/app";

export const trainingRecordFeatureKey = PublicStoreFeatureKeys.TRAINING_SESSION;

export const featureAdapter: EntityAdapter<CanonicalTrainingSession> = createEntityAdapter<CanonicalTrainingSession>({
  selectId: (trainingSession: CanonicalTrainingSession) => trainingSession.id,
});

export interface TrainingSessionState extends EntityState<CanonicalTrainingSession> {
  allTrainingSessionsFetched: boolean,
  createTrainingSessionError: FirebaseError | Error | null,
  createTrainingSessionProcessing: boolean,
  deleteTrainingSessionError: FirebaseError | Error | null,
  deleteTrainingSessionProcessing: boolean,
  fetchAllTrainingSessionsError: FirebaseError | Error | null,
  fetchAllTrainingSessionsProcessing: boolean,
  fetchMultipleTrainingSessionsError: FirebaseError | Error | null,
  fetchMultipleTrainingSessionsProcessing: boolean,
  fetchSingleTrainingSessionError: FirebaseError | Error | null,
  fetchSingleTrainingSessionProcessing: boolean,
  fetchYoutubeVideoDataError: FirebaseError | Error | null,
  fetchYoutubeVideoDataProcessing: boolean,
  newTrainingSessionId: string | null,
  updateSessionRatingError: FirebaseError | Error | null,
  updateSessionRatingProcessing: boolean,
  updateTrainingSessionError: FirebaseError | Error | null,
  updateTrainingSessionProcessing: boolean,
  youtubeVideoData: YoutubeVideoDataCompact | null,
}

export const initialTrainingSessionState: TrainingSessionState = featureAdapter.getInitialState(
  {
    allTrainingSessionsFetched: false,
    createTrainingSessionError: null,
    createTrainingSessionProcessing: false,
    deleteTrainingSessionError: null,
    deleteTrainingSessionProcessing: false,
    fetchAllTrainingSessionsError: null,
    fetchAllTrainingSessionsProcessing: false,
    fetchMultipleTrainingSessionsError: null,
    fetchMultipleTrainingSessionsProcessing: false,
    fetchSingleTrainingSessionError: null,
    fetchSingleTrainingSessionProcessing: false,
    fetchYoutubeVideoDataError: null,
    fetchYoutubeVideoDataProcessing: false,
    newTrainingSessionId: null,
    updateSessionRatingError: null,
    updateSessionRatingProcessing: false,
    updateTrainingSessionError: null,
    updateTrainingSessionProcessing: false,
    youtubeVideoData: null,
  }
);