import { Routes } from "@angular/router";
import { UnsavedChangesGuard } from "src/app/core/route-guards/unsaved-changes.guard";
import { EditPersonalQueueComponent } from "./edit-personal-queue/edit-personal-queue.component";
import { TrainDashboardComponent } from "./train-dashboard/train-dashboard.component";
import { TrainingPlanComponent } from "./training-plan/training-plan.component";
import { TrainingSessionComponent } from "./training-session/training-session.component";

export const TRAIN_ROUTES: Routes = [
  {
    path: '',
    component: TrainDashboardComponent
  },
  {
    path: 'edit-personal-queue',
    component: EditPersonalQueueComponent,
  },
  {
    path: 'session/:id',
    component: TrainingSessionComponent,
    canDeactivate: [UnsavedChangesGuard]
  },
  {
    path: 'plan/:id',
    component: TrainingPlanComponent,
  }
];