import {
  createReducer,
  MetaReducer,
  on
} from '@ngrx/store';
import { environment } from 'src/environments/environment';
import * as  TrainingRecordStoreActions from './actions';
import { featureAdapter, initialTrainingRecordState, TrainingRecordState } from './state';

export const trainingRecordStoreReducer = createReducer(
  initialTrainingRecordState,

  // Create Training Record

  on(TrainingRecordStoreActions.createTrainingRecordRequested, (state, action) => {
    return {
      ...state,
      createTrainingRecordProcessing: true,
      createTrainingRecordError: null
    }
  }),
  on(TrainingRecordStoreActions.createTrainingRecordCompleted, (state, action) => {
    return featureAdapter.addOne(
      action.trainingRecord, {
        ...state,
        createTrainingRecordProcessing: false,
      }
    );
  }),
  on(TrainingRecordStoreActions.createTrainingRecordFailed, (state, action) => {
    return {
      ...state,
      createTrainingRecordProcessing: false,
      createTrainingRecordError: action.error
    }
  }),

  // Delete Training Record

  on(TrainingRecordStoreActions.deleteTrainingRecordRequested, (state, action) => {
    return {
      ...state,
      deleteTrainingRecordProcessing: true,
      deleteTrainingRecordError: null
    }
  }),
  on(TrainingRecordStoreActions.deleteTrainingRecordCompleted, (state, action) => {
    return featureAdapter.removeOne(
      action.recordId, {
        ...state,
        deleteTrainingRecordProcessing: false,
      }
    );
  }),
  on(TrainingRecordStoreActions.deleteTrainingRecordFailed, (state, action) => {
    return {
      ...state,
      deleteTrainingRecordProcessing: false,
      deleteTrainingRecordError: action.error
    }
  }),

  // Fetch All Training Records

  on(TrainingRecordStoreActions.fetchAllTrainingRecordsRequested, (state, action) => {
    return {
      ...state,
      fetchAllTrainingRecordsProcessing: true,
      fetchAllTrainingRecordsError: null
    }
  }),
  on(TrainingRecordStoreActions.fetchAllTrainingRecordsCompleted, (state, action) => {
    return featureAdapter.addMany(
      action.trainingRecords, {
        ...state,
        fetchAllTrainingRecordsProcessing: false,
        allTrainingRecordsFetched: true,
      }
    );
  }),
  on(TrainingRecordStoreActions.fetchAllTrainingRecordsFailed, (state, action) => {
    return {
      ...state,
      fetchAllTrainingRecordsProcessing: false,
      fetchAllTrainingRecordsError: action.error,
      allTrainingRecordsFetched: false,
    }
  }),

  // Fetch Multiple Training Records

  on(TrainingRecordStoreActions.fetchMultipleTrainingRecordsRequested, (state, action) => {
    return {
      ...state,
      fetchMultipleTrainingRecordsProcessing: true,
      fetchMultipleTrainingRecordsError: null
    }
  }),
  on(TrainingRecordStoreActions.fetchMultipleTrainingRecordsCompleted, (state, action) => {
    return featureAdapter.addMany(
      action.trainingRecords, {
        ...state,
        fetchMultipleTrainingRecordsProcessing: false,
      }
    );
  }),
  on(TrainingRecordStoreActions.fetchMultipleTrainingRecordsFailed, (state, action) => {
    return {
      ...state,
      fetchMultipleTrainingRecordsProcessing: false,
      fetchMultipleTrainingRecordsError: action.error
    }
  }),

  // Fetch Single Training Record

  on(TrainingRecordStoreActions.fetchSingleTrainingRecordRequested, (state, action) => {
    return {
      ...state,
      fetchSingleTrainingRecordProcessing: true,
      fetchSingleTrainingRecordError: null
    }
  }),
  on(TrainingRecordStoreActions.fetchSingleTrainingRecordCompleted, (state, action) => {
    return featureAdapter.upsertOne(
      action.trainingRecord, {
        ...state,
        fetchSingleTrainingRecordProcessing: false,  
      }
    );
  }),
  on(TrainingRecordStoreActions.fetchSingleTrainingRecordFailed, (state, action) => {
    return {
      ...state,
      fetchSingleTrainingRecordProcessing: false,
      fetchSingleTrainingRecordError: action.error
    }
  }),

  // Purge Training Record Data

  on(TrainingRecordStoreActions.purgeTrainingRecordData, (state, action) => {
    return featureAdapter.removeAll(
      {
        ...state, 
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
  }),


  // Update Training Record
  
  on(TrainingRecordStoreActions.updateTrainingRecordRequested, (state, action) => {
    return {
      ...state,
      updateTrainingRecordProcessing: true,
      updateTrainingRecordError: null
    }
  }),
  on(TrainingRecordStoreActions.updateTrainingRecordCompleted, (state, action) => {
    return featureAdapter.updateOne(
      action.trainingRecordUpdates, {
        ...state,
        updateTrainingRecordProcessing: false,
      }
    )
  }),
  on(TrainingRecordStoreActions.updateTrainingRecordFailed, (state, action) => {
    return {
      ...state,
      updateTrainingRecordProcessing: false,
      updateTrainingRecordError: action.error
    }
  }),

);

export const trainingRecordMetaReducers: MetaReducer<TrainingRecordState>[] = !environment.production ? [] : [];

// Exporting a variety of selectors in the form of a object from the entity adapter
export const {
  selectAll,
  selectEntities,
  selectIds,
  selectTotal
} = featureAdapter.getSelectors();