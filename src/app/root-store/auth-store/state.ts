import { FirebaseError } from "firebase/app";
import { AuthResultsData } from "shared-models/auth/auth-data.model";

export interface AuthState {
  authError: FirebaseError | Error | null,
  authGuardError: FirebaseError | Error | null,
  authProcessing: boolean,
  confirmPasswordError: FirebaseError | Error | null;
  confirmPasswordProcessing: boolean;
  deleteAuthUserError: FirebaseError | Error | null;
  deleteAuthUserProcessing: boolean;
  verifyEmailSucceeded: boolean,
  verifyEmailError: FirebaseError | Error | null,
  verifyEmailProcessing: boolean,
  reloadAuthDataError: FirebaseError | Error | null, 
  reloadAuthDataProcessing: boolean,
  resetPasswordError: FirebaseError | Error | null,
  resetPasswordProcessing: boolean,
  signupError: FirebaseError | Error | null, 
  signupProcessing: boolean,
  updateEmailError: FirebaseError | Error | null,
  updateEmailProcessing: boolean,
  updateEmailSucceeded: boolean,
  authResultsData: AuthResultsData | null,
}

export const initialAuthState: AuthState = {
  authError: null,
  authGuardError: null,
  authProcessing: false,
  confirmPasswordError: null,
  confirmPasswordProcessing: false,
  deleteAuthUserError: null,
  deleteAuthUserProcessing: false,
  verifyEmailSucceeded: false,
  verifyEmailError: null,
  verifyEmailProcessing: false,
  reloadAuthDataError: null, 
  reloadAuthDataProcessing: false,
  resetPasswordError: null,
  resetPasswordProcessing: false,
  signupError: null,
  signupProcessing: false,
  updateEmailError: null,
  updateEmailProcessing: false,
  updateEmailSucceeded: false,
  authResultsData: null,
}