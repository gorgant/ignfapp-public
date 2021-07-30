import { createReducer, MetaReducer, on } from "@ngrx/store";
import { environment } from "src/environments/environment";
import * as UiStoreActions from './actions';
import { initialUiState, UiState } from "./state";

export const uiStoreReducer = createReducer(
  initialUiState,

  // Environment Type

  on(UiStoreActions.environmentTypeRequested, (state, action) => {
    return {
      ...state,
      environmentTypeProcessing: true,
      evironmentTypeError: false,
    }
  }),
  on(UiStoreActions.environmentTypeRetrieved, (state, action) => {
    return {
      ...state,
      environmentTypeProcessing: false,
      environmentType: action.environmentType,
    }
  }),
  on(UiStoreActions.environmentTypeFailed, (state, action) => {
    return {
      ...state,
      environmentTypeProcessing: false,
      evironmentTypeError: action.error
    }
  }),
  
);

export const uiMetaReducers: MetaReducer<UiState>[] = !environment.production ? [] : [];