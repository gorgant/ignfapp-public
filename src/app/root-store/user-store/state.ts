import { FirebaseError } from "firebase/app";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { PrelaunchUser } from "shared-models/user/prelaunch-user.model";
import { PublicUser } from "shared-models/user/public-user.model";

export const userFeatureKey = PublicStoreFeatureKeys.USER;

export interface UserState {
  createPublicUserError: FirebaseError | Error | null,
  createPublicUserProcessing: boolean,
  fetchPrelaunchUserError: FirebaseError | Error | null,
  fetchPrelaunchUserProcessing: boolean,
  fetchPublicUserError: FirebaseError | Error | null,
  fetchPublicUserProcessing: boolean,
  registerPrelaunchUserError: FirebaseError | Error | null,
  registerPrelaunchUserProcessing: boolean,
  resizeAvatarError: FirebaseError | Error | null,
  resizeAvatarProcessing: boolean;
  updatePrelaunchUserError: FirebaseError | Error | null,
  updatePrelaunchUserProcessing: boolean,
  updatePublicUserError: FirebaseError | Error | null,
  updatePublicUserProcessing: boolean,
  uploadAvatarError: FirebaseError | Error | null,
  uploadAvatarProcessing: boolean,
  avatarDownloadUrl: string | null;
  prelaunchUserData: PrelaunchUser | null,
  publicUserData: PublicUser | null,
}

export const initialUserState: UserState = {
  createPublicUserError: null,
  createPublicUserProcessing: false,
  fetchPrelaunchUserError: null,
  fetchPrelaunchUserProcessing: false,
  fetchPublicUserError: null,
  fetchPublicUserProcessing: false,
  registerPrelaunchUserError: null,
  registerPrelaunchUserProcessing: false,
  resizeAvatarError: null,
  resizeAvatarProcessing: false,
  updatePrelaunchUserError: null,
  updatePrelaunchUserProcessing: false,
  updatePublicUserError: null,
  updatePublicUserProcessing: false,
  uploadAvatarError: null,
  uploadAvatarProcessing: false,
  avatarDownloadUrl: null,
  prelaunchUserData: null,
  publicUserData: null,
}