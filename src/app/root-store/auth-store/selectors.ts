import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { AuthState } from "./state";

const getAuthError = (state: AuthState) => state.authError;
const getAuthResultsData = (state: AuthState) => state.authResultsData;
const getEmailVerified = (state: AuthState) => state.emailVerified;
const getEmailVerificationError = (state: AuthState) => state.emailVerificationError;
const getIsAuthenticatingUser = (state: AuthState) => state.authProcessing;
const getIsResettingPassword = (state: AuthState) => state.resetPasswordProcessing;
const getIsSigningUpUser = (state: AuthState) => state.signupProcessing;
const getIsVerifyingEmail = (state: AuthState) => state.emailVerificationProcessing;
const getResetPasswordError = (state: AuthState) => state.resetPasswordError;
const getResetPasswordSubmitted = (state: AuthState) => state.resetPasswordSubmitted;
const getSignUpError = (state: AuthState) => state.signupError;

export const selectAuthState = createFeatureSelector<AuthState>(PublicStoreFeatureKeys.AUTH);


export const selectAuthError = createSelector(
  selectAuthState,
  getAuthError
);

export const selectAuthResultsData = createSelector(
  selectAuthState,
  getAuthResultsData
);

export const selectEmailVerificationError = createSelector(
  selectAuthState,
  getEmailVerificationError
);

export const selectEmailVerified = createSelector(
  selectAuthState,
  getEmailVerified
);

export const selectIsAuthenticatingUser = createSelector(
  selectAuthState,
  getIsAuthenticatingUser
);

export const selectIsLoggedIn = createSelector(
  selectAuthState,
  auth => !!auth.authResultsData
);

export const selectIsVerifyingEmail = createSelector(
  selectAuthState,
  getIsVerifyingEmail
);

export const selectIsResettingPassword = createSelector(
  selectAuthState,
  getIsResettingPassword
);

export const selectIsSigningUpUser = createSelector(
  selectAuthState,
  getIsSigningUpUser
);

export const selectResetPasswordError = createSelector(
  selectAuthState,
  getResetPasswordError
);


export const selectResetPasswordSubmitted = createSelector(
  selectAuthState,
  getResetPasswordSubmitted
);

export const selectSignUpError = createSelector(
  selectAuthState,
  getSignUpError
);


