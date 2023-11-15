import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { UserState } from "./state";

const getAvatarDownloadUrl = (state: UserState) => state.avatarDownloadUrl;
const getCreatePublicUserError = (state: UserState) => state.createPublicUserError;
const getCreatePublicUserProcessing = (state: UserState) => state.createPublicUserProcessing;
const getDeletePublicUserError = (state: UserState) => state.deletePublicUserError;
const getDeletePublicUserProcessing = (state: UserState) => state.deletePublicUserProcessing;
const getFetchPublicUserError = (state: UserState) => state.fetchPublicUserError;
const getFetchPublicUserProcessing = (state: UserState) => state.fetchPublicUserProcessing;
const getResizeAvatarError = (state: UserState) => state.resizeAvatarError;
const getResizeAvatarProcessing = (state: UserState) => state.resizeAvatarProcessing;
const getResizeAvatarSucceeded = (state: UserState) => state.resizeAvatarSucceeded;
const getUpdatePublicUserError = (state: UserState) => state.updatePublicUserError;
const getUpdatePublicUserProcessing = (state: UserState) => state.updatePublicUserProcessing;
const getUploadAvatarError = (state: UserState) => state.uploadAvatarError;
const getUploadAvatarProcessing = (state: UserState) => state.uploadAvatarProcessing;
const getSendUpdateEmailConfirmationError = (state: UserState) => state.sendUpdateEmailConfirmationError;
const getSendUpdateEmailConfirmationProcessing = (state: UserState) => state.sendUpdateEmailConfirmationProcessing;
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

export const selectFetchPublicUserError = createSelector(
  selectUserState,
  getFetchPublicUserError
);

export const selectFetchPublicUserProcessing = createSelector(
  selectUserState,
  getFetchPublicUserProcessing
);

export const selectResizeAvatarError = createSelector(
  selectUserState,
  getResizeAvatarError
);

export const selectResizeAvatarProcessing = createSelector(
  selectUserState,
  getResizeAvatarProcessing
);

export const selectResizeAvatarSucceeded = createSelector(
  selectUserState,
  getResizeAvatarSucceeded
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

export const selectSendUpdateEmailConfirmationError = createSelector(
  selectUserState,
  getSendUpdateEmailConfirmationError
);

export const selectSendUpdateEmailConfirmationProcessing = createSelector(
  selectUserState,
  getSendUpdateEmailConfirmationProcessing
);

export const selectPublicUserData = createSelector(
  selectUserState,
  getPublicUserData
);
