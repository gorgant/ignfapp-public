import { FirebaseError } from "firebase/app";
import { EnvironmentTypes } from "shared-models/environments/env-vars.model";

export interface UiState {
  environmentType: EnvironmentTypes | null
  evironmentTypeError: FirebaseError | Error | null,
  environmentTypeProcessing: boolean,
  showNavBar: boolean
}

export const initialUiState: UiState = {
  environmentType: null,
  evironmentTypeError: null,
  environmentTypeProcessing: false,
  showNavBar: false
}