import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { AuthState } from "./state";

const getAuthResultsData = (state: AuthState) => state.authResultsData;
const getConfirmPasswordError = (state: AuthState) => state.confirmPasswordError;
const getConfirmPasswordProcessing = (state: AuthState) => state.confirmPasswordProcessing;
const getDeleteAuthUserError = (state: AuthState) => state.deleteAuthUserError;
const getDeleteAuthUserProcessing = (state: AuthState) => state.deleteAuthUserProcessing;
const getEmailAuthError = (state: AuthState) => state.emailAuthError;
const getEmailAuthProcessing = (state: AuthState) => state.emailAuthProcessing;
const getEmailSignupError = (state: AuthState) => state.emailSignupError;
const getEmailSignupProcessing = (state: AuthState) => state.emailSignupProcessing;
const getFacebookAuthError = (state: AuthState) => state.facebookAuthError;
const getFacebookAuthProcessing = (state: AuthState) => state.facebookAuthProcessing;
const getGoogleAuthError = (state: AuthState) => state.googleAuthError;
const getGoogleAuthProcessing = (state: AuthState) => state.googleAuthProcessing;
const getVerifyEmailError = (state: AuthState) => state.verifyEmailError;
const getVerifyEmailProcessing = (state: AuthState) => state.verifyEmailProcessing;
const getVerifyEmailSucceeded = (state: AuthState) => state.verifyEmailSucceeded;
const getReloadAuthDataError = (state: AuthState) => state.reloadAuthDataError;
const getReloadAuthDataProcessing = (state: AuthState) => state.reloadAuthDataProcessing;
const getResetPasswordError = (state: AuthState) => state.resetPasswordError;
const getResetPasswordProcessing = (state: AuthState) => state.resetPasswordProcessing;
const getUpdateEmailError = (state: AuthState) => state.updateEmailError;
const getUpdateEmailProcessing = (state: AuthState) => state.updateEmailProcessing;
const getUpdateEmailSucceeded = (state: AuthState) => state.updateEmailSucceeded;

const selectAuthState = createFeatureSelector<AuthState>(PublicStoreFeatureKeys.AUTH);



export const selectAuthResultsData = createSelector(
  selectAuthState,
  getAuthResultsData
);

export const selectConfirmPasswordError = createSelector(
  selectAuthState,
  getConfirmPasswordError
);

export const selectConfirmPasswordProcessing = createSelector(
  selectAuthState,
  getConfirmPasswordProcessing
);

export const selectDeleteAuthUserError = createSelector(
  selectAuthState,
  getDeleteAuthUserError
);

export const selectDeleteAuthUserProcessing = createSelector(
  selectAuthState,
  getDeleteAuthUserProcessing
);

export const selectEmailAuthError = createSelector(
  selectAuthState,
  getEmailAuthError
);

export const selectEmailAuthProcessing = createSelector(
  selectAuthState,
  getEmailAuthProcessing
);

export const selectEmailSignupError = createSelector(
  selectAuthState,
  getEmailSignupError
);

export const selectEmailSignupProcessing = createSelector(
  selectAuthState,
  getEmailSignupProcessing
);

export const selectFacebookAuthError = createSelector(
  selectAuthState,
  getFacebookAuthError
);

export const selectFacebookAuthProcessing = createSelector(
  selectAuthState,
  getFacebookAuthProcessing
);

export const selectGoogleAuthError = createSelector(
  selectAuthState,
  getGoogleAuthError
);

export const selectGoogleAuthProcessing = createSelector(
  selectAuthState,
  getGoogleAuthProcessing
);

export const selectVerifyEmailError = createSelector(
  selectAuthState,
  getVerifyEmailError
);

export const selectVerifyEmailProcessing = createSelector(
  selectAuthState,
  getVerifyEmailProcessing
);

export const selectVerifyEmailSucceeded = createSelector(
  selectAuthState,
  getVerifyEmailSucceeded
);

export const selectIsLoggedIn = createSelector(
  selectAuthState,
  auth => !!auth.authResultsData
);

export const selectReloadAuthDataError = createSelector(
  selectAuthState,
  getReloadAuthDataError
);

export const selectReloadAuthDataProcessing = createSelector(
  selectAuthState,
  getReloadAuthDataProcessing
);

export const selectResetPasswordError = createSelector(
  selectAuthState,
  getResetPasswordError
);

export const selectResetPasswordProcessing = createSelector(
  selectAuthState,
  getResetPasswordProcessing
);

export const selectUpdateEmailError = createSelector(
  selectAuthState,
  getUpdateEmailError
);

export const selectUpdateEmailProcessing = createSelector(
  selectAuthState,
  getUpdateEmailProcessing
);

export const selectUpdateEmailSucceeded = createSelector(
  selectAuthState,
  getUpdateEmailSucceeded
);