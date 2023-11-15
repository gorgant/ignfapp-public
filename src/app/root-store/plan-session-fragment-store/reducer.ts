import {
  createReducer,
  MetaReducer,
  on
} from '@ngrx/store';
import { environment } from 'src/environments/environment';
import * as  PlanSessionFragmentStoreActions from './actions';
import { featureAdapter, initialPlanSessionFragmentState, PlanSessionFragmentState } from './state';

export const planSessionFragmentStoreReducer = createReducer(
  initialPlanSessionFragmentState,

  // Batch Delete Plan Session Fragments
  
  on(PlanSessionFragmentStoreActions.batchDeletePlanSessionFragmentsRequested, (state, action) => {
    return {
      ...state,
      batchDeletePlanSessionFragmentsProcessing: true,
      batchDeletePlanSessionFragmentsError: null
    }
  }),
  on(PlanSessionFragmentStoreActions.batchDeletePlanSessionFragmentsCompleted, (state, action) => {
    return featureAdapter.removeMany(
      action.planSessionFragmentIds, {
        ...state,
        batchDeletePlanSessionFragmentsProcessing: false,
      }
    )
  }),
  on(PlanSessionFragmentStoreActions.batchDeletePlanSessionFragmentsFailed, (state, action) => {
    return {
      ...state,
      batchDeletePlanSessionFragmentsProcessing: false,
      batchDeletePlanSessionFragmentsError: action.error
    }
  }),

  // Batch Modify Plan Session Fragments
  
  on(PlanSessionFragmentStoreActions.batchModifyPlanSessionFragmentsRequested, (state, action) => {
    return {
      ...state,
      batchModifyPlanSessionFragmentsProcessing: true,
      batchModifyPlanSessionFragmentsError: null
    }
  }),
  on(PlanSessionFragmentStoreActions.batchModifyPlanSessionFragmentsCompleted, (state, action) => {
    return featureAdapter.updateMany(
      action.planSessionFragmentUpdates, {
        ...state,
        batchModifyPlanSessionFragmentsProcessing: false,
      }
    )
  }),
  on(PlanSessionFragmentStoreActions.batchModifyPlanSessionFragmentsFailed, (state, action) => {
    return {
      ...state,
      batchModifyPlanSessionFragmentsProcessing: false,
      batchModifyPlanSessionFragmentsError: action.error
    }
  }),
  
  // Create Plan Session Fragment

  on(PlanSessionFragmentStoreActions.createPlanSessionFragmentRequested, (state, action) => {
    return {
      ...state,
      createPlanSessionFragmentProcessing: true,
      createPlanSessionFragmentError: null
    }
  }),
  on(PlanSessionFragmentStoreActions.createPlanSessionFragmentCompleted, (state, action) => {
    return featureAdapter.addOne(
      action.planSessionFragment, {
        ...state,
        createPlanSessionFragmentProcessing: false,
      }
    );
  }),
  on(PlanSessionFragmentStoreActions.createPlanSessionFragmentFailed, (state, action) => {
    return {
      ...state,
      createPlanSessionFragmentProcessing: false,
      createPlanSessionFragmentError: action.error
    }
  }),

  // Delete Plan Session Fragment

  on(PlanSessionFragmentStoreActions.deletePlanSessionFragmentRequested, (state, action) => {
    return {
      ...state,
      deletePlanSessionFragmentProcessing: true,
      deletePlanSessionFragmentError: null
    }
  }),
  on(PlanSessionFragmentStoreActions.deletePlanSessionFragmentCompleted, (state, action) => {
    return featureAdapter.removeOne(
      action.planSessionFragmentId, {
        ...state,
        deletePlanSessionFragmentProcessing: false,
      }
    );
  }),
  on(PlanSessionFragmentStoreActions.deletePlanSessionFragmentFailed, (state, action) => {
    return {
      ...state,
      deletePlanSessionFragmentProcessing: false,
      deletePlanSessionFragmentError: action.error
    }
  }),

  // Fetch All Plan Session Fragments

  on(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsRequested, (state, action) => {
    return {
      ...state,
      fetchAllPlanSessionFragmentsProcessing: true,
      fetchAllPlanSessionFragmentsError: null,
    }
  }),
  on(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsCompleted, (state, action) => {
    return featureAdapter.setAll(
      action.planSessionFragments, {
        ...state,
        fetchAllPlanSessionFragmentsProcessing: false,
        allPlanSessionFragmentsFetched: true,
      }
    );
  }),
  on(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsFailed, (state, action) => {
    return {
      ...state,
      fetchAllPlanSessionFragmentsProcessing: false,
      fetchAllPlanSessionFragmentsError: action.error,
      allPlanSessionFragmentsFetched: false,
    }
  }),

  // Fetch Multiple Plan Session Fragments

  on(PlanSessionFragmentStoreActions.fetchMultiplePlanSessionFragmentsRequested, (state, action) => {
    return {
      ...state,
      fetchMultiplePlanSessionFragmentsProcessing: true,
      fetchMultiplePlanSessionFragmentsError: null
    }
  }),
  on(PlanSessionFragmentStoreActions.fetchMultiplePlanSessionFragmentsCompleted, (state, action) => {
    return featureAdapter.addMany(
      action.planSessionFragments, {
        ...state,
        fetchMultiplePlanSessionFragmentsProcessing: false,
      }
    );
  }),
  on(PlanSessionFragmentStoreActions.fetchMultiplePlanSessionFragmentsFailed, (state, action) => {
    return {
      ...state,
      fetchMultiplePlanSessionFragmentsProcessing: false,
      fetchMultiplePlanSessionFragmentsError: action.error
    }
  }),

  // Fetch Single Plan Session Fragment

  on(PlanSessionFragmentStoreActions.fetchSinglePlanSessionFragmentRequested, (state, action) => {
    return {
      ...state,
      fetchSinglePlanSessionFragmentProcessing: true,
      fetchSinglePlanSessionFragmentError: null
    }
  }),
  on(PlanSessionFragmentStoreActions.fetchSinglePlanSessionFragmentCompleted, (state, action) => {
    return featureAdapter.upsertOne(
      action.planSessionFragment, {
        ...state,
        fetchSinglePlanSessionFragmentProcessing: false,  
      }
    );
  }),
  on(PlanSessionFragmentStoreActions.fetchSinglePlanSessionFragmentFailed, (state, action) => {
    return {
      ...state,
      fetchSinglePlanSessionFragmentProcessing: false,
      fetchSinglePlanSessionFragmentError: action.error
    }
  }),

  // Purge Plan Session Fragment Data

  on(PlanSessionFragmentStoreActions.purgePlanSessionFragmentData, (state, action) => {
    return featureAdapter.removeAll(
      {
        ...state, 
        allPlanSessionFragmentsFetched: false,
        batchDeletePlanSessionFragmentsError: null,
        batchDeletePlanSessionFragmentsProcessing: false,
        batchModifyPlanSessionFragmentsError: null,
        batchModifyPlanSessionFragmentsProcessing: false,
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
  }),

  // Pur


  // Update Plan Session Fragment
  
  on(PlanSessionFragmentStoreActions.updatePlanSessionFragmentRequested, (state, action) => {
    return {
      ...state,
      updatePlanSessionFragmentProcessing: true,
      updatePlanSessionFragmentError: null
    }
  }),
  on(PlanSessionFragmentStoreActions.updatePlanSessionFragmentCompleted, (state, action) => {
    return featureAdapter.updateOne(
      action.planSessionFragmentUpdates, {
        ...state,
        updatePlanSessionFragmentProcessing: false,
      }
    )
  }),
  on(PlanSessionFragmentStoreActions.updatePlanSessionFragmentFailed, (state, action) => {
    return {
      ...state,
      updatePlanSessionFragmentProcessing: false,
      updatePlanSessionFragmentError: action.error
    }
  }),

);

export const planSessionFragmentMetaReducers: MetaReducer<PlanSessionFragmentState>[] = !environment.production ? [] : [];

// Exporting a variety of selectors in the form of a object from the entity adapter
export const {
  selectAll,
  selectEntities,
  selectIds,
  selectTotal
} = featureAdapter.getSelectors();