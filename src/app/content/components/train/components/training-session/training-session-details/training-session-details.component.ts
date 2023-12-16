import { Component, Input, OnInit, ViewChild, signal } from '@angular/core';
import { MatExpansionPanel, MatExpansionModule } from '@angular/material/expansion';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PersonalSessionFragment } from 'shared-models/train/personal-session-fragment.model';
import { PlanSessionFragment } from 'shared-models/train/plan-session-fragment.model';
import { CanonicalTrainingSession, TrainingSessionKeys } from 'shared-models/train/training-session.model';
import { IntensityDbToUiPipe } from '../../../../../../shared/pipes/intensity-db-to-ui.pipe';
import { ComplexityDbToUiPipe } from '../../../../../../shared/pipes/complexity-db-to-ui.pipe';
import { MuscleGroupDbToUiPipe } from '../../../../../../shared/pipes/muscle-group-db-to-ui.pipe';
import { ActivityCategoryDbToUiPipe } from '../../../../../../shared/pipes/activity-category-db-to-ui.pipe';
import { DurationIsoToMmSsPipe } from '../../../../../../shared/pipes/duration-iso-to-mm-ss.pipe';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-training-session-details',
    templateUrl: './training-session-details.component.html',
    styleUrls: ['./training-session-details.component.scss'],
    standalone: true,
    imports: [MatExpansionModule, MatIconModule, DurationIsoToMmSsPipe, ActivityCategoryDbToUiPipe, MuscleGroupDbToUiPipe, ComplexityDbToUiPipe, IntensityDbToUiPipe]
})
export class TrainingSessionDetailsComponent implements OnInit {

  @Input() trainingSessionData!: CanonicalTrainingSession | PlanSessionFragment | PersonalSessionFragment;
  @ViewChild('expansionPanel') expansionPanel!: MatExpansionPanel;

  intensityValue!: number;
  complexityValue!: number;


  TAGS_TITLE_VALUE = GlobalFieldValues.TAGS;
  
  constructor() { }

  ngOnInit(): void {
    this.setIntensityAndComplexityValues();
  }

  // Only use average values if sufficient ratings to produce a meaningful average
  private setIntensityAndComplexityValues() {
    if(this.trainingSessionData[TrainingSessionKeys.INTENSITY_RATING_COUNT] > 20) {
      this.intensityValue = this.trainingSessionData[TrainingSessionKeys.INTENSITY_AVERAGE]
    } else {
      this.intensityValue = this.trainingSessionData[TrainingSessionKeys.INTENSITY_DEFAULT]
    }

    if(this.trainingSessionData[TrainingSessionKeys.COMPLEXITY_RATING_COUNT] > 20) {
      this.complexityValue = this.trainingSessionData[TrainingSessionKeys.COMPLEXITY_AVERAGE]
    } else {
      this.complexityValue = this.trainingSessionData[TrainingSessionKeys.COMPLEXITY_DEFAULT]
    }
  }
 
}
