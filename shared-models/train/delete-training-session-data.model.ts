import { CanonicalTrainingSession } from "./training-session.model";

export interface DeleteTrainingSessionData {
  trainingSession: CanonicalTrainingSession,
  userId: string,
}