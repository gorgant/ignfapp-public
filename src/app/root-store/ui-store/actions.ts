import { createAction, props } from "@ngrx/store";
import { EnvironmentTypes } from "shared-models/environments/env-vars.model";

// Environment Type

export const environmentTypeRequested = createAction(
  '[App Component] Environment Type Requested'
);

export const environmentTypeRetrieved = createAction(
  '[Ui Service] Environment Type Retreived',
  props<{environmentType: EnvironmentTypes}>()
);

export const environmentTypeFailed = createAction(
  '[Ui Service] Environment Type Failed',
  props<{error: firebase.default.FirebaseError}>()
);