import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { AuthState } from "./state";

const getIsAuthenticatingUser = (state: AuthState) => state.authProcessing;
const getEmailVerified = (state: AuthState) => state.emailVerified;
const getIsSigningUpUser = (state: AuthState) => state.signupProcessing;
const getIsVerifyingEmail = (state: AuthState) => state.emailVerificationProcessing;
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

export const selectEmailVerified = createSelector(
  selectAuthState,
  getEmailVerified
);

export const selectIsVerifyingEmail = createSelector(
  selectAuthState,
  getIsVerifyingEmail
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

