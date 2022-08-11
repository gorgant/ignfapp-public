import { Update } from "@ngrx/entity";
import { createAction, props } from "@ngrx/store";
import { FirebaseError } from "firebase/app";
import { FirestoreCollectionQueryParams } from "shared-models/firestore/fs-collection-query-params.model";
import { PersonalSessionFragment, PersonalSessionFragmentNoId } from "shared-models/train/personal-session-fragment.model";

// Create Personal Session Fragment

export const createPersonalSessionFragmentRequested = createAction(
  '[AppWide] Create Personal Session Fragment Requested',
  props<{userId: string, personalSessionFragmentNoId: PersonalSessionFragmentNoId}>()
);

export const createPersonalSessionFragmentCompleted = createAction(
  '[Train Service] Create Personal Session Fragment Completed',
  props<{personalSessionFragment: PersonalSessionFragment}>()
);

export const createPersonalSessionFragmentFailed = createAction(
  '[Train Service] Create Personal Session Fragment Failed',
  props<{error: FirebaseError}>()
);

// Delete Personal Session Fragment

export const deletePersonalSessionFragmentRequested = createAction(
  '[Edit Personal Session Fragment] Delete Personal Session Fragment Requested',
  props<{userId: string, personalSessionFragmentId: string}>()
);

export const deletePersonalSessionFragmentCompleted = createAction(
  '[Train Service] Delete Personal Session Fragment Completed',
  props<{personalSessionFragmentId: string}>()
);

export const deletePersonalSessionFragmentFailed = createAction(
  '[Train Service] Delete Personal Session Fragment Failed',
  props<{error: FirebaseError}>()
);

// Fetch All Personal Session Fragments

export const fetchAllPersonalSessionFragmentsRequested = createAction(
  '[AppWide] Fetch All Personal Session Fragments Requested',
  props<{userId: string, queryParams: FirestoreCollectionQueryParams}>()
);

export const fetchAllPersonalSessionFragmentsCompleted = createAction(
  '[Train Service] Fetch All Personal Session Fragments Completed',
  props<{personalSessionFragments: PersonalSessionFragment[]}>()
);

export const fetchAllPersonalSessionFragmentsFailed = createAction(
  '[Train Service] Fetch All Personal Session Fragments Failed',
  props<{error: FirebaseError}>()
);

// Fetch Multiple Personal Session Fragments

export const fetchMultiplePersonalSessionFragmentsRequested = createAction(
  '[AppWide] Fetch Multiple Personal Session Fragments Requested',
  props<{userId: string, queryParams: FirestoreCollectionQueryParams}>()
);

export const fetchMultiplePersonalSessionFragmentsCompleted = createAction(
  '[Train Service] Fetch Multiple Personal Session Fragments Completed',
  props<{personalSessionFragments: PersonalSessionFragment[]}>()
);

export const fetchMultiplePersonalSessionFragmentsFailed = createAction(
  '[Train Service] Fetch Multiple Personal Session Fragments Failed',
  props<{error: FirebaseError}>()
);

// Fetch Single Personal Session Fragment

export const fetchSinglePersonalSessionFragmentRequested = createAction(
  '[AppWide] Fetch Single Personal Session Fragment Requested',
  props<{userId: string, personalSessionFragmentId: string}>()
);

export const fetchSinglePersonalSessionFragmentCompleted = createAction(
  '[Train Service] Fetch Single Personal Session Fragment Completed',
  props<{personalSessionFragment: PersonalSessionFragment}>()
);

export const fetchSinglePersonalSessionFragmentFailed = createAction(
  '[Train Service] Fetch Single Personal Session Fragment Failed',
  props<{error: FirebaseError}>()
);

// Purge Trainining PersonalSessionFragment Data

export const purgePersonalSessionFragmentData = createAction(
  '[AppWide] Purge Personal Session Fragment Data'
);

// Update Personal Session Fragment

export const updatePersonalSessionFragmentRequested = createAction(
  '[Edit Personal Session Fragment] Update Personal Session Fragment Requested',
  props<{userId: string, personalSessionFragmentUpdates: Update<PersonalSessionFragment>}>()
);

export const updatePersonalSessionFragmentCompleted = createAction(
  '[Train Service] Update Personal Session Fragment Completed',
  props<{personalSessionFragmentUpdates: Update<PersonalSessionFragment>}>()
);

export const updatePersonalSessionFragmentFailed = createAction(
  '[Train Service] Update Personal Session Fragment Failed',
  props<{error: FirebaseError}>()
);

