import { createAction, props } from "@ngrx/store";
import { PublicUser } from "shared-models/user/public-user.model";
import { UserUpdateData } from "shared-models/user/user-update.model";


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
