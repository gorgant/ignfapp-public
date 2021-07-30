import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { UiState } from "./state";

const getEnvironmentType = (state: UiState) => state.environmentType;
const getEnvironmentTypeError = (state: UiState) => state.evironmentTypeError;
const getIsFetchingEnvironmentType = (state: UiState) => state.environmentTypeProcessing;

const selectUiState = createFeatureSelector<UiState>(PublicStoreFeatureKeys.UI);

export const selectEnvironmentType = createSelector(
  selectUiState,
  getEnvironmentType
);

export const selectEnvironmentTypeError = createSelector(
  selectUiState,
  getEnvironmentTypeError
);

export const selectIsFetchingEnvironmentType = createSelector(
  selectUiState,
  getIsFetchingEnvironmentType
);



