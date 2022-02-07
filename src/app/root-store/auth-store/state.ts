import { AuthResultsData } from "shared-models/auth/auth-data.model";

export interface AuthState {
  authError: {} | undefined,
  authGuardError: {} | undefined,
  authProcessing: boolean,
  confirmPasswordError: {} | undefined;
  confirmPasswordProcessing: boolean;
  deleteAuthUserError: {} | undefined;
  deleteAuthUserProcessing: boolean;
  emailVerified: boolean,
  emailVerificationError: {} | undefined,
  emailVerificationProcessing: boolean,
  reloadAuthDataError: {} | undefined, 
  reloadAuthDataProcessing: boolean,
  resetPasswordError: {} | undefined,
  resetPasswordProcessing: boolean,
  signupError: {} | undefined, 
  signupProcessing: boolean,
  updateEmailError: {} | undefined,
  updateEmailProcessing: boolean,
  authResultsData: AuthResultsData | undefined,
}

export const initialAuthState: AuthState = {
  authError: undefined,
  authGuardError: undefined,
  authProcessing: false,
  confirmPasswordError: undefined,
  confirmPasswordProcessing: false,
  deleteAuthUserError: undefined,
  deleteAuthUserProcessing: false,
  emailVerified: false,
  emailVerificationError: undefined,
  emailVerificationProcessing: false,
  reloadAuthDataError: undefined, 
  reloadAuthDataProcessing: false,
  resetPasswordError: undefined,
  resetPasswordProcessing: false,
  signupError: undefined,
  signupProcessing: false,
  updateEmailError: undefined,
  updateEmailProcessing: false,
  authResultsData: undefined,
}