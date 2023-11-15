import { Timestamp } from '@angular/fire/firestore';
import { Params } from '@angular/router';
import { TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps } from "./training-session.model";

export interface PersonalSessionFragment extends PersonalSessionFragmentNoIdOrTimestamp {
  [PersonalSessionFragmentKeys.CREATED_TIMESTAMP]: number | Timestamp,
  id: string,
  [PersonalSessionFragmentKeys.LAST_MODIFIED_TIMESTAMP]: number | Timestamp,
}

export interface PersonalSessionFragmentNoIdOrTimestamp extends TrainingSessionNoIdOrTimestamps {
  [PersonalSessionFragmentKeys.CANONICAL_ID]: string,
  [PersonalSessionFragmentKeys.COMPLETE]: boolean,
  [PersonalSessionFragmentKeys.QUEUE_INDEX]: number,
  [PersonalSessionFragmentKeys.USER_ID]: string
}


export enum PersonalSessionFragmentKeys {
  CANONICAL_ID = 'canonicalId',
  COMPLETE = 'complete',
  CREATED_TIMESTAMP = 'createdTimestamp',
  LAST_MODIFIED_TIMESTAMP = 'lastModifiedTimestamp',
  QUEUE_INDEX = 'queueIndex',
  SCHEDULED_TIMESTAMP = 'scheduledTimestamp',
  USER_ID = 'userId',
}


export interface ViewPersonalSessionFragmentUrlParams extends Params {
  [PersonalSessionFragmentKeys.CANONICAL_ID]: string;
  [TrainingSessionKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes,
}

export interface DeletePersonalSessionFragmentUrlParams extends Params {
  [DeletePersonalSessionFragmentUrlParamsKeys.DELETE_PERSONAL_SESSION_FRAGMENT_ID]: string,
}

export enum DeletePersonalSessionFragmentUrlParamsKeys {
  DELETE_PERSONAL_SESSION_FRAGMENT_ID = 'deletePersonalSessionFragmentId',
}
