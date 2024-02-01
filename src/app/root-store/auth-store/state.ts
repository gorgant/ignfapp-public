import { FirebaseError } from "firebase/app";
import { AuthResultsData } from "shared-models/auth/auth-data.model";

export interface AuthState {
  authGuardError: FirebaseError | Error | null,
  emailAuthError: FirebaseError | Error | null;
  emailAuthProcessing: boolean;
  emailSignupError: FirebaseError | Error | null;
  emailSignupProcessing: boolean;
  confirmPasswordError: FirebaseError | Error | null;
  confirmPasswordProcessing: boolean;
  deleteAuthUserError: FirebaseError | Error | null;
  deleteAuthUserProcessing: boolean;
  facebookAuthError: FirebaseError | Error | null;
  facebookAuthProcessing: boolean;
  googleAuthError: FirebaseError | Error | null;
  googleAuthProcessing: boolean;
  reloadAuthDataError: FirebaseError | Error | null, 
  reloadAuthDataProcessing: boolean,
  resetPasswordError: FirebaseError | Error | null,
  resetPasswordProcessing: boolean,
  updateEmailError: FirebaseError | Error | null,
  updateEmailProcessing: boolean,
  updateEmailSucceeded: boolean,
  verifyEmailError: FirebaseError | Error | null,
  verifyEmailProcessing: boolean,
  verifyEmailSucceeded: boolean,
  authResultsData: AuthResultsData | null,
}

export const initialAuthState: AuthState = {
  authGuardError: null,
  confirmPasswordError: null,
  confirmPasswordProcessing: false,
  deleteAuthUserError: null,
  deleteAuthUserProcessing: false,
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