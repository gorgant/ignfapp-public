import { Routes } from "@angular/router";
import { TrainingPlanKeys } from "shared-models/train/training-plan.model";
import { TrainingSessionKeys } from "shared-models/train/training-session.model";
import { UnsavedChangesGuard } from "src/app/core/route-guards/unsaved-changes.guard";
import { TrainDashboardComponent } from "../train/train-dashboard/train-dashboard.component";
import { EditTrainingPlanComponent } from "./edit-training-plan/edit-training-plan.component";
import { EditTrainingSessionComponent } from "./edit-training-session/edit-training-session.component";

// TODO: Should we add UnsavedChangesGuard to the training plan routes similar to the training session routes?

export const BUILD_ROUTES: Routes = [
  {
    path: '',
    component: TrainDashboardComponent
  },
  {
    path: 'new-training-session',
    component: EditTrainingSessionComponent,
    canDeactivate: [UnsavedChangesGuard]
  },
  {
    path: `edit-training-session/:${TrainingSessionKeys.ID}`,
    component: EditTrainingSessionComponent,
    canDeactivate: [UnsavedChangesGuard]
  },
  {
    path: 'new-training-plan',
    component: EditTrainingPlanComponent,
  },
  {
    path: `edit-training-plan/:${TrainingPlanKeys.ID}`,
    component: EditTrainingPlanComponent,
  },
];