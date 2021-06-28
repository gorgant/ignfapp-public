import {
  createReducer,
  MetaReducer,
  on
} from '@ngrx/store';
import { environment } from 'src/environments/environment';
import * as  UserStoreActions from './actions';
import { initialUserState, UserState } from './state';



export const userStoreReducer = createReducer(
  initialUserState,

  // Create User

  on(UserStoreActions.createUserRequested, (state, action) => {
    return {
      ...state,
      userUpdateProcessing: true,
      userUpdateError: false
    }
  }),
  on(UserStoreActions.createUserCompleted, (state, action) => {
    return {
      ...state,
      userUpdateProcessing: false,
      userData: action.newUser
    }
  }),
  on(UserStoreActions.createUserFailed, (state, action) => {
    return {
      ...state,
      userUpdateProcessing: false,
      userUpdateError: action.error
    }
  }),

  // Fetch User

  on(UserStoreActions.fetchUserRequested, (state, action) => {
    return {
      ...state,
      userFetchProcessing: true,
      userFetchError: false
    }
  }),
  on(UserStoreActions.fetchUserCompleted, (state, action) => {
    return {
      ...state,
      userFetchProcessing: false,
      userData: action.publicUser
    }
  }),
  on(UserStoreActions.fetchUserFailed, (state, action) => {
    return {
      ...state,
      userFetchProcessing: false,
      userFetchError: action.error
    }
  }),

  // Register Prelaunch User

  on(UserStoreActions.registerPrelaunchUserRequested, (state, action) => {
    return {
      ...state,
      userUpdateProcessing: true,
      userUpdateError: false
    }
  }),
  on(UserStoreActions.registerPrelaunchUserCompleted, (state, action) => {
    return {
      ...state,
      userUpdateProcessing: false,
      userData: action.prelaunchUser
    }
  }),
  on(UserStoreActions.registerPrelaunchUserFailed, (state, action) => {
    return {
      ...state,
      userUpdateProcessing: false,
      userUpdateError: action.error
    }
  }),
  
  // Update User
  
  on(UserStoreActions.updateUserRequested, (state, action) => {
    return {
      ...state,
      userUpdateProcessing: true,
      userUpdateError: false
    }
  }),
  on(UserStoreActions.updateUserCompleted, (state, action) => {
    return {
      ...state,
      userUpdateProcessing: false,
      userData: action.updatedUser
    }
  }),
  on(UserStoreActions.updateUserFailed, (state, action) => {
    return {
      ...state,
      userUpdateProcessing: false,
      userUpdateError: action.error
    }
  }),
  
);

export const userMetaReducers: MetaReducer<UserState>[] = !environment.production ? [] : [];
