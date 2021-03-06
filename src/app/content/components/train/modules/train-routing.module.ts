import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UnsavedChangesGuard } from 'src/app/core/route-guards/unsaved-changes.guard';
import { TrainDashboardComponent } from '../components/train-dashboard/train-dashboard.component';
import { TrainingPlanComponent } from '../components/training-plan/training-plan.component';
import { TrainingSessionComponent } from '../components/training-session/training-session.component';

const routes: Routes = [
  {
    path: '',
    component: TrainDashboardComponent
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

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrainRoutingModule { }
