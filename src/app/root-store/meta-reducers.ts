import { ActionReducer, MetaReducer, on } from '@ngrx/store';
import { AuthStoreActions } from './auth-store/index';

// This metareducer clears store on logout
export function clearStore(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state, action) => {
    on(AuthStoreActions.logout, (state, action) => {
      state = null
    });

    return reducer(state, action);
  };
}

export const metaReducers: MetaReducer<any>[] = [clearStore];