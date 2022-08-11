import { FormControl } from "@angular/forms"
import { Params } from "@angular/router"
import { Timestamp } from '@angular/fire/firestore';

export interface TrainingPlan extends TrainingPlanNoIdOrTimestamp {
  createdTimestamp: number | Timestamp,
  id: string,
  lastModifiedTimestamp: number | Timestamp,
}
export interface TrainingPlanNoIdOrTimestamp {
  creatorId: string,
  [TrainingPlanKeys.TITLE]: string,
}

export enum TrainingPlanKeys {
  TITLE = 'title'
}

export interface TrainingPlanForm {
  [TrainingPlanKeys.TITLE]: FormControl<string | null>,
}

export const TrainingPlanFormVars = {
  titleMinLength: 3,
  titleMaxLength: 70,
}

export interface AddTrainingPlanUrlParams extends Params {
  [AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: boolean,
  [AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_ID]: string
}

export enum AddTrainingPlanUrlParamsKeys {
  TRAINING_PLAN_BUILDER_REQUEST = 'trainingPlanBuilderRequest',
  TRAINING_PLAN_ID = 'trainingPlanId'
}
