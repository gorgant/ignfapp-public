import { Timestamp } from '@angular/fire/firestore';

export interface TrainingSessionRating extends TrainingSessionRatingNoIdOrTimestamp {
  id: string;
  ratingTimestamp: number | Timestamp;
}

export interface TrainingSessionRatingNoIdOrTimestamp {
  complexityRating: number;
  intensityRating: number;
  trainingSessionId: string;
  userId: string;
}