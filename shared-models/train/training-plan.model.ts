import { Timestamp } from '@angular/fire/firestore';

export interface TrainingPlan extends TrainingPlanNoIdOrTimestamp {
  createdTimestamp: number | Timestamp,
  [TrainingPlanKeys.ID]: string,
  lastModifiedTimestamp: number | Timestamp,
}
export interface TrainingPlanNoIdOrTimestamp {
  [TrainingPlanKeys.CREATOR_ID]: string,
  thumbnailUrlLarge?: string | null,
  thumbnailUrlSmall?: string | null,
  [TrainingPlanKeys.TITLE]: string,
  [TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: TrainingPlanVisibilityCategoryDbOption
  [TrainingPlanKeys.TRAINING_SESSION_COUNT]: number,
}

export enum TrainingPlanKeys {
  CREATOR_ID = 'creatorId',
  ID = 'id',
  TITLE = 'title',
  TRAINING_PLAN_VISIBILITY_CATEGORY = 'trainingPlanVisibilityCategory',
  TRAINING_SESSION_COUNT = 'trainingSessionCount',
}

export const TrainingPlanFormVars = {
  titleMinLength: 3,
  titleMaxLength: 70, // This is the max length of a YouTube video
}

export interface AddTrainingSessionToPlanQueryParams {
  [AddTrainingSessionToPlanQueryParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: boolean,
  [AddTrainingSessionToPlanQueryParamsKeys.TRAINING_PLAN_ID]: string,
  [AddTrainingSessionToPlanQueryParamsKeys.VIEW_TRAINING_SESSIONS]: boolean,
  [AddTrainingSessionToPlanQueryParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: TrainingPlanVisibilityCategoryDbOption,
}

// // If function deployment triggers an error, use the alternate version below
// export enum AddTrainingSessionUrlToPlanParamsKeys {
//   DATABASE_CATEGORY = TrainingSessionKeys.DATABASE_CATEGORY,
//   TRAINING_PLAN_BUILDER_REQUEST = 'trainingPlanBuilderRequest',
//   TRAINING_PLAN_ID = 'trainingPlanId',
//   TRAINING_PLAN_VISIBILITY_CATEGORY = TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY,
//   VIEW_TRAINING_SESSIONS = 'viewTrainingSessions'
// }

export enum AddTrainingSessionToPlanQueryParamsKeys {
  DATABASE_CATEGORY = 'databaseCategory',
  TRAINING_PLAN_BUILDER_REQUEST = 'trainingPlanBuilderRequest',
  TRAINING_PLAN_ID = 'trainingPlanId',
  TRAINING_PLAN_VISIBILITY_CATEGORY = 'trainingPlanVisibilityCategory',
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


