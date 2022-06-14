import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { PublicUser } from "shared-models/user/public-user.model";

export const userFeatureKey = PublicStoreFeatureKeys.USER;

export interface UserState {
  createUserError: {} | null,
  createUserProcessing: boolean,
  fetchUserError: {} | null,
  fetchUserProcessing: boolean,
  resizeAvatarError: {} | null,
  resizeAvatarProcessing: boolean;
  updateUserError: {} | null,
  updateUserProcessing: boolean,
  uploadAvatarError: {} | null,
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