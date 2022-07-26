import { NgModule } from '@angular/core';

import { BuildRoutingModule } from './build-routing.module';
import { EditTrainingSessionComponent } from '../components/edit-training-session/edit-training-session.component';
import { EditTrainingPlanComponent } from '../components/edit-training-plan/edit-training-plan.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { EditTrainingSessionStepOneComponent } from '../components/edit-training-session/edit-training-session-step-one/edit-training-session-step-one.component';
import { EditTrainingSessionStepTwoComponent } from '../components/edit-training-session/edit-training-session-step-two/edit-training-session-step-two.component';


@NgModule({
  declarations: [
    EditTrainingSessionComponent,
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
