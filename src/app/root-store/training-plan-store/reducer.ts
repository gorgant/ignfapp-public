import {
  createReducer,
  MetaReducer,
  on
} from '@ngrx/store';
import { environment } from 'src/environments/environment';
import * as  TrainingPlanStoreActions from './actions';
import { featureAdapter, initialTrainingPlanState, TrainingPlanState } from './state';

export const trainingPlanStoreReducer = createReducer(
  initialTrainingPlanState,

  // Create Training Plan

  on(TrainingPlanStoreActions.createTrainingPlanRequested, (state, action) => {
    return {
      ...state,
      createTrainingPlanProcessing: true,
      createTrainingPlanError: null
    }
  }),
  on(TrainingPlanStoreActions.createTrainingPlanCompleted, (state, action) => {
    return featureAdapter.addOne(
      action.trainingPlan, {
        ...state,
        createTrainingPlanProcessing: false,
        newTrainingPlanId: action.trainingPlan.id
      }
    );
  }),
  on(TrainingPlanStoreActions.createTrainingPlanFailed, (state, action) => {
    return {
      ...state,
      createTrainingPlanProcessing: false,
      createTrainingPlanError: action.error
    }
  }),

  // Delete Training Plan

  on(TrainingPlanStoreActions.deleteTrainingPlanRequested, (state, action) => {
    return {
      ...state,
      deleteTrainingPlanProcessing: true,
      deleteTrainingPlanError: null
    }
  }),
  on(TrainingPlanStoreActions.deleteTrainingPlanCompleted, (state, action) => {
    return featureAdapter.removeOne(
      action.trainingPlanId, {
        ...state,
        deleteTrainingPlanProcessing: false,
      }
    );
  }),
  on(TrainingPlanStoreActions.deleteTrainingPlanFailed, (state, action) => {
    return {
      ...state,
      deleteTrainingPlanProcessing: false,
      deleteTrainingPlanError: action.error
    }
  }),

  // Fetch All Training Plans

  on(TrainingPlanStoreActions.fetchAllTrainingPlansRequested, (state, action) => {
    return {
      ...state,
      fetchAllTrainingPlansProcessing: true,
      fetchAllTrainingPlansError: null
    }
  }),
  on(TrainingPlanStoreActions.fetchAllTrainingPlansCompleted, (state, action) => {
    return featureAdapter.addMany(
      action.trainingPlans, {
        ...state,
        fetchAllTrainingPlansProcessing: false,
        allTrainingPlansFetched: true,
      }
    );
  }),
  on(TrainingPlanStoreActions.fetchAllTrainingPlansFailed, (state, action) => {
    return {
      ...state,
      fetchAllTrainingPlansProcessing: false,
      fetchAllTrainingPlansError: action.error
    }
  }),

  // Fetch Multiple Training Plans

  on(TrainingPlanStoreActions.fetchMultipleTrainingPlansRequested, (state, action) => {
    return {
      ...state,
      fetchMultipleTrainingPlansProcessing: true,
      fetchMultipleTrainingPlansError: null
    }
  }),
  on(TrainingPlanStoreActions.fetchMultipleTrainingPlansCompleted, (state, action) => {
    return featureAdapter.addMany(
      action.trainingPlans, {
        ...state,
        fetchMultipleTrainingPlansProcessing: false,
      }
    );
  }),
  on(TrainingPlanStoreActions.fetchMultipleTrainingPlansFailed, (state, action) => {
    return {
      ...state,
      fetchMultipleTrainingPlansProcessing: false,
      fetchMultipleTrainingPlansError: action.error
    }
  }),

  // Fetch Single Training Plan

  on(TrainingPlanStoreActions.fetchSingleTrainingPlanRequested, (state, action) => {
    return {
      ...state,
      fetchSingleTrainingPlanProcessing: true,
      fetchSingleTrainingPlanError: null
    }
  }),
  on(TrainingPlanStoreActions.fetchSingleTrainingPlanCompleted, (state, action) => {
    return featureAdapter.upsertOne(
      action.trainingPlan, {
        ...state,
        fetchSingleTrainingPlanProcessing: false,  
      }
    );
  }),
  on(TrainingPlanStoreActions.fetchSingleTrainingPlanFailed, (state, action) => {
    return {
      ...state,
      fetchSingleTrainingPlanProcessing: false,
      fetchSingleTrainingPlanError: action.error
    }
  }),

  // Purge New Training Plan Id

  on(TrainingPlanStoreActions.purgeTrainingPlanData, (state, action) => {
    return {
      ...state,
      newTrainingPlanId: null
    }
  }),

  // Purge Training Plan Data

  on(TrainingPlanStoreActions.purgeTrainingPlanData, (state, action) => {
    return featureAdapter.removeAll(
      {
        ...state, 
        youtubeVideoData: null
      }
    );
  }),


  // Update Training Plan
  
  on(TrainingPlanStoreActions.updateTrainingPlanRequested, (state, action) => {
    return {
      ...state,
      updateTrainingPlanProcessing: true,
      updateTrainingPlanError: null
    }
  }),
  on(TrainingPlanStoreActions.updateTrainingPlanCompleted, (state, action) => {
    return featureAdapter.updateOne(
      action.trainingPlanUpdates, {
        ...state,
        updateTrainingPlanProcessing: false,
      }
    )
  }),
  on(TrainingPlanStoreActions.updateTrainingPlanFailed, (state, action) => {
    return {
      ...state,
      updateTrainingPlanProcessing: false,
      updateTrainingPlanError: action.error
    }
  }),

);

export const trainingPlanMetaReducers: MetaReducer<TrainingPlanState>[] = !environment.production ? [] : [];

// Exporting a variety of selectors in the form of a object from the entity adapter
export const {
  selectAll,
  selectEntities,
  selectIds,
  selectTotal
} = featureAdapter.getSelectors();