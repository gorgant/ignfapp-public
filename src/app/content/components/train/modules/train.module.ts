import { NgModule } from '@angular/core';

import { TrainRoutingModule } from './train-routing.module';
import { TrainingSessionComponent } from '../components/training-session/training-session.component';
import { TrainingPlanComponent } from '../components/training-plan/training-plan.component';
import { TrainDashboardComponent } from '../components/train-dashboard/train-dashboard.component';
import { TrainingSessionDetailsComponent } from '../components/training-session/training-session-details/training-session-details.component';
import { TrainingSessionVideoComponent } from '../components/training-session/training-session-video/training-session-video.component';
import { TrainingSessionCompleteDialogueComponent } from '../components/training-session/training-session-complete-dialogue/training-session-complete-dialogue.component';
import { EditPersonalQueueComponent } from '../components/edit-personal-queue/edit-personal-queue.component';



@NgModule({
    imports: [
    TrainRoutingModule,
    TrainingSessionComponent,
    TrainingPlanComponent,
    TrainDashboardComponent,
    TrainingSessionDetailsComponent,
    TrainingSessionVideoComponent,
    TrainingSessionCompleteDialogueComponent,
    EditPersonalQueueComponent
]
})
export class TrainModule { }
