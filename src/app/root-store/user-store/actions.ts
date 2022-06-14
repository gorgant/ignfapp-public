import { FirebaseError } from "@angular/fire/app";
import { createAction, props } from "@ngrx/store";
import { EmailUserData } from "shared-models/email/email-user-data.model";
import { AvatarImageData } from "shared-models/images/avatar-image-data.model";
import { AvatarImageMetaData } from "shared-models/images/image-metadata.model";
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
  props<{error: FirebaseError}>()
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
  props<{error: FirebaseError}>()
);

// Purge User Data

export const purgeUserData = createAction(
  '[AppWide] Purge User Data'
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
  props<{error: FirebaseError}>()
);

// Resize Avatar

export const resizeAvatarRequested = createAction(
  '[Edit Avatar Dialogue] Resize Avatar Requested',
  props<{imageMetaData: AvatarImageMetaData}>()
);

export const resizeAvatarCompleted = createAction(
  '[Image Service] Resize Avatar Completed'
);

export const resizeAvatarFailed = createAction(
  '[Image Service] Resize Avatar Failed',
  props<{error: FirebaseError}>()
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
  props<{error: FirebaseError}>()
);

// Upload Avatar

export const uploadAvatarRequested = createAction(
  '[Edit Avatar Dialogue] Upload Avatar Requested',
  props<{avatarData: AvatarImageData}>()
);

export const uploadAvatarCompleted = createAction(
  '[Image Service] Upload Avatar Completed',
  props<{avatarDownloadUrl: string}>()
);

export const uploadAvatarFailed = createAction(
  '[Image Service] Upload Avatar Failed',
  props<{error: FirebaseError}>()
);