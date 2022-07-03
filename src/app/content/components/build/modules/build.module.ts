import { NgModule } from '@angular/core';

import { BuildRoutingModule } from './build-routing.module';
import { EditTrainingSessionComponent } from '../components/training-session/edit-training-session/edit-training-session.component';
import { ViewTrainingSessionComponent } from '../components/training-session/view-training-session/view-training-session.component';
import { ViewTrainingPlanComponent } from '../components/training-plan/view-training-plan/view-training-plan.component';
import { EditTrainingPlanComponent } from '../components/training-plan/edit-training-plan/edit-training-plan.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { EditTrainingSessionStepOneComponent } from '../components/training-session/edit-training-session/edit-training-session-step-one/edit-training-session-step-one.component';
import { EditTrainingSessionStepTwoComponent } from '../components/training-session/edit-training-session/edit-training-session-step-two/edit-training-session-step-two.component';


@NgModule({
  declarations: [
    EditTrainingSessionComponent,
    ViewTrainingSessionComponent,
    ViewTrainingPlanComponent,
    EditTrainingPlanComponent,
    EditTrainingSessionStepOneComponent,
    EditTrainingSessionStepTwoComponent,
  ],
  imports: [
    SharedModule,
    BuildRoutingModule
  ]
})
export class BuildModule { }
