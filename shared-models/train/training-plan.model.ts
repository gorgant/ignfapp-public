import { TrainingSession } from "./training-session.model"

export interface TrainingPlan {
  id: string,
  title: string,
  creatorId: string,
  sessions: PlanSession[]
}

export interface PlanSession {
  sessionId: string,
  index: number
  complete: boolean
}
