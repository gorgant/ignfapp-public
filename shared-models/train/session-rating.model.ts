import { Timestamp } from '@angular/fire/firestore';
import { TrainingSessionDatabaseCategoryTypes, TrainingSessionVisibilityCategoryDbOption } from './training-session.model';

export interface TrainingSessionRating extends TrainingSessionRatingNoIdOrTimestamp {
  id: string;
  ratingTimestamp: number | Timestamp;
}

export interface TrainingSessionRatingNoIdOrTimestamp {
  complexityRating: number;
  databaseCategory: TrainingSessionDatabaseCategoryTypes;
  intensityRating: number;
  canonicalTrainingSessionId: string;
  trainingSessionVisibilityCategory: TrainingSessionVisibilityCategoryDbOption;
  userId: string;
}