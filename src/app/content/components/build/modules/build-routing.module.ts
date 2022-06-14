import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
    component: EditTrainingSessionComponent
  },
  {
    path: 'edit-training-session/:id',
    component: EditTrainingSessionComponent
  },
  {
    path: 'new-training-plan',
    component: EditTrainingPlanComponent
  },
  {
    path: 'edit-training-plan/:id',
    component: EditTrainingPlanComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BuildRoutingModule { }
