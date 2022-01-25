import { AuthResultsData } from "shared-models/auth/auth-data.model";

export interface AuthState {
  authError: {} | undefined,
  authGuardError: {} | undefined,
  authProcessing: boolean,
  confirmPasswordError: {} | undefined;
  confirmPasswordProcessing: boolean;
  emailVerified: boolean,
  emailVerificationError: {} | undefined,
  emailVerificationProcessing: boolean,
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
  emailVerified: false,
  emailVerificationError: undefined,
  emailVerificationProcessing: false,
  resetPasswordError: undefined,
  resetPasswordProcessing: false,
  signupError: undefined,
  signupProcessing: false,
  updateEmailError: undefined,
  updateEmailProcessing: false,
  authResultsData: undefined,
}