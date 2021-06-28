import { AuthStoreState } from './auth-store/index';
import { UserStoreState } from './user-store';
import { PublicStoreFeatureKeys } from 'shared-models/store/feature-keys.model';
import { ActionReducerMap } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { authStoreReducer } from './auth-store/reducers';
import { userStoreReducer } from './user-store/reducers';

export interface AppState {
  [PublicStoreFeatureKeys.AUTH]: AuthStoreState.AuthState;
  [PublicStoreFeatureKeys.USER]: UserStoreState.UserState;
  router: RouterReducerState<any>;
}

export const reducers: ActionReducerMap<AppState> = {
  [PublicStoreFeatureKeys.AUTH]: authStoreReducer,
  [PublicStoreFeatureKeys.USER]: userStoreReducer,
  router: routerReducer
};
