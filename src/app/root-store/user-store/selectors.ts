import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { UserState } from "./state";

const getIsCreatingUser = (state: UserState) => state.userUpdateProcessing;
const getIsFetchingUser = (state: UserState) => state.userFetchProcessing;
const getIsUpdatingUser = (state: UserState) => state.userUpdateProcessing;
const getUserData = (state: UserState) => state.userData;
const getUserFetchError = (state: UserState) => state.userFetchError;
const getUserUpdateError = (state: UserState) => state.userUpdateError;

export const selectUserState = createFeatureSelector<UserState>(PublicStoreFeatureKeys.USER);

export const selectIsCreatingUser = createSelector(
  selectUserState,
  getIsCreatingUser
);

export const selectIsFetchingUser = createSelector(
  selectUserState,
  getIsFetchingUser
);

export const selectIsUpdatingUser = createSelector(
  selectUserState,
  getIsUpdatingUser
);

export const selectUserData = createSelector(
  selectUserState,
  getUserData
);

export const selectUserFetchError = createSelector(
  selectUserState,
  getUserFetchError
);

export const selectUserUpdateError = createSelector(
  selectUserState,
  getUserUpdateError
);

