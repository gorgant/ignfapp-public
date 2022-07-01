import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from './material/material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActionConfirmDialogueComponent } from './components/action-confirm-dialogue/action-confirm-dialogue.component';
import { DurationToMmSsPipe } from './pipes/duration-to-mm-ss.pipe';



@NgModule({
  declarations: [
    ActionConfirmDialogueComponent,
    DurationToMmSsPipe
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  exports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    DurationToMmSsPipe
  ]
})
export class SharedModule { }
