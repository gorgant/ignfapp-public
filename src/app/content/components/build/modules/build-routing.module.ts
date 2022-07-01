import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UnsavedChangesGuard } from 'src/app/core/route-guards/unsaved-changes.guard';
import { TrainComponent } from '../../train/components/train/train.component';
import { EditTrainingPlanComponent } from '../components/training-plan/edit-training-plan/edit-training-plan.component';
import { EditTrainingSessionComponent } from '../components/training-session/edit-training-session/edit-training-session.component';

const routes: Routes = [
  {
    path: '',
    component: TrainComponent
  },
  {
    path: 'new-training-session',
    component: EditTrainingSessionComponent,
    canDeactivate: [UnsavedChangesGuard]
  },
  {
    path: 'edit-training-session/:id',
    component: EditTrainingSessionComponent,
    canDeactivate: [UnsavedChangesGuard]
  },
  {
    path: 'new-training-plan',
    component: EditTrainingPlanComponent,
    canDeactivate: [UnsavedChangesGuard]
  },
  {
    path: 'edit-training-plan/:id',
    component: EditTrainingPlanComponent,
    canDeactivate: [UnsavedChangesGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BuildRoutingModule { }
