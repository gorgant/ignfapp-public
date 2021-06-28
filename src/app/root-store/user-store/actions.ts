import { createAction, props } from "@ngrx/store";
import { EmailUserData } from "shared-models/email/email-user-data.model";
import { PrelaunchUser } from "shared-models/user/prelaunch-user.model";
import { PublicUser } from "shared-models/user/public-user.model";
import { UserUpdateData } from "shared-models/user/user-update.model";

// Create User

export const createUserRequested = createAction(
  '[Signup Form] Create User Requested',
  props<{partialNewUserData: Partial<PublicUser>}>()
);

export const createUserCompleted = createAction(
  '[User Service] Create User Completed',
  props<{newUser: PublicUser}>()
);

export const createUserFailed = createAction(
  '[User Service] Create User Failed',
  props<{error: firebase.default.FirebaseError}>()
);

// Fetch User

export const fetchUserRequested = createAction(
  '[AppWide] Fetch User Requested',
  props<{userId: string}>()
);

export const fetchUserCompleted = createAction(
  '[User Service] Fetch User Completed',
  props<{publicUser: PublicUser}>()
);

export const fetchUserFailed = createAction(
  '[User Service] Fetch User Failed',
  props<{error: firebase.default.FirebaseError}>()
);

// Register Prelaunch User

export const registerPrelaunchUserRequested = createAction(
  '[Prelaunch Form] Register Prelaunch User Requested',
  props<{emailUserData: EmailUserData}>()
);

export const registerPrelaunchUserCompleted = createAction(
  '[User Service] Register Prelaunch User Completed',
  props<{prelaunchUser: PrelaunchUser}>()
);

export const registerPrelaunchUserFailed = createAction(
  '[User Service] Register Prelaunch User Failed',
  props<{error: firebase.default.FirebaseError}>()
);

// Update User

export const updateUserRequested = createAction(
  '[AppWide] Update User Requested',
  props<{userUpdateData: UserUpdateData}>()
);

export const updateUserCompleted = createAction(
  '[User Service] Update User Completed',
  props<{updatedUser: PublicUser}>()
);

export const updateUserFailed = createAction(
  '[User Service] Update User Failed',
  props<{error: firebase.default.FirebaseError}>()
);
