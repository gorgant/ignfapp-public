import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { PublicUser } from "shared-models/user/public-user.model";

export const userFeatureKey = PublicStoreFeatureKeys.USER;

export interface UserState {
  createUserError: {} | undefined,
  createUserProcessing: boolean,
  fetchUserError: {} | undefined,
  fetchUserProcessing: boolean,
  updateUserError: {} | undefined,
  updateUserProcessing: boolean,
  userData: PublicUser | undefined,
}

export const initialUserState: UserState = {
  createUserError: undefined,
  createUserProcessing: false,
  fetchUserError: undefined,
  fetchUserProcessing: false,
  updateUserError: undefined,
  updateUserProcessing: false,
  userData: undefined,
}