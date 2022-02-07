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
      createUserProcessing: true,
      createUserError: false
    }
  }),
  on(UserStoreActions.createUserCompleted, (state, action) => {
    return {
      ...state,
      createUserProcessing: false,
      userData: action.newUser
    }
  }),
  on(UserStoreActions.createUserFailed, (state, action) => {
    return {
      ...state,
      createUserProcessing: false,
      createUserError: action.error
    }
  }),

  // Fetch User

  on(UserStoreActions.fetchUserRequested, (state, action) => {
    return {
      ...state,
      fetchUserProcessing: true,
      fetchUserError: false
    }
  }),
  on(UserStoreActions.fetchUserCompleted, (state, action) => {
    return {
      ...state,
      fetchUserProcessing: false,
      userData: action.publicUser
    }
  }),
  on(UserStoreActions.fetchUserFailed, (state, action) => {
    return {
      ...state,
      fetchUserProcessing: false,
      fetchUserError: action.error
    }
  }),

  // Register Prelaunch User

  on(UserStoreActions.registerPrelaunchUserRequested, (state, action) => {
    return {
      ...state,
      updateUserProcessing: true,
      updateUserError: false
    }
  }),
  on(UserStoreActions.registerPrelaunchUserCompleted, (state, action) => {
    return {
      ...state,
      updateUserProcessing: false,
      userData: action.prelaunchUser
    }
  }),
  on(UserStoreActions.registerPrelaunchUserFailed, (state, action) => {
    return {
      ...state,
      updateUserProcessing: false,
      updateUserError: action.error
    }
  }),
  
  // Update User
  
  on(UserStoreActions.updateUserRequested, (state, action) => {
    return {
      ...state,
      updateUserProcessing: true,
      updateUserError: false
    }
  }),
  on(UserStoreActions.updateUserCompleted, (state, action) => {
    return {
      ...state,
      updateUserProcessing: false,
      userData: action.updatedUser
    }
  }),
  on(UserStoreActions.updateUserFailed, (state, action) => {
    return {
      ...state,
      updateUserProcessing: false,
      updateUserError: action.error
    }
  }),

  // Purge User Data
  on(UserStoreActions.purgeUserData, (state, action) => {
    return {
      ...state,
      userData: undefined
    }
  }),
  
);

export const userMetaReducers: MetaReducer<UserState>[] = !environment.production ? [] : [];
