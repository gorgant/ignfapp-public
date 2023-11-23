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
      publicUserData: action.userData
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
      createPublicUserError: null,
      createPublicUserProcessing: false,
      deletePublicUserError: null,
      deletePublicUserProcessing: false,
      fetchPublicUserError: null,
      fetchPublicUserProcessing: false,
      resizeAvatarError: null,
      resizeAvatarProcessing: false,
      resizeAvatarSucceeded: false,
      updatePublicUserError: null,
      updatePublicUserProcessing: false,
      uploadAvatarError: null,
      uploadAvatarProcessing: false,
      sendUpdateEmailConfirmationError: null,
      sendUpdateEmailConfirmationProcessing: false,
      avatarDownloadUrl: null,
      publicUserData: null,
    }
  }),

  // Purge Public User Errors

  on(UserStoreActions.purgePublicUserErrors, (state, action) => {
    return {
      ...state,
      createPublicUserError: null,
      deletePublicUserError: null,
      fetchPublicUserError: null,
      resizeAvatarError: null,
      updatePublicUserError: null,
      uploadAvatarError: null,
      sendUpdateEmailConfirmationError: null,
    }
  }),

  // Resize Avatar

  on(UserStoreActions.resizeAvatarRequested, (state, action) => {
    return {
      ...state,
      resizeAvatarProcessing: true,
      resizeAvatarError: null,
      resizeAvatarSucceeded: false,
    }
  }),
  on(UserStoreActions.resizeAvatarCompleted, (state, action) => {
    return {
      ...state,
      resizeAvatarProcessing: false,
      resizeAvatarSucceeded: action.resizeAvatarSucceeded
    }
  }),
  on(UserStoreActions.resizeAvatarFailed, (state, action) => {
    return {
      ...state,
      resizeAvatarProcessing: false,
      resizeAvatarError: action.error,
      resizeAvatarSucceeded: false,
    }
  }),

  // Send Update Email Confirmation

  on(UserStoreActions.sendUpdateEmailConfirmationRequested, (state, action) => {
    return {
      ...state,
      sendUpdateEmailConfirmationProcessing: true,
      sendUpdateEmailConfirmationError: null
    }
  }),
  on(UserStoreActions.sendUpdateEmailConfirmationCompleted, (state, action) => {
    return {
      ...state,
      sendUpdateEmailConfirmationProcessing: false,
    }
  }),
  on(UserStoreActions.sendUpdateEmailConfirmationFailed, (state, action) => {
    return {
      ...state,
      sendUpdateEmailConfirmationProcessing: false,
      sendUpdateEmailConfirmationError: action.error
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
      publicUserData: action.updatedUserData
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
