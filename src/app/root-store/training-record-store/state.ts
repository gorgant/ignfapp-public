import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { FirebaseError } from "firebase/app";
import { TrainingRecord } from "shared-models/train/training-record.model";

export const trainingRecordFeatureKey = PublicStoreFeatureKeys.TRAINING_RECORD;

export const featureAdapter: EntityAdapter<TrainingRecord> = createEntityAdapter<TrainingRecord>({
  selectId: (trainingRecord: TrainingRecord) => trainingRecord.id,
});

export interface TrainingRecordState extends EntityState<TrainingRecord> {
  allTrainingRecordsFetched: boolean,
  createTrainingRecordError: FirebaseError | Error | null,
  createTrainingRecordProcessing: boolean,
  deleteTrainingRecordError: FirebaseError | Error | null,
  deleteTrainingRecordProcessing: boolean,
  fetchAllTrainingRecordsError: FirebaseError | Error | null,
  fetchAllTrainingRecordsProcessing: boolean,
  fetchMultipleTrainingRecordsError: FirebaseError | Error | null,
  fetchMultipleTrainingRecordsProcessing: boolean,
  fetchSingleTrainingRecordError: FirebaseError | Error | null,
  fetchSingleTrainingRecordProcessing: boolean,
  updateTrainingRecordError: FirebaseError | Error | null,
  updateTrainingRecordProcessing: boolean,
}

export const initialTrainingRecordState: TrainingRecordState = featureAdapter.getInitialState(
  {
    allTrainingRecordsFetched: false,
    createTrainingRecordError: null,
    createTrainingRecordProcessing: false,
    deleteTrainingRecordError: null,
    deleteTrainingRecordProcessing: false,
    fetchAllTrainingRecordsError: null,
    fetchAllTrainingRecordsProcessing: false,
    fetchMultipleTrainingRecordsError: null,
    fetchMultipleTrainingRecordsProcessing: false,
    fetchSingleTrainingRecordError: null,
    fetchSingleTrainingRecordProcessing: false,
    updateTrainingRecordError: null,
    updateTrainingRecordProcessing: false,
  }
);