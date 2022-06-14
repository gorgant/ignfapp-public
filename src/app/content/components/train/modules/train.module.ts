import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainComponent } from '../components/train/train.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { TrainRoutingModule } from './train-routing.module';



@NgModule({
  declarations: [
    TrainComponent
  ],
  imports: [
    SharedModule,
    TrainRoutingModule
  ]
})
export class TrainModule { }
