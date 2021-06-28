import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { PublicUser } from "shared-models/user/public-user.model";

export const userFeatureKey = PublicStoreFeatureKeys.USER;

export interface UserState {
  userFetchError: {} | undefined,
  userFetchProcessing: boolean,
  userUpdateError: {} | undefined,
  userUpdateProcessing: boolean,
  userData: PublicUser | undefined,
}

export const initialUserState: UserState = {
  userFetchError: undefined,
  userFetchProcessing: false,
  userUpdateError: undefined,
  userUpdateProcessing: false,
  userData: undefined,
}