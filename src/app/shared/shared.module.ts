import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from './material/material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActionConfirmDialogueComponent } from './components/action-confirm-dialogue/action-confirm-dialogue.component';
import { DurationIsoToMmSsPipe } from './pipes/duration-iso-to-mm-ss.pipe';
import { ActivityCategoryDbToUiPipe } from './pipes/activity-category-db-to-ui.pipe';
import { MuscleGroupDbToUiPipe } from './pipes/muscle-group-db-to-ui.pipe';
import { ComplexityDbToUiPipe } from './pipes/complexity-db-to-ui.pipe';
import { IntensityDbToUiPipe } from './pipes/intensity-db-to-ui.pipe';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { DurationMsToMmSsPipe } from './pipes/duration-ms-to-mm-ss.pipe';
import { BackButtonDirective } from './directives/back-button.directive';
import { TrainingSessionSearchFilterPipe } from './pipes/training-session-search-filter.pipe';
import { TrainingSessionCardComponent } from './components/training-session-card/training-session-card.component';
import { AddTrainingSessionToPlanButtonComponent } from './components/add-training-session-to-plan-button/add-training-session-to-plan-button.component';
import { TrainingPlanSearchFilterPipe } from './pipes/training-plan-search-filter.pipe';
import { TrainingPlanCardComponent } from './components/training-plan-card/training-plan-card.component';



@NgModule({
  declarations: [
    ActionConfirmDialogueComponent,
    DurationIsoToMmSsPipe,
    ActivityCategoryDbToUiPipe,
    MuscleGroupDbToUiPipe,
    ComplexityDbToUiPipe,
    IntensityDbToUiPipe,
    DurationMsToMmSsPipe,
    BackButtonDirective,
    TrainingSessionSearchFilterPipe,
    TrainingSessionCardComponent,
    AddTrainingSessionToPlanButtonComponent,
    TrainingPlanSearchFilterPipe,
    TrainingPlanCardComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    YouTubePlayerModule,
  ],
  exports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    DurationIsoToMmSsPipe,
    ActivityCategoryDbToUiPipe,
    MuscleGroupDbToUiPipe,
    ComplexityDbToUiPipe,
    IntensityDbToUiPipe,
    YouTubePlayerModule,
    DurationMsToMmSsPipe,
    BackButtonDirective,
    TrainingSessionSearchFilterPipe,
    TrainingSessionCardComponent,
    AddTrainingSessionToPlanButtonComponent,
    TrainingPlanSearchFilterPipe,
    TrainingPlanCardComponent
  ]
})
export class SharedModule { }
