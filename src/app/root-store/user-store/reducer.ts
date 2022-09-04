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

  // Create Public User

  on(UserStoreActions.createPublicUserRequested, (state, action) => {
    return {
      ...state,
      createPublicUserProcessing: true,
      createPublicUserError: null
    }
  }),
  on(UserStoreActions.createPublicUserCompleted, (state, action) => {
    return {
      ...state,
      createPublicUserProcessing: false,
      publicUserData: action.newPublicUser
    }
  }),
  on(UserStoreActions.createPublicUserFailed, (state, action) => {
    return {
      ...state,
      createPublicUserProcessing: false,
      createPublicUserError: action.error
    }
  }),

  // Delete Public User

  on(UserStoreActions.deletePublicUserRequested, (state, action) => {
    return {
      ...state,
      deletePublicUserProcessing: true,
      deletePublicUserError: null
    }
  }),
  on(UserStoreActions.deletePublicUserCompleted, (state, action) => {
    return {
      ...state,
      deletePublicUserProcessing: false,
      publicUserData: null
    }
  }),
  on(UserStoreActions.deletePublicUserFailed, (state, action) => {
    return {
      ...state,
      deletePublicUserProcessing: false,
      deletePublicUserError: action.error
    }
  }),

  // Fetch Prelaunch User

  on(UserStoreActions.fetchPrelaunchUserRequested, (state, action) => {
    return {
      ...state,
      fetchPrelaunchUserProcessing: true,
      fetchPrelaunchUserError: null
    }
  }),
  on(UserStoreActions.fetchPrelaunchUserCompleted, (state, action) => {
    return {
      ...state,
      fetchPrelaunchUserProcessing: false,
      prelaunchUserData: action.prelaunchUser
    }
  }),
  on(UserStoreActions.fetchPrelaunchUserFailed, (state, action) => {
    return {
      ...state,
      fetchPrelaunchUserProcessing: false,
      fetchPrelaunchUserError: action.error
    }
  }),

  // Fetch Public User

  on(UserStoreActions.fetchPublicUserRequested, (state, action) => {
    return {
      ...state,
      fetchPublicUserProcessing: true,
      fetchPublicUserError: null
    }
  }),
  on(UserStoreActions.fetchPublicUserCompleted, (state, action) => {
    return {
      ...state,
      fetchPublicUserProcessing: false,
      publicUserData: action.publicUser
    }
  }),
  on(UserStoreActions.fetchPublicUserFailed, (state, action) => {
    return {
      ...state,
      fetchPublicUserProcessing: false,
      fetchPublicUserError: action.error
    }
  }),

  // Purge Public User Data
  on(UserStoreActions.purgePublicUserData, (state, action) => {
    return {
      ...state,
      prelaunchUserData: null,
      publicUserData: null,
      avatarDownloadUrl: null,
    }
  }),

  // Register Prelaunch User

  on(UserStoreActions.registerPrelaunchUserRequested, (state, action) => {
    return {
      ...state,
      registerPrelaunchUserProcessing: true,
      registerPrelaunchUserError: null
    }
  }),
  on(UserStoreActions.registerPrelaunchUserCompleted, (state, action) => {
    return {
      ...state,
      registerPrelaunchUserProcessing: false,
      prelaunchUserData: action.prelaunchUser
    }
  }),
  on(UserStoreActions.registerPrelaunchUserFailed, (state, action) => {
    return {
      ...state,
      registerPrelaunchUserProcessing: false,
      registerPrelaunchUserError: action.error
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

  // Update Prelaunch User
  
  on(UserStoreActions.updatePrelaunchUserRequested, (state, action) => {
    return {
      ...state,
      updatePrelaunchUserProcessing: true,
      updatePrelaunchUserError: null
    }
  }),
  on(UserStoreActions.updatePrelaunchUserCompleted, (state, action) => {
    return {
      ...state,
      updatePrelaunchUserProcessing: false,
      prelaunchUserData: action.updatedPrelaunchUser
    }
  }),
  on(UserStoreActions.updatePrelaunchUserFailed, (state, action) => {
    return {
      ...state,
      updatePrelaunchUserProcessing: false,
      updatePrelaunchUserError: action.error
    }
  }),
  
  // Update Public User
  
  on(UserStoreActions.updatePublicUserRequested, (state, action) => {
    return {
      ...state,
      updatePublicUserProcessing: true,
      updatePublicUserError: null
    }
  }),
  on(UserStoreActions.updatePublicUserCompleted, (state, action) => {
    return {
      ...state,
      updatePublicUserProcessing: false,
      publicUserData: action.updatedPublicUser
    }
  }),
  on(UserStoreActions.updatePublicUserFailed, (state, action) => {
    return {
      ...state,
      updatePublicUserProcessing: false,
      updatePublicUserError: action.error
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
