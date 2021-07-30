import { PublicStoreFeatureKeys } from 'shared-models/store/feature-keys.model';
import { ActionReducerMap } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { AuthStoreState } from './auth-store';
import { authStoreReducer } from './auth-store/reducers';
import { UserStoreState } from './user-store';
import { userStoreReducer } from './user-store/reducers';
import { UiStoreState } from './ui-store';
import { uiStoreReducer } from './ui-store/reducers';

export interface AppState {
  [PublicStoreFeatureKeys.AUTH]: AuthStoreState.AuthState;
  [PublicStoreFeatureKeys.UI]: UiStoreState.UiState;
  [PublicStoreFeatureKeys.USER]: UserStoreState.UserState;
  router: RouterReducerState<any>;
}

export const reducers: ActionReducerMap<AppState> = {
  [PublicStoreFeatureKeys.AUTH]: authStoreReducer,
  [PublicStoreFeatureKeys.UI]: uiStoreReducer,
  [PublicStoreFeatureKeys.USER]: userStoreReducer,
  router: routerReducer
};
