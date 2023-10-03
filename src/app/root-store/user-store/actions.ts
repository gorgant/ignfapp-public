import { FirebaseError } from "@angular/fire/app";
import { createAction, props } from "@ngrx/store";
import { AvatarImageData } from "shared-models/images/avatar-image-data.model";
import { AvatarImageMetaData } from "shared-models/images/image-metadata.model";
import { PublicUser } from "shared-models/user/public-user.model";
import { UserUpdateData } from "shared-models/user/user-update.model";

// Create Public User

export const createPublicUserRequested = createAction(
  '[Signup Form] Create Public User Requested',
  props<{partialNewPublicUserData: Partial<PublicUser>}>()
);

export const createPublicUserCompleted = createAction(
  '[User Service] Create Public User Completed',
  props<{newPublicUser: PublicUser}>()
);

export const createPublicUserFailed = createAction(
  '[User Service] Create Public User Failed',
  props<{error: FirebaseError}>()
);

// Delete Public User

export const deletePublicUserRequested = createAction(
  '[Profile Component] Delete Public User Requested',
  props<{publicUserId: string}>()
);

export const deletePublicUserCompleted = createAction(
  '[User Service] Delete Public User Completed',
  props<{publicUserDeleted: boolean}>()
);

export const deletePublicUserFailed = createAction(
  '[User Service] Delete Public User Failed',
  props<{error: FirebaseError}>()
);

// Fetch Public User

export const fetchPublicUserRequested = createAction(
  '[AppWide] Fetch Public User Requested',
  props<{publicUserId: string}>()
);

export const fetchPublicUserCompleted = createAction(
  '[User Service] Fetch Public User Completed',
  props<{publicUser: PublicUser}>()
);

export const fetchPublicUserFailed = createAction(
  '[User Service] Fetch Public User Failed',
  props<{error: FirebaseError}>()
);

// Purge Public User Data

export const purgePublicUserData = createAction(
  '[AppWide] Purge Public User Data'
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

// Send Update Email Confirmation
export const sendUpdateEmailConfirmationRequested = createAction(
  '[Edit Email Dialogue] Send Update Email Confirmation Requested',
  props<{userData: PublicUser}>()
);

export const sendUpdateEmailConfirmationCompleted = createAction(
  '[Auth Service] Send Update Email Confirmation Completed',
  props<{emailUpdated: boolean}>()
);

export const sendUpdateEmailConfirmationFailed = createAction(
  '[Auth Service] Send Update Email Confirmation Failed',
  props<{error: FirebaseError}>()
);

// Update Public User

export const updatePublicUserRequested = createAction(
  '[AppWide] Update Public User Requested',
  props<{userUpdateData: UserUpdateData}>()
);

export const updatePublicUserCompleted = createAction(
  '[User Service] Update Public User Completed',
  props<{updatedPublicUser: PublicUser}>()
);

export const updatePublicUserFailed = createAction(
  '[User Service] Update Public User Failed',
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