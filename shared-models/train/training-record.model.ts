import { FormControl } from "@angular/forms";
import { TrainingSession } from "./training-session.model";

export interface TrainingRecord extends TrainingRecordNoId {
  id: string,
};

export interface TrainingRecordNoId {
  [TrainingRecordKeys.COMPLEXITY_RATING]: number,
  duration: number,
  [TrainingRecordKeys.INTENSITY_RATING]: number,
  trainingSessionData: TrainingSession,
  userId: string,
  completedTimestamp: number,
};

export interface TrainingRecordForm {
  [TrainingRecordKeys.COMPLEXITY_RATING]: FormControl<number | null>,
  [TrainingRecordKeys.HOURS]: FormControl<number | null>,
  [TrainingRecordKeys.INTENSITY_RATING]: FormControl<number | null>,
  [TrainingRecordKeys.MINUTES]: FormControl<number | null>,
  [TrainingRecordKeys.SECONDS]: FormControl<number | null>,
}

export enum TrainingRecordKeys {
  COMPLEXITY_RATING = 'complexityRating',
  HOURS = 'hours',
  INTENSITY_RATING = 'intensityRating',
  MINUTES = 'minutes',
  SECONDS = 'seconds',
}

export interface TrainingSessionCompletionData {
  trainingSession: TrainingSession,
  sessionCompletionTimestamp: number,
  sessionDuration: number,
  userId: string
}