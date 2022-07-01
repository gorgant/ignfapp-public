import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { UserState } from "./state";

const getAvatarDownloadUrl = (state: UserState) => state.avatarDownloadUrl;
const getCreateUserError = (state: UserState) => state.createUserError;
const getCreateUserProcessing = (state: UserState) => state.createUserProcessing;
const getFetchUserError = (state: UserState) => state.fetchUserError;
const getFetchUserProcessing = (state: UserState) => state.fetchUserProcessing;
const getRegisterPrelaunchUserProcessing = (state: UserState) => state.updateUserProcessing;
const getResizeAvatarError = (state: UserState) => state.resizeAvatarError;
const getResizeAvatarProcessing = (state: UserState) => state.resizeAvatarProcessing;
const getUpdateUserError = (state: UserState) => state.updateUserError;
const getUpdateUserProcessing = (state: UserState) => state.updateUserProcessing;
const getUploadAvatarError = (state: UserState) => state.uploadAvatarError;
const getUploadAvatarProcessing = (state: UserState) => state.uploadAvatarProcessing;
const getUserData = (state: UserState) => state.userData;

const selectUserState = createFeatureSelector<UserState>(PublicStoreFeatureKeys.USER);

export const selectAvatarDownloadUrl = createSelector(
  selectUserState,
  getAvatarDownloadUrl
);

export const selectCreateUserError = createSelector(
  selectUserState,
  getCreateUserError
);

export const selectCreateUserProcessing = createSelector(
  selectUserState,
  getCreateUserProcessing
);

export const selectFetchUserError = createSelector(
  selectUserState,
  getFetchUserError
);

export const selectFetchUserProcessing = createSelector(
  selectUserState,
  getFetchUserProcessing
);

export const selectRegisterPrelaunchUserProcessing = createSelector(
  selectUserState,
  getRegisterPrelaunchUserProcessing
);

export const selectResizeAvatarError = createSelector(
  selectUserState,
  getResizeAvatarError
);

export const selectResizeAvatarProcessing = createSelector(
  selectUserState,
  getResizeAvatarProcessing
);

export const selectUpdateUserError = createSelector(
  selectUserState,
  getUpdateUserError
);

export const selectUpdateUserProcessing = createSelector(
  selectUserState,
  getUpdateUserProcessing
);

export const selectUploadAvatarError = createSelector(
  selectUserState,
  getUploadAvatarError
);

export const selectUploadAvatarProcessing = createSelector(
  selectUserState,
  getUploadAvatarProcessing
);

export const selectUserData = createSelector(
  selectUserState,
  getUserData
);
