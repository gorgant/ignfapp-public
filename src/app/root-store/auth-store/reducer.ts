import {
  createReducer,
  MetaReducer,
  on
} from '@ngrx/store';
import { environment } from 'src/environments/environment';
import * as AuthStoreActions from './actions';
import { AuthState, initialAuthState } from './state';



export const authStoreReducer = createReducer(
  initialAuthState,

  // Auth Guard Failure

  on(AuthStoreActions.authGuardValidated, (state, action) => {
    return {
      ...state,
      authGuardError: null
    }
  }),

  on(AuthStoreActions.authGuardFailed, (state, action) => {
    return {
      ...state,
      authGuardError: action.error
    }
  }),

  // Confirm Password

  on(AuthStoreActions.confirmPasswordRequested, (state, action) => {
    return {
      ...state,
      confirmPasswordProcessing: true,
      confirmPasswordError: null
    }
  }),
  on(AuthStoreActions.confirmPasswordCompleted, (state, action) => {
    return {
      ...state,
      confirmPasswordProcessing: false,
    }
  }),
  on(AuthStoreActions.confirmPasswordFailed, (state, action) => {
    return {
      ...state,
      confirmPasswordProcessing: false,
      confirmPasswordError: action.error
    }
  }),

  // Detect Cached User

  on(AuthStoreActions.detectCachedUserRequested, (state, action) => {
    return {
      ...state,
      authProcessing: true,
      authError: null
    }
  }),
  on(AuthStoreActions.detectCachedUserCompleted, (state, action) => {
    return {
      ...state,
      authProcessing: false,
      authResultsData: action.authResultsData
    }
  }),
  on(AuthStoreActions.detectCachedUserFailed, (state, action) => {
    return {
      ...state,
      authProcessing: false,
      authError: action.error
    }
  }),

  // Email Auth

  on(AuthStoreActions.emailAuthRequested, (state, action) => {
    return {
      ...state,
      emailAuthProcessing: true,
      emailAuthError: null
    }
  }),
  on(AuthStoreActions.emailAuthCompleted, (state, action) => {
    return {
      ...state,
      emailAuthProcessing: false,
      authResultsData: action.authResultsData
    }
  }),
  on(AuthStoreActions.emailAuthFailed, (state, action) => {
    return {
      ...state,
      emailAuthProcessing: false,
      emailAuthError: action.error
    }
  }),
  
  // Email Signup

  on(AuthStoreActions.emailSignupRequested, (state, action) => {
    return {
      ...state,
      emailSignupProcessing: true,
      emailSignupError: null
    }
  }),
  on(AuthStoreActions.emailSignupCompleted, (state, action) => {
    return {
      ...state,
      emailSignupProcessing: false,
      authResultsData: action.authResultsData
    }
  }),
  on(AuthStoreActions.emailSignupFailed, (state, action) => {
    return {
      ...state,
      emailSignupProcessing: false,
      emailSignupError: action.error
    }
  }),

  // Facebook Auth

  on(AuthStoreActions.facebookAuthRequested, (state, action) => {
    return {
      ...state,
      facebookAuthProcessing: true,
      facebookAuthError: null
    }
  }),
  on(AuthStoreActions.facebookAuthCompleted, (state, action) => {
    return {
      ...state,
      facebookAuthProcessing: false,
      authResultsData: action.authResultsData
    }
  }),
  on(AuthStoreActions.facebookAuthFailed, (state, action) => {
    return {
      ...state,
      facebookAuthProcessing: false,
      facebookAuthError: action.error
    }
  }),

  // Google Auth

  on(AuthStoreActions.googleAuthRequested, (state, action) => {
    return {
      ...state,
      googleAuthProcessing: true,
      googleAuthError: null
    }
  }),
  on(AuthStoreActions.googleAuthCompleted, (state, action) => {
    return {
      ...state,
      googleAuthProcessing: false,
      authResultsData: action.authResultsData
    }
  }),
  on(AuthStoreActions.googleAuthFailed, (state, action) => {
    return {
      ...state,
      googleAuthProcessing: false,
      googleAuthError: action.error
    }
  }),
  
  // Logout

  on(AuthStoreActions.logout, (state, action) => {
    return {
    ...state,
    authGuardError: null,
    confirmPasswordError: null,
    confirmPasswordProcessing: false,
    emailAuthError: null,
    emailAuthProcessing: false,
    emailSignupError: null,
    emailSignupProcessing: false,
    facebookAuthError: null,
    facebookAuthProcessing: false,
    googleAuthError: null,
    googleAuthProcessing: false,
    reloadAuthDataError: null, 
    reloadAuthDataProcessing: false,
    resetPasswordError: null,
    resetPasswordProcessing: false,
    updateEmailError: null,
    updateEmailProcessing: false,
    updateEmailSucceeded: false,
    verifyEmailError: null,
    verifyEmailProcessing: false,
    verifyEmailSucceeded: false,
    authResultsData: null,
    }
  }),

  // Purge Auth Errors

  on(AuthStoreActions.purgeAuthErrors, (state, action) => {
    return {
      ...state,
      authGuardError: null,
      confirmPasswordError: null,
      emailAuthError: null,
      emailSignupError: null,
      facebookAuthError: null,
      googleAuthError: null,
      reloadAuthDataError: null, 
      resetPasswordError: null,
      updateEmailError: null,
      verifyEmailError: null,
    }
  }),
  
  // Reload Auth Data

  on(AuthStoreActions.reloadAuthDataRequested, (state, action) => {
    return {
      ...state,
      reloadAuthDataProcessing: true,
      reloadAuthDataError: null,
    }
  }),
  on(AuthStoreActions.reloadAuthDataCompleted, (state, action) => {
    return {
      ...state,
      reloadAuthDataProcessing: false,
      authResultsData: action.authResultsData
    }
  }),
  on(AuthStoreActions.reloadAuthDataFailed, (state, action) => {
    return {
      ...state,
      reloadAuthDataProcessing: false,
      reloadAuthDataError: action.error,
    }
  }),

  // Reset Password

  on(AuthStoreActions.resetPasswordRequested, (state, action) => {
    return {
      ...state,
      resetPasswordProcessing: true,
      resetPasswordError: null,
    }
  }),
  on(AuthStoreActions.resetPasswordCompleted, (state, action) => {
    return {
      ...state,
      resetPasswordProcessing: false,
    }
  }),
  on(AuthStoreActions.resetPasswordFailed, (state, action) => {
    return {
      ...state,
      resetPasswordProcessing: false,
      resetPasswordError: action.error,
    }
  }),

  // Update Email

  on(AuthStoreActions.updateEmailRequested, (state, action) => {
    return {
      ...state,
      updateEmailProcessing: true,
      updateEmailError: null,
      updateEmailSucceeded: false,
    }
  }),
  on(AuthStoreActions.updateEmailCompleted, (state, action) => {
    return {
      ...state,
      updateEmailProcessing: false,
      updateEmailSucceeded: action.updateEmailSucceeded,
    }
  }),
  on(AuthStoreActions.updateEmailFailed, (state, action) => {
    return {
      ...state,
      updateEmailProcessing: false,
      updateEmailError: action.error,
      updateEmailSucceeded: false,
    }
  }),

  // Verify Email

  on(AuthStoreActions.verifyEmailRequested, (state, action) => {
    return {
      ...state,
      verifyEmailProcessing: true,
      verifyEmailError: null,
      verifyEmailSucceeded: false,
    }
  }),
  on(AuthStoreActions.verifyEmailCompleted, (state, action) => {
    return {
      ...state,
      verifyEmailProcessing: false,
      verifyEmailSucceeded: action.verifyEmailSucceeded,
    }
  }),
  on(AuthStoreActions.verifyEmailFailed, (state, action) => {
    return {
      ...state,
      verifyEmailProcessing: false,
      verifyEmailError: action.error,
      verifyEmailSucceeded: false,
    }
  }),

);

export const authMetaReducers: MetaReducer<AuthState>[] = !environment.production ? [] : [];
