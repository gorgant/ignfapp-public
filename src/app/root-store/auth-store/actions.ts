import { createAction, props } from "@ngrx/store";
import { AuthFormData, AuthResultsData } from "shared-models/auth/auth-data.model";

export const emailSignupRequested = createAction(
  '[Signup Form] Email Signup Requested',
  props<{authFormData: AuthFormData}>()
);

export const emailSignupCompleted = createAction(
  '[Auth Service] Email Signup Completed',
  props<{authResultsData: AuthResultsData}>()
);

export const emailSignupFailed = createAction(
  '[Auth Service] Email Signup Failed',
  props<{error: firebase.default.FirebaseError}>()
);

export const emailAuthRequested = createAction(
  '[Login Form] Email Auth Requested',
  props<{authData: AuthFormData}>()
);

export const emailAuthCompleted = createAction(
  '[Auth Service] Email Auth Completed',
  props<{authResultsData: AuthResultsData}>()
);

export const emailAuthFailed = createAction(
  '[Auth Service] Email Auth Failed',
  props<{error: firebase.default.FirebaseError}>()
);

export const logout = createAction(
  '[Top Nav] Logout'
);