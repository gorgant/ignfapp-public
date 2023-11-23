import { Timestamp } from '@angular/fire/firestore';
import { TrainingSessionVisibilityCategoryDbOption } from './training-session.model';

export interface TrainingSessionRating extends TrainingSessionRatingNoIdOrTimestamp {
  id: string;
  ratingTimestamp: number | Timestamp;
}

export interface TrainingSessionRatingNoIdOrTimestamp {
  complexityRating: number;
  intensityRating: number;
  trainingSessionId: string;
  trainingSessionVisibilityCategory: TrainingSessionVisibilityCategoryDbOption;
  userId: string;
}