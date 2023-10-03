import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { AuthState } from "./state";

const getAuthenticateUserError = (state: AuthState) => state.authError;
const getAuthenticateUserProcessing = (state: AuthState) => state.authProcessing;
const getAuthResultsData = (state: AuthState) => state.authResultsData;
const getConfirmPasswordError = (state: AuthState) => state.confirmPasswordError;
const getConfirmPasswordProcessing = (state: AuthState) => state.confirmPasswordProcessing;
const getDeleteAuthUserError = (state: AuthState) => state.deleteAuthUserError;
const getDeleteAuthUserProcessing = (state: AuthState) => state.deleteAuthUserProcessing;
const getVerifyEmailError = (state: AuthState) => state.verifyEmailError;
const getVerifyEmailProcessing = (state: AuthState) => state.verifyEmailProcessing;
const getVerifyEmailSucceeded = (state: AuthState) => state.verifyEmailSucceeded;
const getReloadAuthDataError = (state: AuthState) => state.reloadAuthDataError;
const getReloadAuthDataProcessing = (state: AuthState) => state.reloadAuthDataProcessing;
const getResetPasswordError = (state: AuthState) => state.resetPasswordError;
const getResetPasswordProcessing = (state: AuthState) => state.resetPasswordProcessing;
const getSignUpError = (state: AuthState) => state.signupError;
const getSignupProcessing = (state: AuthState) => state.signupProcessing;
const getUpdateEmailError = (state: AuthState) => state.updateEmailError;
const getUpdateEmailProcessing = (state: AuthState) => state.updateEmailProcessing;
const getUpdateEmailSucceeded = (state: AuthState) => state.updateEmailSucceeded;

const selectAuthState = createFeatureSelector<AuthState>(PublicStoreFeatureKeys.AUTH);



export const selectAuthenticateUserError = createSelector(
  selectAuthState,
  getAuthenticateUserError
);

export const selectAuthenticateUserProcessing = createSelector(
  selectAuthState,
  getAuthenticateUserProcessing
);

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

export const selectSignUpError = createSelector(
  selectAuthState,
  getSignUpError
);

export const selectSignupProcessing = createSelector(
  selectAuthState,
  getSignupProcessing
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