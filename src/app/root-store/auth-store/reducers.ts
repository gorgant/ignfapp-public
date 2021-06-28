import {
  createReducer,
  MetaReducer,
  on
} from '@ngrx/store';
import { environment } from 'src/environments/environment';
import * as AuthStoreActions from './actions';
import { AuthState, initialAuthState } from './state';



export const authStoreReducer = createReducer(
  initialAuthState,


  on(AuthStoreActions.emailAuthRequested, (state, action) => {
    return {
      ...state,
      authProcessesing: true,
      authError: undefined
    }
  }),
  on(AuthStoreActions.emailAuthCompleted, (state, action) => {
    return {
      ...state,
      authProcessesing: false,
      authResultsData: action.authResultsData
    }
  }),
  on(AuthStoreActions.emailAuthFailed, (state, action) => {
    return {
      ...state,
      authProcessesing: false,
      authError: action.error
    }
  }),
  
  on(AuthStoreActions.emailSignupRequested, (state, action) => {
    return {
      ...state,
      signupProcessesing: true,
      signupError: undefined
    }
  }),
  on(AuthStoreActions.emailSignupCompleted, (state, action) => {
    return {
      ...state,
      signupProcessesing: false,
      authResultsData: action.authResultsData
    }
  }),
  on(AuthStoreActions.emailSignupFailed, (state, action) => {
    return {
      ...state,
      signupProcessesing: false,
      signupError: action.error
    }
  }),
  
  on(AuthStoreActions.logout, (state, action) => {
    return {
      ...state,
      authResultsData: undefined
    }
  })
);

export const authMetaReducers: MetaReducer<AuthState>[] = !environment.production ? [] : [];
