import { createAction, props } from "@ngrx/store";
import { AuthFormData, AuthResultsData } from "shared-models/auth/auth-data.model";
import { EmailVerificationData } from "shared-models/email/email-verification-data";

// Auth Guard

export const authGuardValidated = createAction(
  '[Auth Guard] Auth Guard Validated'
);


export const authGuardFailed = createAction(
  '[Auth Guard] Auth Guard Failed',
  props<{error: firebase.default.FirebaseError}>()
);

// Email Auth

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

// Email Signup

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

// Facebook Auth

export const facebookAuthRequested = createAction(
  '[Login Form] Facebook Auth Requested',
);

export const facebookAuthCompleted = createAction(
  '[Auth Service] Facebook Auth Completed',
  props<{authResultsData: AuthResultsData}>()
);

export const facebookAuthFailed = createAction(
  '[Auth Service] Facebook Auth Failed',
  props<{error: firebase.default.FirebaseError}>()
);

// Google Auth

export const googleAuthRequested = createAction(
  '[Login Form] Google Auth Requested',
);

export const googleAuthCompleted = createAction(
  '[Auth Service] Google Auth Completed',
  props<{authResultsData: AuthResultsData}>()
);

export const googleAuthFailed = createAction(
  '[Auth Service] Google Auth Failed',
  props<{error: firebase.default.FirebaseError}>()
);

// Logout

export const logout = createAction(
  '[Top Nav] Logout'
);

// Verify Email
export const verifyEmailRequested = createAction(
  '[Email Verification Page] Verify Email Requested',
  props<{emailVerificationData: EmailVerificationData}>()
);

export const verifyEmailCompleted = createAction(
  '[User Service] Verify Email Completed',
  props<{emailVerified: boolean}>()
);

export const verifyEmailFailed = createAction(
  '[User Service] Verify Email Failed',
  props<{error: firebase.default.FirebaseError}>()
);

// Reset Password
export const resetPasswordRequested = createAction(
  '[Login Form] Reset Password Requested',
  props<{email: string}>()
);

export const resetPasswordCompleted = createAction(
  '[Auth Service] Reset Password Completed',
  props<{resetSubmitted: boolean}>()
);

export const resetPasswordFailed = createAction(
  '[Auth Service] Reset Password Failed',
  props<{error: firebase.default.FirebaseError}>()
);