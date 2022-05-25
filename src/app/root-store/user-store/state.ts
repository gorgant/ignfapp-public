import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { PublicUser } from "shared-models/user/public-user.model";

export const userFeatureKey = PublicStoreFeatureKeys.USER;

export interface UserState {
  createUserError: {} | undefined,
  createUserProcessing: boolean,
  fetchUserError: {} | undefined,
  fetchUserProcessing: boolean,
  resizeAvatarError: {} | undefined,
  resizeAvatarProcessing: boolean;
  updateUserError: {} | undefined,
  updateUserProcessing: boolean,
  uploadAvatarError: {} | undefined,
  uploadAvatarProcessing: boolean,
  avatarDownloadUrl: string | undefined;
  userData: PublicUser | undefined,
}

export const initialUserState: UserState = {
  createUserError: undefined,
  createUserProcessing: false,
  fetchUserError: undefined,
  fetchUserProcessing: false,
  resizeAvatarError: undefined,
  resizeAvatarProcessing: false,
  updateUserError: undefined,
  updateUserProcessing: false,
  uploadAvatarError: undefined,
  uploadAvatarProcessing: false,
  avatarDownloadUrl: undefined,
  userData: undefined,
}