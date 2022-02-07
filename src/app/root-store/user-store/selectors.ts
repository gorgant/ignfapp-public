import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { UserState } from "./state";

const getIsCreatingUser = (state: UserState) => state.createUserProcessing;
const getIsFetchingUser = (state: UserState) => state.fetchUserProcessing;
const getIsRegisteringPrelaunchUser = (state: UserState) => state.updateUserProcessing;
const getIsUpdatingUser = (state: UserState) => state.updateUserProcessing;
const getUserData = (state: UserState) => state.userData;
const getCreateUserError = (state: UserState) => state.createUserError;
const getFetchUserError = (state: UserState) => state.fetchUserError;
const getUpdateUserError = (state: UserState) => state.updateUserError;

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

export const selectIsUpdatingUser = createSelector(
  selectUserState,
  getIsUpdatingUser
);

export const selectUserData = createSelector(
  selectUserState,
  getUserData
);

export const selectCreateUserError = createSelector(
  selectUserState,
  getCreateUserError
);

export const selectFetchUserError = createSelector(
  selectUserState,
  getFetchUserError
);

export const selectUpdateUserError = createSelector(
  selectUserState,
  getUpdateUserError
);

