import {
  createReducer,
  MetaReducer,
  on
} from '@ngrx/store';
import { environment } from 'src/environments/environment';
import * as  TrainingSessionStoreActions from './actions';
import { featureAdapter, initialTrainingSessionState, TrainingSessionState } from './state';

export const trainingSessionStoreReducer = createReducer(
  initialTrainingSessionState,

  // Create Training Session

  on(TrainingSessionStoreActions.createTrainingSessionRequested, (state, action) => {
    return {
      ...state,
      createTrainingSessionProcessing: true,
      createTrainingSessionError: null
    }
  }),
  on(TrainingSessionStoreActions.createTrainingSessionCompleted, (state, action) => {
    return featureAdapter.addOne(
      action.trainingSession, {
        ...state,
        createTrainingSessionProcessing: false,
      }
    );
  }),
  on(TrainingSessionStoreActions.createTrainingSessionFailed, (state, action) => {
    return {
      ...state,
      createTrainingSessionProcessing: false,
      createTrainingSessionError: action.error
    }
  }),

  // Delete Training Session

  on(TrainingSessionStoreActions.deleteTrainingSessionRequested, (state, action) => {
    return {
      ...state,
      deleteTrainingSessionProcessing: true,
      deleteTrainingSessionError: null
    }
  }),
  on(TrainingSessionStoreActions.deleteTrainingSessionCompleted, (state, action) => {
    return featureAdapter.removeOne(
      action.sessionId, {
        ...state,
        deleteTrainingSessionProcessing: false,
      }
    );
  }),
  on(TrainingSessionStoreActions.deleteTrainingSessionFailed, (state, action) => {
    return {
      ...state,
      deleteTrainingSessionProcessing: false,
      deleteTrainingSessionError: action.error
    }
  }),

  // Fetch All Training Sessions

  on(TrainingSessionStoreActions.fetchAllTrainingSessionsRequested, (state, action) => {
    return {
      ...state,
      fetchAllTrainingSessionsProcessing: true,
      fetchAllTrainingSessionsError: null
    }
  }),
  on(TrainingSessionStoreActions.fetchAllTrainingSessionsCompleted, (state, action) => {
    return featureAdapter.addMany(
      action.trainingSessions, {
        ...state,
        fetchAllTrainingSessionsProcessing: false,
        allTrainingSessionsFetched: true,
      }
    );
  }),
  on(TrainingSessionStoreActions.fetchAllTrainingSessionsFailed, (state, action) => {
    return {
      ...state,
      fetchAllTrainingSessionsProcessing: false,
      fetchAllTrainingSessionsError: action.error
    }
  }),

  // Fetch Multiple Training Sessions

  on(TrainingSessionStoreActions.fetchMultipleTrainingSessionsRequested, (state, action) => {
    return {
      ...state,
      fetchMultipleTrainingSessionsProcessing: true,
      fetchMultipleTrainingSessionsError: null
    }
  }),
  on(TrainingSessionStoreActions.fetchMultipleTrainingSessionsCompleted, (state, action) => {
    return featureAdapter.addMany(
      action.trainingSessions, {
        ...state,
        fetchMultipleTrainingSessionsProcessing: false,
      }
    );
  }),
  on(TrainingSessionStoreActions.fetchMultipleTrainingSessionsFailed, (state, action) => {
    return {
      ...state,
      fetchMultipleTrainingSessionsProcessing: false,
      fetchMultipleTrainingSessionsError: action.error
    }
  }),

  // Fetch Single Training Session

  on(TrainingSessionStoreActions.fetchSingleTrainingSessionRequested, (state, action) => {
    return {
      ...state,
      fetchSingleTrainingSessionProcessing: true,
      fetchSingleTrainingSessionError: null
    }
  }),
  on(TrainingSessionStoreActions.fetchSingleTrainingSessionCompleted, (state, action) => {
    return featureAdapter.upsertOne(
      action.trainingSession, {
        ...state,
        fetchSingleTrainingSessionProcessing: false,  
      }
    );
  }),
  on(TrainingSessionStoreActions.fetchSingleTrainingSessionFailed, (state, action) => {
    return {
      ...state,
      fetchSingleTrainingSessionProcessing: false,
      fetchSingleTrainingSessionError: action.error
    }
  }),

  // Fetch Youtube Video Data

  on(TrainingSessionStoreActions.fetchYoutubeVideoDataRequested, (state, action) => {
    return {
      ...state,
      fetchYoutubeVideoDataProcessing: true,
      fetchYoutubeVideoDataError: null
    }
  }),
  on(TrainingSessionStoreActions.fetchYoutubeVideoDataCompleted, (state, action) => {
    return {
      ...state,
      fetchYoutubeVideoDataProcessing: false,
      youtubeVideoData: action.youtubeVideoData
    }
  }),
  on(TrainingSessionStoreActions.fetchYoutubeVideoDataFailed, (state, action) => {
    return {
      ...state,
      fetchYoutubeVideoDataProcessing: false,
      youtubeVideoData: null,
      fetchYoutubeVideoDataError: action.error
    }
  }),

  // Purge Training Session Data

  on(TrainingSessionStoreActions.purgeTrainingSessionData, (state, action) => {
    return featureAdapter.removeAll(
      {
        ...state, 
      }
    );
  }),

  // Purge Youtube Video Data

  on(TrainingSessionStoreActions.purgeYoutubeVideoData, (state, action) => {
    return {
      ...state,
      youtubeVideoData: null,
      fetchYoutubeVideoDataError: null,
    }
  }),

  // Set Youtube Video Data

  on(TrainingSessionStoreActions.setYoutubeVideoData, (state, action) => {
    return {
      ...state,
      youtubeVideoData: action.youtubeVideoData
    }
  }),

  // Update Session Rating
  
  on(TrainingSessionStoreActions.updateSessionRatingRequested, (state, action) => {
    return {
      ...state,
      updateSessionRatingProcessing: true,
      updateSessionRatingError: null
    }
  }),
  on(TrainingSessionStoreActions.updateSessionRatingCompleted, (state, action) => {
    return {
      ...state,
      updateSessionRatingProcessing: false,
      updateSessionRatingError: null
    }
  }),
  on(TrainingSessionStoreActions.updateSessionRatingFailed, (state, action) => {
    return {
      ...state,
      updateSessionRatingProcessing: false,
      updateSessionRatingError: action.error
    }
  }),

  // Update Training Session
  
  on(TrainingSessionStoreActions.updateTrainingSessionRequested, (state, action) => {
    return {
      ...state,
      updateTrainingSessionProcessing: true,
      updateTrainingSessionError: null
    }
  }),
  on(TrainingSessionStoreActions.updateTrainingSessionCompleted, (state, action) => {
    return featureAdapter.updateOne(
      action.trainingSessionUpdates, {
        ...state,
        updateTrainingSessionProcessing: false,
      }
    )
  }),
  on(TrainingSessionStoreActions.updateTrainingSessionFailed, (state, action) => {
    return {
      ...state,
      updateTrainingSessionProcessing: false,
      updateTrainingSessionError: action.error
    }
  }),

);

export const trainingSessionMetaReducers: MetaReducer<TrainingSessionState>[] = !environment.production ? [] : [];

// Exporting a variety of selectors in the form of a object from the entity adapter
export const {
  selectAll,
  selectEntities,
  selectIds,
  selectTotal
} = featureAdapter.getSelectors();