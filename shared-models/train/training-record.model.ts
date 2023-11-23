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
  duration: number,
  [TrainingRecordKeys.INTENSITY_RATING]: number,
  trainingSessionData: CanonicalTrainingSession | PlanSessionFragment | PersonalSessionFragment,
  userId: string,

};

export enum TrainingRecordKeys {
  CREATED_TIMESTAMP = 'createdTimestamp',
  COMPLEXITY_RATING = 'complexityRating',
  HOURS = 'hours',
  INTENSITY_RATING = 'intensityRating',
  MINUTES = 'minutes',
  SECONDS = 'seconds',
}

export interface TrainingSessionCompletionData {
  sessionDuration: number,
  trainingSession: CanonicalTrainingSession | PlanSessionFragment | PersonalSessionFragment,
  userId: string,
  personalSessionFragmentId?: string
}