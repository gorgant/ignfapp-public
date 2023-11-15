import { Timestamp } from '@angular/fire/firestore';
import { Params } from '@angular/router';
import { TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps } from "./training-session.model";

export interface PlanSessionFragment extends PlanSessionFragmentNoIdOrTimestamp {
  [PlanSessionFragmentKeys.CREATED_TIMESTAMP]: number | Timestamp,
  id: string,
  [PlanSessionFragmentKeys.LAST_MODIFIED_TIMESTAMP]: number | Timestamp,
}

export interface PlanSessionFragmentNoIdOrTimestamp extends TrainingSessionNoIdOrTimestamps {
  [PlanSessionFragmentKeys.CANONICAL_ID]: string,
  [PlanSessionFragmentKeys.TRAINING_PLAN_ID]: string,
  [PlanSessionFragmentKeys.TRAINING_PLAN_INDEX]: number,
  [PlanSessionFragmentKeys.TRAINING_PLAN_OWNER_ID]: string,
}

export enum PlanSessionFragmentKeys {
  CANONICAL_ID = 'canonicalId',
  CREATED_TIMESTAMP = 'createdTimestamp',
  LAST_MODIFIED_TIMESTAMP = 'lastModifiedTimestamp',
  TRAINING_PLAN_ID = 'trainingPlanId',
  TRAINING_PLAN_INDEX = 'trainingPlanIndex',
  TRAINING_PLAN_OWNER_ID = 'trainingPlanOwnerId'
}

export interface ViewPlanSessionFragmentUrlParams extends Params {
  [PlanSessionFragmentKeys.CANONICAL_ID]: string,
  [TrainingSessionKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes,
}

export interface DeletePlanSessionFragmentUrlParams extends Params {
  [DeletePlanSessionFragmentUrlParamsKeys.DELETE_PLAN_SESSION_FRAGMENT_ID]: string,
}

export enum DeletePlanSessionFragmentUrlParamsKeys {
  DELETE_PLAN_SESSION_FRAGMENT_ID = 'deletePlanSessionFragmentId',
}