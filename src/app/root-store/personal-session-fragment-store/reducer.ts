import {
  createReducer,
  MetaReducer,
  on
} from '@ngrx/store';
import { environment } from 'src/environments/environment';
import * as  PersonalSessionFragmentStoreActions from './actions';
import { featureAdapter, initialPersonalSessionFragmentState, PersonalSessionFragmentState } from './state';

export const personalSessionFragmentStoreReducer = createReducer(
  initialPersonalSessionFragmentState,

  // Create Personal Session Fragment

  on(PersonalSessionFragmentStoreActions.createPersonalSessionFragmentRequested, (state, action) => {
    return {
      ...state,
      createPersonalSessionFragmentProcessing: true,
      createPersonalSessionFragmentError: null
    }
  }),
  on(PersonalSessionFragmentStoreActions.createPersonalSessionFragmentCompleted, (state, action) => {
    return featureAdapter.addOne(
      action.personalSessionFragment, {
        ...state,
        createPersonalSessionFragmentProcessing: false,
      }
    );
  }),
  on(PersonalSessionFragmentStoreActions.createPersonalSessionFragmentFailed, (state, action) => {
    return {
      ...state,
      createPersonalSessionFragmentProcessing: false,
      createPersonalSessionFragmentError: action.error
    }
  }),

  // Delete Personal Session Fragment

  on(PersonalSessionFragmentStoreActions.deletePersonalSessionFragmentRequested, (state, action) => {
    return {
      ...state,
      deletePersonalSessionFragmentProcessing: true,
      deletePersonalSessionFragmentError: null
    }
  }),
  on(PersonalSessionFragmentStoreActions.deletePersonalSessionFragmentCompleted, (state, action) => {
    return featureAdapter.removeOne(
      action.personalSessionFragmentId, {
        ...state,
        deletePersonalSessionFragmentProcessing: false,
      }
    );
  }),
  on(PersonalSessionFragmentStoreActions.deletePersonalSessionFragmentFailed, (state, action) => {
    return {
      ...state,
      deletePersonalSessionFragmentProcessing: false,
      deletePersonalSessionFragmentError: action.error
    }
  }),

  // Fetch All Personal Session Fragments

  on(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsRequested, (state, action) => {
    return {
      ...state,
      fetchAllPersonalSessionFragmentsProcessing: true,
      fetchAllPersonalSessionFragmentsError: null
    }
  }),
  on(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsCompleted, (state, action) => {
    return featureAdapter.addMany(
      action.personalSessionFragments, {
        ...state,
        fetchAllPersonalSessionFragmentsProcessing: false,
        allPersonalSessionFragmentsFetched: true,
      }
    );
  }),
  on(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsFailed, (state, action) => {
    return {
      ...state,
      fetchAllPersonalSessionFragmentsProcessing: false,
      fetchAllPersonalSessionFragmentsError: action.error
    }
  }),

  // Fetch Multiple Personal Session Fragments

  on(PersonalSessionFragmentStoreActions.fetchMultiplePersonalSessionFragmentsRequested, (state, action) => {
    return {
      ...state,
      fetchMultiplePersonalSessionFragmentsProcessing: true,
      fetchMultiplePersonalSessionFragmentsError: null
    }
  }),
  on(PersonalSessionFragmentStoreActions.fetchMultiplePersonalSessionFragmentsCompleted, (state, action) => {
    return featureAdapter.addMany(
      action.personalSessionFragments, {
        ...state,
        fetchMultiplePersonalSessionFragmentsProcessing: false,
      }
    );
  }),
  on(PersonalSessionFragmentStoreActions.fetchMultiplePersonalSessionFragmentsFailed, (state, action) => {
    return {
      ...state,
      fetchMultiplePersonalSessionFragmentsProcessing: false,
      fetchMultiplePersonalSessionFragmentsError: action.error
    }
  }),

  // Fetch Single Personal Session Fragment

  on(PersonalSessionFragmentStoreActions.fetchSinglePersonalSessionFragmentRequested, (state, action) => {
    return {
      ...state,
      fetchSinglePersonalSessionFragmentProcessing: true,
      fetchSinglePersonalSessionFragmentError: null
    }
  }),
  on(PersonalSessionFragmentStoreActions.fetchSinglePersonalSessionFragmentCompleted, (state, action) => {
    return featureAdapter.upsertOne(
      action.personalSessionFragment, {
        ...state,
        fetchSinglePersonalSessionFragmentProcessing: false,  
      }
    );
  }),
  on(PersonalSessionFragmentStoreActions.fetchSinglePersonalSessionFragmentFailed, (state, action) => {
    return {
      ...state,
      fetchSinglePersonalSessionFragmentProcessing: false,
      fetchSinglePersonalSessionFragmentError: action.error
    }
  }),

  // Purge Personal Session Fragment Data

  on(PersonalSessionFragmentStoreActions.purgePersonalSessionFragmentData, (state, action) => {
    return featureAdapter.removeAll(
      {
        ...state, 
        youtubeVideoData: null
      }
    );
  }),


  // Update Personal Session Fragment
  
  on(PersonalSessionFragmentStoreActions.updatePersonalSessionFragmentRequested, (state, action) => {
    return {
      ...state,
      updatePersonalSessionFragmentProcessing: true,
      updatePersonalSessionFragmentError: null
    }
  }),
  on(PersonalSessionFragmentStoreActions.updatePersonalSessionFragmentCompleted, (state, action) => {
    return featureAdapter.updateOne(
      action.personalSessionFragmentUpdates, {
        ...state,
        updatePersonalSessionFragmentProcessing: false,
      }
    )
  }),
  on(PersonalSessionFragmentStoreActions.updatePersonalSessionFragmentFailed, (state, action) => {
    return {
      ...state,
      updatePersonalSessionFragmentProcessing: false,
      updatePersonalSessionFragmentError: action.error
    }
  }),

);

export const personalSessionFragmentMetaReducers: MetaReducer<PersonalSessionFragmentState>[] = !environment.production ? [] : [];

// Exporting a variety of selectors in the form of a object from the entity adapter
export const {
  selectAll,
  selectEntities,
  selectIds,
  selectTotal
} = featureAdapter.getSelectors();