import { FormControl } from "@angular/forms";
import { TrainingSession } from "./training-session.model";
import { Timestamp } from '@angular/fire/firestore';

export interface TrainingRecord extends TrainingRecordNoIdOrTimestamp {
  createdTimestamp: number | Timestamp,
  id: string,
  lastModifiedTimestamp: number | Timestamp
};

export interface TrainingRecordNoIdOrTimestamp {
  [TrainingRecordKeys.COMPLEXITY_RATING]: number,
  duration: number,
  [TrainingRecordKeys.INTENSITY_RATING]: number,
  trainingSessionData: TrainingSession,
  userId: string,

};

export enum TrainingRecordKeys {
  COMPLEXITY_RATING = 'complexityRating',
  HOURS = 'hours',
  INTENSITY_RATING = 'intensityRating',
  MINUTES = 'minutes',
  SECONDS = 'seconds',
}

export interface TrainingSessionCompletionData {
  sessionDuration: number,
  trainingSession: TrainingSession,
  userId: string,
  personalSessionFragmentId?: string
}