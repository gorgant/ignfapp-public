import { AuthResultsData } from "shared-models/auth/auth-data.model";

export interface AuthState {
  authError: {} | undefined,
  authProcessing: boolean,
  emailVerified: boolean,
  emailVerificationError: {} | undefined,
  emailVerificationProcessing: boolean,
  signupError: {} | undefined, 
  signupProcessing: boolean,
  authResultsData: AuthResultsData | undefined,
}

export const initialAuthState: AuthState = {
  authError: undefined,
  authProcessing: false,
  emailVerified: false,
  emailVerificationError: undefined,
  emailVerificationProcessing: false,
  signupError: undefined,
  signupProcessing: false,
  authResultsData: undefined,
}