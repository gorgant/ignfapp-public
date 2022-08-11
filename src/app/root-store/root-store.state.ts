import { PublicStoreFeatureKeys } from 'shared-models/store/feature-keys.model';
import { ActionReducerMap } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { AuthStoreState } from './auth-store';
import { authStoreReducer } from './auth-store/reducer';
import { UserStoreState } from './user-store';
import { userStoreReducer } from './user-store/reducer';
import { UiStoreState } from './ui-store';
import { uiStoreReducer } from './ui-store/reducers';
import { PersonalSessionFragmentStoreState } from './personal-session-fragment-store';
import { personalSessionFragmentStoreReducer } from './personal-session-fragment-store/reducer';
import { PlanSessionFragmentStoreState } from './plan-session-fragment-store';
import { planSessionFragmentStoreReducer } from './plan-session-fragment-store/reducer';
import { TrainingPlanStoreState } from './training-plan-store';
import { trainingPlanStoreReducer } from './training-plan-store/reducer';
import { TrainingRecordStoreState } from './training-record-store';
import { trainingRecordStoreReducer } from './training-record-store/reducer';
import { TrainingSessionStoreState } from './training-session-store';
import { trainingSessionStoreReducer } from './training-session-store/reducer';

export interface AppState {
  [PublicStoreFeatureKeys.AUTH]: AuthStoreState.AuthState;
  [PublicStoreFeatureKeys.PERSONAL_SESSSION_FRAGMENT]: PersonalSessionFragmentStoreState.PersonalSessionFragmentState;
  [PublicStoreFeatureKeys.PLAN_SESSSION_FRAGMENT]: PlanSessionFragmentStoreState.PlanSessionFragmentState;
  [PublicStoreFeatureKeys.TRAINING_PLAN]: TrainingPlanStoreState.TrainingPlanState;
  [PublicStoreFeatureKeys.TRAINING_RECORD]: TrainingRecordStoreState.TrainingRecordState;
  [PublicStoreFeatureKeys.TRAINING_SESSION]: TrainingSessionStoreState.TrainingSessionState;
  [PublicStoreFeatureKeys.UI]: UiStoreState.UiState;
  [PublicStoreFeatureKeys.USER]: UserStoreState.UserState;
  router: RouterReducerState<any>;
}

export const reducers: ActionReducerMap<AppState> = {
  [PublicStoreFeatureKeys.AUTH]: authStoreReducer,
  [PublicStoreFeatureKeys.PERSONAL_SESSSION_FRAGMENT]: personalSessionFragmentStoreReducer,
  [PublicStoreFeatureKeys.PLAN_SESSSION_FRAGMENT]: planSessionFragmentStoreReducer,
  [PublicStoreFeatureKeys.TRAINING_PLAN]: trainingPlanStoreReducer,
  [PublicStoreFeatureKeys.TRAINING_RECORD]: trainingRecordStoreReducer,
  [PublicStoreFeatureKeys.TRAINING_SESSION]: trainingSessionStoreReducer,
  [PublicStoreFeatureKeys.UI]: uiStoreReducer,
  [PublicStoreFeatureKeys.USER]: userStoreReducer,
  router: routerReducer
};
