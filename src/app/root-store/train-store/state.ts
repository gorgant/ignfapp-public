import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { TrainingSession } from "shared-models/train/training-session.model";
import { EntityAdapter } from '@ngrx/entity';

export const trainFeatureKey = PublicStoreFeatureKeys.TRAIN;

export const featureAdapter: EntityAdapter<TrainingSession> = createEntityAdapter<TrainingSession>({
  selectId: 
})

export interface TrainState {
  createTrainingSessionError: {} | null,
  createTrainingSessionProcessing: boolean,
  deleteTrainingSessionError: {} | null,
  deleteTrainingSessionProcessing: boolean,
  fetchTrainingSessionError: {} | null,
  fetchTrainingSessionProcessing: boolean,
  updateTrainingSessionError: {} | null,
  updateTrainingSessionProcessing: boolean,
}

export const initialTrainingSessionState: TrainState = {
  createTrainingSessionError: null,
  createTrainingSessionProcessing: false,
  deleteTrainingSessionError: null,
  deleteTrainingSessionProcessing: false,
  fetchTrainingSessionError: null,
  fetchTrainingSessionProcessing: false,
  updateTrainingSessionError: null,
  updateTrainingSessionProcessing: false,
}