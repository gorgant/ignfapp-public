import { AuthResultsData } from "shared-models/auth/auth-data.model";

export interface AuthState {
  authError: {} | undefined,
  authGuardError: {} | undefined,
  authProcessing: boolean,
  emailVerified: boolean,
  emailVerificationError: {} | undefined,
  emailVerificationProcessing: boolean,
  resetPasswordError: {} | undefined,
  resetPasswordProcessing: boolean,
  resetPasswordSubmitted: boolean;
  signupError: {} | undefined, 
  signupProcessing: boolean,
  authResultsData: AuthResultsData | undefined,
}

export const initialAuthState: AuthState = {
  authError: undefined,
  authGuardError: undefined,
  authProcessing: false,
  emailVerified: false,
  emailVerificationError: undefined,
  emailVerificationProcessing: false,
  resetPasswordError: undefined,
  resetPasswordProcessing: false,
  resetPasswordSubmitted: false,
  signupError: undefined,
  signupProcessing: false,
  authResultsData: undefined,
}