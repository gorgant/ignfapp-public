import { Params } from "@angular/router"
import { Timestamp } from '@angular/fire/firestore';
import { BrowseTrainingSessionsQueryParamsKeys, TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys } from "./training-session.model";

export interface TrainingPlan extends TrainingPlanNoIdOrTimestamp {
  createdTimestamp: number | Timestamp,
  [TrainingPlanKeys.ID]: string,
  lastModifiedTimestamp: number | Timestamp,
}
export interface TrainingPlanNoIdOrTimestamp {
  creatorId: string,
  [TrainingPlanKeys.TITLE]: string,
  trainingSessionCount: number,
  thumbnailUrlLarge?: string | null,
  thumbnailUrlSmall?: string | null,
  [TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: TrainingPlanVisibilityCategoryDbOption
}

export enum TrainingPlanKeys {
  TITLE = 'title',
  ID = 'id',
  TRAINING_PLAN_VISIBILITY_CATEGORY = 'trainingPlanVisibilityCategory',
}

export const TrainingPlanFormVars = {
  titleMinLength: 3,
  titleMaxLength: 70, // This is the max length of a YouTube video
}

export interface AddTrainingSessionToPlanQueryParams {
  [AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: boolean,
  [AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_ID]: string,
  [AddTrainingSessionUrlToPlanParamsKeys.VIEW_TRAINING_SESSIONS]: boolean,
  [AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: TrainingPlanVisibilityCategoryDbOption,
}

export enum AddTrainingSessionUrlToPlanParamsKeys {
  DATABASE_CATEGORY = TrainingSessionKeys.DATABASE_CATEGORY,
  TRAINING_PLAN_BUILDER_REQUEST = 'trainingPlanBuilderRequest',
  TRAINING_PLAN_ID = 'trainingPlanId',
  TRAINING_PLAN_VISIBILITY_CATEGORY = TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY,
  VIEW_TRAINING_SESSIONS = 'viewTrainingSessions'
}

export interface ViewTrainingPlanQueryParams {
  [ViewTrainingPlanQueryParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: TrainingPlanVisibilityCategoryDbOption,
  [ViewTrainingPlanQueryParamsKeys.TRAINING_PLAN_ID]?: string,
}

export enum ViewTrainingPlanQueryParamsKeys {
  TRAINING_PLAN_VISIBILITY_CATEGORY = 'trainingPlanVisibilityCategory',
  TRAINING_PLAN_ID = 'trainingPlanId'
}

export enum TrainingPlanVisibilityCategoryDbOption {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

export enum TrainingPlanVisibilityCategoryUiOption {
  PUBLIC = 'Everyone',
  PRIVATE = 'Only You'
}

export interface TrainingPlanVisibilityCategoryObject {
  uiValue: TrainingPlanVisibilityCategoryUiOption,
  dbValue: TrainingPlanVisibilityCategoryDbOption
}

export interface TrainingPlanVisibilityCategoryListModel {
  [key: string]: TrainingPlanVisibilityCategoryObject
}

export const TrainingPlanVisibilityTypeList: TrainingPlanVisibilityCategoryListModel = {
  [TrainingPlanVisibilityCategoryDbOption.PUBLIC]: {
    uiValue: TrainingPlanVisibilityCategoryUiOption.PUBLIC,
    dbValue: TrainingPlanVisibilityCategoryDbOption.PUBLIC
  },
  [TrainingPlanVisibilityCategoryDbOption.PRIVATE]: {
    uiValue: TrainingPlanVisibilityCategoryUiOption.PRIVATE,
    dbValue: TrainingPlanVisibilityCategoryDbOption.PRIVATE
  },
}


