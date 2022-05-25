import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { UserState } from "./state";

const getIsCreatingUser = (state: UserState) => state.createUserProcessing;
const getIsFetchingUser = (state: UserState) => state.fetchUserProcessing;
const getIsRegisteringPrelaunchUser = (state: UserState) => state.updateUserProcessing;
const getIsResizingAvatar = (state: UserState) => state.resizeAvatarProcessing;
const getIsUpdatingUser = (state: UserState) => state.updateUserProcessing;
const getIsUploadingAvatar = (state: UserState) => state.uploadAvatarProcessing;
const getAvatarDownloadUrl = (state: UserState) => state.avatarDownloadUrl;
const getUserData = (state: UserState) => state.userData;
const getCreateUserError = (state: UserState) => state.createUserError;
const getFetchUserError = (state: UserState) => state.fetchUserError;
const getResizeAvatarError = (state: UserState) => state.resizeAvatarError;
const getUpdateUserError = (state: UserState) => state.updateUserError;
const getUploadAvatarError = (state: UserState) => state.uploadAvatarError;

const selectUserState = createFeatureSelector<UserState>(PublicStoreFeatureKeys.USER);

export const selectIsCreatingUser = createSelector(
  selectUserState,
  getIsCreatingUser
);

export const selectIsFetchingUser = createSelector(
  selectUserState,
  getIsFetchingUser
);

export const selectIsRegisteringPrelaunchUser = createSelector(
  selectUserState,
  getIsRegisteringPrelaunchUser
);

export const selectIsResizingAvatar = createSelector(
  selectUserState,
  getIsResizingAvatar
);

export const selectIsUpdatingUser = createSelector(
  selectUserState,
  getIsUpdatingUser
);

export const selectIsUploadingAvatar = createSelector(
  selectUserState,
  getIsUploadingAvatar
);

export const selectCreateUserError = createSelector(
  selectUserState,
  getCreateUserError
);

export const selectFetchUserError = createSelector(
  selectUserState,
  getFetchUserError
);

export const selectResizeAvatarError = createSelector(
  selectUserState,
  getResizeAvatarError
);

export const selectUpdateUserError = createSelector(
  selectUserState,
  getUpdateUserError
);

export const selectUploadAvatarError = createSelector(
  selectUserState,
  getUploadAvatarError
);

export const selectAvatarDownloadUrl = createSelector(
  selectUserState,
  getAvatarDownloadUrl
);

export const selectUserData = createSelector(
  selectUserState,
  getUserData
);


