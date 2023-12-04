import { TrainingPlan } from "./training-plan.model";

export interface DeleteTrainingPlanData {
  trainingPlan: TrainingPlan,
  userId: string,
}