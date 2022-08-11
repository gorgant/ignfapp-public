import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { FirebaseError } from "firebase/app";
import { TrainingPlan } from "shared-models/train/training-plan.model";

export const trainingPlanFeatureKey = PublicStoreFeatureKeys.TRAINING_PLAN;

export const featureAdapter: EntityAdapter<TrainingPlan> = createEntityAdapter<TrainingPlan>({
  selectId: (trainingPlan: TrainingPlan) => trainingPlan.id,
});

export interface TrainingPlanState extends EntityState<TrainingPlan> {
  allTrainingPlansFetched: boolean,
  createTrainingPlanError: FirebaseError | Error | null,
  createTrainingPlanProcessing: boolean,
  deleteTrainingPlanError: FirebaseError | Error | null,
  deleteTrainingPlanProcessing: boolean,
  fetchAllTrainingPlansError: FirebaseError | Error | null,
  fetchAllTrainingPlansProcessing: boolean,
  fetchMultipleTrainingPlansError: FirebaseError | Error | null,
  fetchMultipleTrainingPlansProcessing: boolean,
  fetchSingleTrainingPlanError: FirebaseError | Error | null,
  fetchSingleTrainingPlanProcessing: boolean,
  newTrainingPlanId: string | null,
  updateTrainingPlanError: FirebaseError | Error | null,
  updateTrainingPlanProcessing: boolean,
}

export const initialTrainingPlanState: TrainingPlanState = featureAdapter.getInitialState(
  {
    allTrainingPlansFetched: false,
    createTrainingPlanError: null,
    createTrainingPlanProcessing: false,
    deleteTrainingPlanError: null,
    deleteTrainingPlanProcessing: false,
    fetchAllTrainingPlansError: null,
    fetchAllTrainingPlansProcessing: false,
    fetchMultipleTrainingPlansError: null,
    fetchMultipleTrainingPlansProcessing: false,
    fetchSingleTrainingPlanError: null,
    fetchSingleTrainingPlanProcessing: false,
    newTrainingPlanId: null,
    updateTrainingPlanError: null,
    updateTrainingPlanProcessing: false,
  }
);