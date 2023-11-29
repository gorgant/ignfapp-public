import { Timestamp } from '@angular/fire/firestore';
import { Params } from '@angular/router';
import { TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps } from "./training-session.model";

export interface PersonalSessionFragment extends PersonalSessionFragmentNoIdOrTimestamp {
  [PersonalSessionFragmentKeys.CREATED_TIMESTAMP]: number | Timestamp,
  [PersonalSessionFragmentKeys.ID]: string,
  [PersonalSessionFragmentKeys.LAST_MODIFIED_TIMESTAMP]: number | Timestamp,
}

export interface PersonalSessionFragmentNoIdOrTimestamp extends TrainingSessionNoIdOrTimestamps {
  [PersonalSessionFragmentKeys.CANONICAL_ID]: string,
  [PersonalSessionFragmentKeys.COMPLETE]: boolean,
  [PersonalSessionFragmentKeys.CREATOR_ID]: string,
  [PersonalSessionFragmentKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes,
  [PersonalSessionFragmentKeys.QUEUE_INDEX]: number,
}

export type NewDataForPersonalSessionFragmentNoIdOrTimestamp = Pick<
    PersonalSessionFragmentNoIdOrTimestamp,
    PersonalSessionFragmentKeys.CANONICAL_ID |
    PersonalSessionFragmentKeys.COMPLETE |
    PersonalSessionFragmentKeys.CREATOR_ID |
    PersonalSessionFragmentKeys.DATABASE_CATEGORY |
    PersonalSessionFragmentKeys.QUEUE_INDEX
  >;

// Ensure this has all of the properties that might overlap with a CanonicalTrainingSession because it is used for a loop to delete those during creation
export enum PersonalSessionFragmentKeys {
  CANONICAL_ID = 'canonicalId',
  COMPLETE = 'complete',
  CREATED_TIMESTAMP = 'createdTimestamp',
  CREATOR_ID = 'creatorId',
  DATABASE_CATEGORY = TrainingSessionKeys.DATABASE_CATEGORY,
  ID = 'id',
  LAST_MODIFIED_TIMESTAMP = 'lastModifiedTimestamp',
  QUEUE_INDEX = 'queueIndex',
  SCHEDULED_TIMESTAMP = 'scheduledTimestamp',
}


export interface ViewPersonalSessionFragmentQueryParams {
  [ViewPersonalSessionFragmentQueryParamsKeys.CANONICAL_ID]: string;
  [ViewPersonalSessionFragmentQueryParamsKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes,
}

export enum ViewPersonalSessionFragmentQueryParamsKeys {
  CANONICAL_ID = PersonalSessionFragmentKeys.CANONICAL_ID,
  DATABASE_CATEGORY = TrainingSessionKeys.DATABASE_CATEGORY,
}

export interface DeletePersonalSessionFragmentUrlParams {
  [DeletePersonalSessionFragmentUrlParamsKeys.DELETE_PERSONAL_SESSION_FRAGMENT_ID]: string,
}

export enum DeletePersonalSessionFragmentUrlParamsKeys {
  DELETE_PERSONAL_SESSION_FRAGMENT_ID = 'deletePersonalSessionFragmentId',
}
