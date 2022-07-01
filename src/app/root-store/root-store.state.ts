import { PublicStoreFeatureKeys } from 'shared-models/store/feature-keys.model';
import { ActionReducerMap } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { AuthStoreState } from './auth-store';
import { authStoreReducer } from './auth-store/reducer';
import { UserStoreState } from './user-store';
import { userStoreReducer } from './user-store/reducer';
import { UiStoreState } from './ui-store';
import { uiStoreReducer } from './ui-store/reducers';
import { TrainingSessionStoreState } from './training-session-store';
import { trainingSessionStoreReducer } from './training-session-store/reducer';

export interface AppState {
  [PublicStoreFeatureKeys.AUTH]: AuthStoreState.AuthState;
  [PublicStoreFeatureKeys.TRAINING_SESSION]: TrainingSessionStoreState.TrainingSessionState;
  [PublicStoreFeatureKeys.UI]: UiStoreState.UiState;
  [PublicStoreFeatureKeys.USER]: UserStoreState.UserState;
  router: RouterReducerState<any>;
}

export const reducers: ActionReducerMap<AppState> = {
  [PublicStoreFeatureKeys.AUTH]: authStoreReducer,
  [PublicStoreFeatureKeys.TRAINING_SESSION]: trainingSessionStoreReducer,
  [PublicStoreFeatureKeys.UI]: uiStoreReducer,
  [PublicStoreFeatureKeys.USER]: userStoreReducer,
  router: routerReducer
};
