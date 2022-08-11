import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { FirebaseError } from "firebase/app";
import { PlanSessionFragment } from "shared-models/train/plan-session-fragment.model";

export const planSessionFragmentFeatureKey = PublicStoreFeatureKeys.PLAN_SESSSION_FRAGMENT;

export const featureAdapter: EntityAdapter<PlanSessionFragment> = createEntityAdapter<PlanSessionFragment>({
  selectId: (planSessionFragment: PlanSessionFragment) => planSessionFragment.id,
  // Sort by list order (ascending)
  sortComparer: (a: PlanSessionFragment, b: PlanSessionFragment): number => {
    const trainingPlanIndexA = a.trainingPlanIndex;
    const trainingPlanIndexB = b.trainingPlanIndex;
    return trainingPlanIndexA.toString().localeCompare(trainingPlanIndexB.toString(), undefined, {numeric: true});
  }
});

export interface PlanSessionFragmentState extends EntityState<PlanSessionFragment> {
  allPlanSessionFragmentsFetched: boolean,
  createPlanSessionFragmentError: FirebaseError | Error | null,
  createPlanSessionFragmentProcessing: boolean,
  deletePlanSessionFragmentError: FirebaseError | Error | null,
  deletePlanSessionFragmentProcessing: boolean,
  fetchAllPlanSessionFragmentsError: FirebaseError | Error | null,
  fetchAllPlanSessionFragmentsProcessing: boolean,
  fetchMultiplePlanSessionFragmentsError: FirebaseError | Error | null,
  fetchMultiplePlanSessionFragmentsProcessing: boolean,
  fetchSinglePlanSessionFragmentError: FirebaseError | Error | null,
  fetchSinglePlanSessionFragmentProcessing: boolean,
  updatePlanSessionFragmentError: FirebaseError | Error | null,
  updatePlanSessionFragmentProcessing: boolean,
}

export const initialPlanSessionFragmentState: PlanSessionFragmentState = featureAdapter.getInitialState(
  {
    allPlanSessionFragmentsFetched: false,
    createPlanSessionFragmentError: null,
    createPlanSessionFragmentProcessing: false,
    deletePlanSessionFragmentError: null,
    deletePlanSessionFragmentProcessing: false,
    fetchAllPlanSessionFragmentsError: null,
    fetchAllPlanSessionFragmentsProcessing: false,
    fetchMultiplePlanSessionFragmentsError: null,
    fetchMultiplePlanSessionFragmentsProcessing: false,
    fetchSinglePlanSessionFragmentError: null,
    fetchSinglePlanSessionFragmentProcessing: false,
    updatePlanSessionFragmentError: null,
    updatePlanSessionFragmentProcessing: false,
  }
);