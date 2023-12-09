import { FormControl } from "@angular/forms";
import { CanonicalTrainingSession, TrainingSessionVisibilityCategoryDbOption } from "./training-session.model";
import { Timestamp } from '@angular/fire/firestore';
import { PersonalSessionFragment } from "./personal-session-fragment.model";
import { PlanSessionFragment } from "./plan-session-fragment.model";

export interface TrainingRecord extends TrainingRecordNoIdOrTimestamp {
  [TrainingRecordKeys.CREATED_TIMESTAMP]: number | Timestamp,
  id: string,
  lastModifiedTimestamp: number | Timestamp
};

export interface TrainingRecordNoIdOrTimestamp {
  [TrainingRecordKeys.COMPLEXITY_RATING]: number,
  [TrainingRecordKeys.CREATOR_ID]: string,
  [TrainingRecordKeys.DURATION]: number,
  [TrainingRecordKeys.INTENSITY_RATING]: number,
  [TrainingRecordKeys.TRAINING_SESSION_DATA]: CanonicalTrainingSession | PlanSessionFragment | PersonalSessionFragment,

};

export enum TrainingRecordKeys {
  CREATOR_ID = 'creatorId',
  CREATED_TIMESTAMP = 'createdTimestamp',
  COMPLEXITY_RATING = 'complexityRating',
  DURATION = 'duration',
  HOURS = 'hours',
  INTENSITY_RATING = 'intensityRating',
  MINUTES = 'minutes',
  SECONDS = 'seconds',
  TRAINING_SESSION_DATA = 'trainingSessionData'
}

export interface TrainingSessionCompletionData {
  sessionDuration: number,
  trainingSession: CanonicalTrainingSession | PlanSessionFragment | PersonalSessionFragment,
  userId: string,
}