import { Routes } from "@angular/router";
import { TrainingPlanKeys } from "shared-models/train/training-plan.model";
import { TrainingSessionKeys } from "shared-models/train/training-session.model";
import { UnsavedChangesGuard } from "src/app/core/route-guards/unsaved-changes.guard";
import { TrainDashboardComponent } from "../train/components/train-dashboard/train-dashboard.component";
import { EditTrainingPlanComponent } from "./components/edit-training-plan/edit-training-plan.component";
import { EditTrainingSessionComponent } from "./components/edit-training-session/edit-training-session.component";

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