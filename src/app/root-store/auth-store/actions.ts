import { FirebaseError } from "@angular/fire/app";
import { createAction, props } from "@ngrx/store";
import { AuthFormData, AuthResultsData } from "shared-models/auth/auth-data.model";
import { EmailUpdateData } from "shared-models/auth/email-update-data.model";
import { PasswordConfirmationData } from "shared-models/auth/password-confirmation-data.model";
import { EmailVerificationData } from "shared-models/email/email-verification-data";

// Auth Guard

export const authGuardValidated = createAction(
  '[Auth Guard] Auth Guard Validated'
);

export const authGuardFailed = createAction(
  '[Auth Guard] Auth Guard Failed',
  props<{error: FirebaseError}>()
);

// Confirm Password

export const confirmPasswordRequested = createAction(
  '[Edit Email Component] Confirm Password Requested',
  props<{passwordConfirmationData: PasswordConfirmationData}>()
);

export const confirmPasswordCompleted = createAction(
  '[Auth Service] Confirm Password Complete',
  props<{passwordConfirmed: boolean}>()
);

export const confirmPasswordFailed = createAction(
  '[Auth Service] Confirm Password Failed',
  props<{error: FirebaseError}>()
);

// Delete Auth User

export const deleteAuthUserRequested = createAction(
  '[Signup Form Component] Delete Auth User Requested'
);

export const deleteAuthUserCompleted = createAction(
  '[Auth Service] Delete Auth User Complete',
  props<{userDeleted: boolean}>()
);

export const deleteAuthUserFailed = createAction(
  '[Auth Service] Delete Auth User Failed',
  props<{error: FirebaseError}>()
);

// Detect Cached User

export const detectCachedUserRequested = createAction(
  '[App Component] Detected Cached User Requested'
);

export const detectCachedUserCompleted = createAction(
  '[App Component] Detected Cached User Completed',
  props<{authResultsData: AuthResultsData | undefined}>()
);

export const detectCachedUserFailed = createAction(
  '[App Component] Detected Cached User Failed',
  props<{error: FirebaseError}>()
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
  props<{error: FirebaseError}>()
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
  props<{error: FirebaseError}>()
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
  props<{error: FirebaseError}>()
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
  props<{error: FirebaseError}>()
);

// Logout

export const logout = createAction(
  '[Top Nav] Logout'
);

// Reload Auth Data
export const reloadAuthDataRequested = createAction(
  '[Login Form | Signup Form] Reload AuthData Requested'
);

export const reloadAuthDataCompleted = createAction(
  '[Auth Service] Reload AuthData Completed',
  props<{authDataReloaded: boolean}>()
);

export const reloadAuthDataFailed = createAction(
  '[Auth Service] Reload AuthData Failed',
  props<{error: FirebaseError}>()
);

// Reset Password
export const resetPasswordRequested = createAction(
  '[Login Form | Profile Component] Reset Password Requested',
  props<{email: string}>()
);

export const resetPasswordCompleted = createAction(
  '[Auth Service] Reset Password Completed',
  props<{resetSubmitted: boolean}>()
);

export const resetPasswordFailed = createAction(
  '[Auth Service] Reset Password Failed',
  props<{error: FirebaseError}>()
);

// Update Email
export const updateEmailRequested = createAction(
  '[Edit Email Dialogue] Update Email Requested',
  props<{emailUpdateData: EmailUpdateData}>()
);

export const updateEmailCompleted = createAction(
  '[Auth Service] Update Email Completed',
  props<{emailUpdated: boolean}>()
);

export const updateEmailFailed = createAction(
  '[Auth Service] Update Email Failed',
  props<{error: FirebaseError}>()
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
  props<{error: FirebaseError}>()
);