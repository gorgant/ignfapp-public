import { FormControl } from "@angular/forms"
import { Params } from "@angular/router"
import { Timestamp } from '@angular/fire/firestore';

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
}

export enum TrainingPlanKeys {
  TITLE = 'title',
  ID = 'id'
}

export const TrainingPlanFormVars = {
  titleMinLength: 3,
  titleMaxLength: 70, // This is the max length of a YouTube video
}

export interface AddTrainingSessionUrlParams extends Params {
  [AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: boolean,
  [AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_ID]: string
}

export enum AddTrainingPlanUrlParamsKeys {
  TRAINING_PLAN_BUILDER_REQUEST = 'trainingPlanBuilderRequest',
  TRAINING_PLAN_ID = 'trainingPlanId'
}
