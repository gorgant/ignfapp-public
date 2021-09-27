import { NgModule } from '@angular/core';

import { SharedModule } from 'src/app/shared/shared.module';
import { WorkoutRoutingModule } from './workout-routing.module';
import { WorkoutComponent } from '../components/workout/workout.component';


@NgModule({
  declarations: [
    WorkoutComponent
  ],
  imports: [
    SharedModule,
    WorkoutRoutingModule,
  ]
})
export class WorkoutModule { }
