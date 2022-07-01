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
      createUserError: null
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
      fetchUserError: null
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

  // Purge User Data
  on(UserStoreActions.purgeUserData, (state, action) => {
    return {
      ...state,
      userData: null
    }
  }),

  // Register Prelaunch User

  on(UserStoreActions.registerPrelaunchUserRequested, (state, action) => {
    return {
      ...state,
      updateUserProcessing: true,
      updateUserError: null
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

  // Resize Avatar

  on(UserStoreActions.resizeAvatarRequested, (state, action) => {
    return {
      ...state,
      resizeAvatarProcessing: true,
      resizeAvatarError: null
    }
  }),
  on(UserStoreActions.resizeAvatarCompleted, (state, action) => {
    return {
      ...state,
      resizeAvatarProcessing: false,
    }
  }),
  on(UserStoreActions.resizeAvatarFailed, (state, action) => {
    return {
      ...state,
      resizeAvatarProcessing: false,
      resizeAvatarError: action.error
    }
  }),
  
  // Update User
  
  on(UserStoreActions.updateUserRequested, (state, action) => {
    return {
      ...state,
      updateUserProcessing: true,
      updateUserError: null
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

  // Upload Avatar

  on(UserStoreActions.uploadAvatarRequested, (state, action) => {
    return {
      ...state,
      uploadAvatarProcessing: true,
      uploadAvatarError: null
    }
  }),
  on(UserStoreActions.uploadAvatarCompleted, (state, action) => {
    return {
      ...state,
      uploadAvatarProcessing: false,
      avatarDownloadUrl: action.avatarDownloadUrl
    }
  }),
  on(UserStoreActions.uploadAvatarFailed, (state, action) => {
    return {
      ...state,
      uploadAvatarProcessing: false,
      uploadAvatarError: action.error
    }
  }),
  
);

export const userMetaReducers: MetaReducer<UserState>[] = !environment.production ? [] : [];
