import { Update } from "@ngrx/entity";
import { createAction, props } from "@ngrx/store";
import { FirebaseError } from "firebase/app";
import { FirestoreCollectionQueryParams } from "shared-models/firestore/fs-collection-query-params.model";
import { TrainingRecord, TrainingRecordNoIdOrTimestamp } from "shared-models/train/training-record.model";

// Create Training Record

export const createTrainingRecordRequested = createAction(
  '[Training Record Complete Dialogue] Create Training Record Requested',
  props<{userId: string, trainingRecordNoId: TrainingRecordNoIdOrTimestamp}>()
);

export const createTrainingRecordCompleted = createAction(
  '[Train Service] Create Training Record Completed',
  props<{trainingRecord: TrainingRecord}>()
);

export const createTrainingRecordFailed = createAction(
  '[Train Service] Create Training Record Failed',
  props<{error: FirebaseError}>()
);

// Delete Training Record

export const deleteTrainingRecordRequested = createAction(
  '[Edit Training Record] Delete Training Record Requested',
  props<{userId: string, recordId: string}>()
);

export const deleteTrainingRecordCompleted = createAction(
  '[Train Service] Delete Training Record Completed',
  props<{recordId: string}>()
);

export const deleteTrainingRecordFailed = createAction(
  '[Train Service] Delete Training Record Failed',
  props<{error: FirebaseError}>()
);

// Fetch All Training Records

export const fetchAllTrainingRecordsRequested = createAction(
  '[AppWide] Fetch All Training Records Requested',
  props<{userId: string}>()
);

export const fetchAllTrainingRecordsCompleted = createAction(
  '[Train Service] Fetch All Training Records Completed',
  props<{trainingRecords: TrainingRecord[]}>()
);

export const fetchAllTrainingRecordsFailed = createAction(
  '[Train Service] Fetch All Training Records Failed',
  props<{error: FirebaseError}>()
);

// Fetch Multiple Training Records

export const fetchMultipleTrainingRecordsRequested = createAction(
  '[AppWide] Fetch Multiple Training Records Requested',
  props<{userId: string, queryParams: FirestoreCollectionQueryParams}>()
);

export const fetchMultipleTrainingRecordsCompleted = createAction(
  '[Train Service] Fetch Multiple Training Records Completed',
  props<{trainingRecords: TrainingRecord[]}>()
);

export const fetchMultipleTrainingRecordsFailed = createAction(
  '[Train Service] Fetch Multiple Training Records Failed',
  props<{error: FirebaseError}>()
);

// Fetch Single Training Record

export const fetchSingleTrainingRecordRequested = createAction(
  '[AppWide] Fetch Single Training Record Requested',
  props<{userId: string, recordId: string}>()
);

export const fetchSingleTrainingRecordCompleted = createAction(
  '[Train Service] Fetch Single Training Record Completed',
  props<{trainingRecord: TrainingRecord}>()
);

export const fetchSingleTrainingRecordFailed = createAction(
  '[Train Service] Fetch Single Training Record Failed',
  props<{error: FirebaseError}>()
);

// Purge Trainining Record Data

export const purgeTrainingRecordData = createAction(
  '[AppWide] Purge Training Record Data'
);

// Purge Training Record Errors

export const purgeTrainingRecordErrors = createAction(
  '[AppWide] Purge Training Record Errors'
);

// Update Training Record

export const updateTrainingRecordRequested = createAction(
  '[Edit Training Record] Update Training Record Requested',
  props<{userId: string, trainingRecordUpdates: Update<TrainingRecord>}>()
);

export const updateTrainingRecordCompleted = createAction(
  '[Train Service] Update Training Record Completed',
  props<{trainingRecordUpdates: Update<TrainingRecord>}>()
);

export const updateTrainingRecordFailed = createAction(
  '[Train Service] Update Training Record Failed',
  props<{error: FirebaseError}>()
);

