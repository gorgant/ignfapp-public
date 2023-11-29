import { Timestamp } from '@angular/fire/firestore';
import { Params } from '@angular/router';
import { TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps } from "./training-session.model";
import { TrainingPlanKeys, TrainingPlanVisibilityCategoryDbOption } from './training-plan.model';

export interface PlanSessionFragment extends PlanSessionFragmentNoIdOrTimestamp {
  [PlanSessionFragmentKeys.CREATED_TIMESTAMP]: number | Timestamp,
  [PlanSessionFragmentKeys.ID]: string,
  [PlanSessionFragmentKeys.LAST_MODIFIED_TIMESTAMP]: number | Timestamp,
}

export interface PlanSessionFragmentNoIdOrTimestamp extends TrainingSessionNoIdOrTimestamps {
  [PlanSessionFragmentKeys.CANONICAL_ID]: string,
  [PlanSessionFragmentKeys.CREATOR_ID]: string,
  [PlanSessionFragmentKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes,
  [PlanSessionFragmentKeys.TRAINING_PLAN_ID]: string,
  [PlanSessionFragmentKeys.TRAINING_PLAN_INDEX]: number,
  [PlanSessionFragmentKeys.TRAINING_PLAN_OWNER_ID]: string,
  [PlanSessionFragmentKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: TrainingPlanVisibilityCategoryDbOption
}

export type NewDataForPlanSessionFragmentNoIdOrTimestamp = Pick<
    PlanSessionFragmentNoIdOrTimestamp,
    PlanSessionFragmentKeys.CANONICAL_ID |
    PlanSessionFragmentKeys.CREATOR_ID |
    PlanSessionFragmentKeys.DATABASE_CATEGORY |
    PlanSessionFragmentKeys.TRAINING_PLAN_ID |
    PlanSessionFragmentKeys.TRAINING_PLAN_INDEX |
    PlanSessionFragmentKeys.TRAINING_PLAN_OWNER_ID |
    PlanSessionFragmentKeys.TRAINING_PLAN_VISIBILITY_CATEGORY
  >;

// Ensure this has all of the properties that might overlap with a CanonicalTrainingSession because it is used for a loop to delete those during creation
export enum PlanSessionFragmentKeys {
  CANONICAL_ID = 'canonicalId',
  CREATED_TIMESTAMP = 'createdTimestamp',
  CREATOR_ID = 'creatorId',
  DATABASE_CATEGORY = TrainingSessionKeys.DATABASE_CATEGORY,
  ID = 'id',
  LAST_MODIFIED_TIMESTAMP = 'lastModifiedTimestamp',
  TRAINING_PLAN_ID = 'trainingPlanId',
  TRAINING_PLAN_INDEX = 'trainingPlanIndex',
  TRAINING_PLAN_OWNER_ID = 'trainingPlanOwnerId',
  TRAINING_PLAN_VISIBILITY_CATEGORY = TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY
}

export interface ViewPlanSessionFragmentQueryParams {
  [ViewPlanSessionFragmentQueryParamsKeys.CANONICAL_ID]: string,
  [ViewPlanSessionFragmentQueryParamsKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes,
  [ViewPlanSessionFragmentQueryParamsKeys.TRAINING_PLAN_ID]: string,
  [ViewPlanSessionFragmentQueryParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: TrainingPlanVisibilityCategoryDbOption
}

export enum ViewPlanSessionFragmentQueryParamsKeys {
  CANONICAL_ID = PlanSessionFragmentKeys.CANONICAL_ID,
  DATABASE_CATEGORY = TrainingSessionKeys.DATABASE_CATEGORY,
  TRAINING_PLAN_ID = PlanSessionFragmentKeys.TRAINING_PLAN_ID,
  TRAINING_PLAN_VISIBILITY_CATEGORY = PlanSessionFragmentKeys.TRAINING_PLAN_VISIBILITY_CATEGORY
}

export interface DeletePlanSessionFragmentQueryParams {
  [DeletePlanSessionFragmentQueryParamsKeys.DELETE_PLAN_SESSION_FRAGMENT_ID]: string,
  [DeletePlanSessionFragmentQueryParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: TrainingPlanVisibilityCategoryDbOption,
}

export enum DeletePlanSessionFragmentQueryParamsKeys {
  DELETE_PLAN_SESSION_FRAGMENT_ID = 'deletePlanSessionFragmentId',
  TRAINING_PLAN_VISIBILITY_CATEGORY = PlanSessionFragmentKeys.TRAINING_PLAN_VISIBILITY_CATEGORY
}