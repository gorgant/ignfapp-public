import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { FirebaseError } from "firebase/app";
import { PersonalSessionFragment } from "shared-models/train/personal-session-fragment.model";

export const personalSessionFragmentFeatureKey = PublicStoreFeatureKeys.PERSONAL_SESSSION_FRAGMENT;

export const featureAdapter: EntityAdapter<PersonalSessionFragment> = createEntityAdapter<PersonalSessionFragment>({
  selectId: (personalSessionFragment: PersonalSessionFragment) => personalSessionFragment.id,
});

export interface PersonalSessionFragmentState extends EntityState<PersonalSessionFragment> {
  allPersonalSessionFragmentsFetched: boolean,
  batchCreatePersonalSessionFragmentsError: FirebaseError | Error | null,
  batchCreatePersonalSessionFragmentsProcessing: boolean,
  batchDeletePersonalSessionFragmentsError: FirebaseError | Error | null,
  batchDeletePersonalSessionFragmentsProcessing: boolean,
  batchModifyPersonalSessionFragmentsError: FirebaseError | Error | null,
  batchModifyPersonalSessionFragmentsProcessing: boolean,
  createPersonalSessionFragmentError: FirebaseError | Error | null,
  createPersonalSessionFragmentProcessing: boolean,
  deletePersonalSessionFragmentError: FirebaseError | Error | null,
  deletePersonalSessionFragmentProcessing: boolean,
  fetchAllPersonalSessionFragmentsError: FirebaseError | Error | null,
  fetchAllPersonalSessionFragmentsProcessing: boolean,
  fetchMultiplePersonalSessionFragmentsError: FirebaseError | Error | null,
  fetchMultiplePersonalSessionFragmentsProcessing: boolean,
  fetchSinglePersonalSessionFragmentError: FirebaseError | Error | null,
  fetchSinglePersonalSessionFragmentProcessing: boolean,
  updatePersonalSessionFragmentError: FirebaseError | Error | null,
  updatePersonalSessionFragmentProcessing: boolean,
}

export const initialPersonalSessionFragmentState: PersonalSessionFragmentState = featureAdapter.getInitialState(
  {
    allPersonalSessionFragmentsFetched: false,
    batchCreatePersonalSessionFragmentsError: null,
    batchCreatePersonalSessionFragmentsProcessing: false,
    batchDeletePersonalSessionFragmentsError: null,
    batchDeletePersonalSessionFragmentsProcessing: false,
    batchModifyPersonalSessionFragmentsError: null,
    batchModifyPersonalSessionFragmentsProcessing: false,
    createPersonalSessionFragmentError: null,
    createPersonalSessionFragmentProcessing: false,
    deletePersonalSessionFragmentError: null,
    deletePersonalSessionFragmentProcessing: false,
    fetchAllPersonalSessionFragmentsError: null,
    fetchAllPersonalSessionFragmentsProcessing: false,
    fetchMultiplePersonalSessionFragmentsError: null,
    fetchMultiplePersonalSessionFragmentsProcessing: false,
    fetchSinglePersonalSessionFragmentError: null,
    fetchSinglePersonalSessionFragmentProcessing: false,
    updatePersonalSessionFragmentError: null,
    updatePersonalSessionFragmentProcessing: false,
  }
);