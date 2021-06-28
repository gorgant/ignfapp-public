import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { AuthState } from "./state";

const getIsAuthenticatingUser = (state: AuthState) => state.authProcessesing;
const getIsSigningUpUser = (state: AuthState) => state.signupProcessing;
const getAuthResultsData = (state: AuthState) => state.authResultsData;
const getAuthError = (state: AuthState) => state.authError;

export const selectAuthState = createFeatureSelector<AuthState>(PublicStoreFeatureKeys.AUTH);

export const selectIsLoggedIn = createSelector(
  selectAuthState,
  auth => !!auth.authResultsData
);

export const selectIsAuthenticatingUser = createSelector(
  selectAuthState,
  getIsAuthenticatingUser
);

export const selectIsSigningUpUser = createSelector(
  selectAuthState,
  getIsSigningUpUser
);

export const selectAuthResultsData = createSelector(
  selectAuthState,
  getAuthResultsData
);

export const selectAuthError = createSelector(
  selectAuthState,
  getAuthError
);

