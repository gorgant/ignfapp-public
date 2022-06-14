import { AuthResultsData } from "shared-models/auth/auth-data.model";

export interface AuthState {
  authError: {} | null,
  authGuardError: {} | null,
  authProcessing: boolean,
  confirmPasswordError: {} | null;
  confirmPasswordProcessing: boolean;
  deleteAuthUserError: {} | null;
  deleteAuthUserProcessing: boolean;
  emailVerified: boolean,
  emailVerificationError: {} | null,
  emailVerificationProcessing: boolean,
  reloadAuthDataError: {} | null, 
  reloadAuthDataProcessing: boolean,
  resetPasswordError: {} | null,
  resetPasswordProcessing: boolean,
  signupError: {} | null, 
  signupProcessing: boolean,
  updateEmailError: {} | null,
  updateEmailProcessing: boolean,
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
  emailVerified: false,
  emailVerificationError: null,
  emailVerificationProcessing: false,
  reloadAuthDataError: null, 
  reloadAuthDataProcessing: false,
  resetPasswordError: null,
  resetPasswordProcessing: false,
  signupError: null,
  signupProcessing: false,
  updateEmailError: null,
  updateEmailProcessing: false,
  authResultsData: null,
}