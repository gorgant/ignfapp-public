import { Timestamp } from '@angular/fire/firestore';
import { Params } from '@angular/router';
import { TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps } from "./training-session.model";

export interface PersonalSessionFragment extends PersonalSessionFragmentNoId {
  [PersonalSessionFragmentKeys.CREATED_TIMESTAMP]: number | Timestamp,
  id: string,
  [PersonalSessionFragmentKeys.LAST_MODIFIED_TIMESTAMP]: number | Timestamp,
}

export interface PersonalSessionFragmentNoId extends TrainingSessionNoIdOrTimestamps {
  [PersonalSessionFragmentKeys.CANONICAL_ID]: string,
  [PersonalSessionFragmentKeys.COMPLETE]: boolean,
  [PersonalSessionFragmentKeys.PLAN_INDEX]: number,
  [PersonalSessionFragmentKeys.SCHEDULED_TIMESTAMP]: boolean, // Concept with this is when a plan is added to a user account, UI asks frequency, and programs dates for each workout based on that frequency
  [PersonalSessionFragmentKeys.USER_ID]: string
}


export enum PersonalSessionFragmentKeys {
  CANONICAL_ID = 'canonicalId',
  COMPLETE = 'complete',
  CREATED_TIMESTAMP = 'createdTimestamp',
  LAST_MODIFIED_TIMESTAMP = 'lastModifiedTimestamp',
  PLAN_INDEX = 'planIndex',
  SCHEDULED_TIMESTAMP = 'scheduledTimestamp',
  USER_ID = 'userId',
}


export interface ViewPersonalSessionFragmentUrlParams extends Params {
  [PersonalSessionFragmentKeys.CANONICAL_ID]: string;
  [TrainingSessionKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes,
  id: string;
  [PersonalSessionFragmentKeys.USER_ID]: string;
}
