import { EnvironmentTypes } from "shared-models/environments/env-vars.model";

export interface UiState {
  environmentType: EnvironmentTypes | undefined
  evironmentTypeError: {} | undefined,
  environmentTypeProcessing: boolean,
  showNavBar: boolean
}

export const initialUiState: UiState = {
  environmentType: undefined,
  evironmentTypeError: undefined,
  environmentTypeProcessing: false,
  showNavBar: false
}