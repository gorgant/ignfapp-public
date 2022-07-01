import { FirebaseError } from "firebase/app";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { PublicUser } from "shared-models/user/public-user.model";

export const userFeatureKey = PublicStoreFeatureKeys.USER;

export interface UserState {
  createUserError: FirebaseError | Error | null,
  createUserProcessing: boolean,
  fetchUserError: FirebaseError | Error | null,
  fetchUserProcessing: boolean,
  resizeAvatarError: FirebaseError | Error | null,
  resizeAvatarProcessing: boolean;
  updateUserError: FirebaseError | Error | null,
  updateUserProcessing: boolean,
  uploadAvatarError: FirebaseError | Error | null,
  uploadAvatarProcessing: boolean,
  avatarDownloadUrl: string | null;
  userData: PublicUser | null,
}

export const initialUserState: UserState = {
  createUserError: null,
  createUserProcessing: false,
  fetchUserError: null,
  fetchUserProcessing: false,
  resizeAvatarError: null,
  resizeAvatarProcessing: false,
  updateUserError: null,
  updateUserProcessing: false,
  uploadAvatarError: null,
  uploadAvatarProcessing: false,
  avatarDownloadUrl: null,
  userData: null,
}