import { FirebaseError } from "firebase/app";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { PublicUser } from "shared-models/user/public-user.model";

export const userFeatureKey = PublicStoreFeatureKeys.USER;

export interface UserState {
  createPublicUserError: FirebaseError | Error | null,
  createPublicUserProcessing: boolean,
  deletePublicUserError: FirebaseError | Error | null,
  deletePublicUserProcessing: boolean,
  fetchPublicUserError: FirebaseError | Error | null,
  fetchPublicUserProcessing: boolean,
  resizeAvatarError: FirebaseError | Error | null,
  resizeAvatarProcessing: boolean;
  resizeAvatarSucceeded: boolean;
  updatePublicUserError: FirebaseError | Error | null,
  updatePublicUserProcessing: boolean,
  uploadAvatarError: FirebaseError | Error | null,
  uploadAvatarProcessing: boolean,
  sendUpdateEmailConfirmationError: FirebaseError | Error | null,
  sendUpdateEmailConfirmationProcessing: boolean,
  avatarDownloadUrl: string | null;
  publicUserData: PublicUser | null,
}

export const initialUserState: UserState = {
  createPublicUserError: null,
  createPublicUserProcessing: false,
  deletePublicUserError: null,
  deletePublicUserProcessing: false,
  fetchPublicUserError: null,
  fetchPublicUserProcessing: false,
  resizeAvatarError: null,
  resizeAvatarProcessing: false,
  resizeAvatarSucceeded: false,
  updatePublicUserError: null,
  updatePublicUserProcessing: false,
  uploadAvatarError: null,
  uploadAvatarProcessing: false,
  sendUpdateEmailConfirmationError: null,
  sendUpdateEmailConfirmationProcessing: false,
  avatarDownloadUrl: null,
  publicUserData: null,
}