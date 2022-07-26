export interface SessionRating extends SessionRatingNoId {
  id: string;
}

export interface SessionRatingNoId {
  complexityRating: number;
  intensityRating: number;
  ratingTimestamp: number;
  sessionId: string;
  userId: string;
}