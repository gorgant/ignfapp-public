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
      authGuardError: undefined
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
      confirmPasswordError: undefined
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
      authError: undefined
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
      authProcessing: true,
      authError: undefined
    }
  }),
  on(AuthStoreActions.emailAuthCompleted, (state, action) => {
    return {
      ...state,
      authProcessing: false,
      authResultsData: action.authResultsData
    }
  }),
  on(AuthStoreActions.emailAuthFailed, (state, action) => {
    return {
      ...state,
      authProcessing: false,
      authError: action.error
    }
  }),
  
  // Email Signup

  on(AuthStoreActions.emailSignupRequested, (state, action) => {
    return {
      ...state,
      signupProcessing: true,
      signupError: undefined
    }
  }),
  on(AuthStoreActions.emailSignupCompleted, (state, action) => {
    return {
      ...state,
      signupProcessing: false,
      authResultsData: action.authResultsData
    }
  }),
  on(AuthStoreActions.emailSignupFailed, (state, action) => {
    return {
      ...state,
      signupProcessing: false,
      signupError: action.error
    }
  }),

  // Facebook Auth

  on(AuthStoreActions.facebookAuthRequested, (state, action) => {
    return {
      ...state,
      authProcessing: true,
      authError: undefined
    }
  }),
  on(AuthStoreActions.facebookAuthCompleted, (state, action) => {
    return {
      ...state,
      authProcessing: false,
      authResultsData: action.authResultsData
    }
  }),
  on(AuthStoreActions.facebookAuthFailed, (state, action) => {
    return {
      ...state,
      authProcessing: false,
      authError: action.error
    }
  }),

  // Google Auth

  on(AuthStoreActions.googleAuthRequested, (state, action) => {
    return {
      ...state,
      authProcessing: true,
      authError: undefined
    }
  }),
  on(AuthStoreActions.googleAuthCompleted, (state, action) => {
    return {
      ...state,
      authProcessing: false,
      authResultsData: action.authResultsData
    }
  }),
  on(AuthStoreActions.googleAuthFailed, (state, action) => {
    return {
      ...state,
      authProcessing: false,
      authError: action.error
    }
  }),
  
  // Logout

  on(AuthStoreActions.logout, (state, action) => {
    return {
      ...state,
      authResultsData: undefined
    }
  }),

  // Reset Password

  on(AuthStoreActions.resetPasswordRequested, (state, action) => {
    return {
      ...state,
      resetPasswordProcessing: true,
      resetPasswordError: undefined,
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
      updateEmailError: undefined
    }
  }),
  on(AuthStoreActions.updateEmailCompleted, (state, action) => {
    return {
      ...state,
      updateEmailProcessing: false,
    }
  }),
  on(AuthStoreActions.updateEmailFailed, (state, action) => {
    return {
      ...state,
      updateEmailProcessing: false,
      updateEmailError: action.error
    }
  }),

  // Verify Email

  on(AuthStoreActions.verifyEmailRequested, (state, action) => {
    return {
      ...state,
      emailVerificationProcessing: true,
      emailVerificationError: undefined
    }
  }),
  on(AuthStoreActions.verifyEmailCompleted, (state, action) => {
    return {
      ...state,
      emailVerificationProcessing: false,
      emailVerified: action.emailVerified,
    }
  }),
  on(AuthStoreActions.verifyEmailFailed, (state, action) => {
    return {
      ...state,
      emailVerificationProcessing: false,
      emailVerificationError: action.error
    }
  }),

);

export const authMetaReducers: MetaReducer<AuthState>[] = !environment.production ? [] : [];
