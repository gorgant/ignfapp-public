import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { UserState } from "./state";

const getAvatarDownloadUrl = (state: UserState) => state.avatarDownloadUrl;
const getCreatePublicUserError = (state: UserState) => state.createPublicUserError;
const getCreatePublicUserProcessing = (state: UserState) => state.createPublicUserProcessing;
const getDeletePublicUserError = (state: UserState) => state.createPublicUserError;
const getDeletePublicUserProcessing = (state: UserState) => state.createPublicUserProcessing;
const getFetchPrelaunchUserError = (state: UserState) => state.fetchPrelaunchUserError;
const getFetchPrelaunchUserProcessing = (state: UserState) => state.fetchPrelaunchUserProcessing;
const getFetchPublicUserError = (state: UserState) => state.fetchPublicUserError;
const getFetchPublicUserProcessing = (state: UserState) => state.fetchPublicUserProcessing;
const getRegisterPrelaunchUserError = (state: UserState) => state.registerPrelaunchUserError;
const getRegisterPrelaunchUserProcessing = (state: UserState) => state.updatePublicUserProcessing;
const getResizeAvatarError = (state: UserState) => state.resizeAvatarError;
const getResizeAvatarProcessing = (state: UserState) => state.resizeAvatarProcessing;
const getUpdatePrelaunchUserError = (state: UserState) => state.updatePrelaunchUserError;
const getUpdatePrelaunchUserProcessing = (state: UserState) => state.updatePrelaunchUserProcessing;
const getUpdatePublicUserError = (state: UserState) => state.updatePublicUserError;
const getUpdatePublicUserProcessing = (state: UserState) => state.updatePublicUserProcessing;
const getUploadAvatarError = (state: UserState) => state.uploadAvatarError;
const getUploadAvatarProcessing = (state: UserState) => state.uploadAvatarProcessing;
const getPrelaunchUserData = (state: UserState) => state.prelaunchUserData;
const getPublicUserData = (state: UserState) => state.publicUserData;

const selectUserState = createFeatureSelector<UserState>(PublicStoreFeatureKeys.USER);

export const selectAvatarDownloadUrl = createSelector(
  selectUserState,
  getAvatarDownloadUrl
);

export const selectCreatePublicUserError = createSelector(
  selectUserState,
  getCreatePublicUserError
);

export const selectCreatePublicUserProcessing = createSelector(
  selectUserState,
  getCreatePublicUserProcessing
);

export const selectDeletePublicUserError = createSelector(
  selectUserState,
  getDeletePublicUserError
);

export const selectDeletePublicUserProcessing = createSelector(
  selectUserState,
  getDeletePublicUserProcessing
);

export const selectFetchPrelaunchUserError = createSelector(
  selectUserState,
  getFetchPrelaunchUserError
);

export const selectFetchPrelaunchUserProcessing = createSelector(
  selectUserState,
  getFetchPrelaunchUserProcessing
);

export const selectFetchPublicUserError = createSelector(
  selectUserState,
  getFetchPublicUserError
);

export const selectFetchPublicUserProcessing = createSelector(
  selectUserState,
  getFetchPublicUserProcessing
);

export const selectRegisterPrelaunchUserError = createSelector(
  selectUserState,
  getRegisterPrelaunchUserError
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

export const selectUpdatePrelaunchUserError = createSelector(
  selectUserState,
  getUpdatePrelaunchUserError
);

export const selectUpdatePrelaunchUserProcessing = createSelector(
  selectUserState,
  getUpdatePrelaunchUserProcessing
);

export const selectUpdatePublicUserError = createSelector(
  selectUserState,
  getUpdatePublicUserError
);

export const selectUpdatePublicUserProcessing = createSelector(
  selectUserState,
  getUpdatePublicUserProcessing
);

export const selectUploadAvatarError = createSelector(
  selectUserState,
  getUploadAvatarError
);

export const selectUploadAvatarProcessing = createSelector(
  selectUserState,
  getUploadAvatarProcessing
);

export const selectPrelaunchUserData = createSelector(
  selectUserState,
  getPrelaunchUserData
);

export const selectPublicUserData = createSelector(
  selectUserState,
  getPublicUserData
);
