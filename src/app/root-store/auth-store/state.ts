import { AuthResultsData } from "shared-models/auth/auth-data.model";

export interface AuthState {
  authError: {} | undefined,
  authProcessesing: boolean,
  signupError: {} | undefined, 
  signupProcessing: boolean,
  authResultsData: AuthResultsData | undefined,
}

export const initialAuthState: AuthState = {
  authError: undefined,
  authProcessesing: false,
  signupError: undefined,
  signupProcessing: false,
  authResultsData: undefined,
}