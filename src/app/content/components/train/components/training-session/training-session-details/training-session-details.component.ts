import { Component, Input, OnInit, ViewChild, signal } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PersonalSessionFragment } from 'shared-models/train/personal-session-fragment.model';
import { PlanSessionFragment } from 'shared-models/train/plan-session-fragment.model';
import { CanonicalTrainingSession, TrainingSessionKeys } from 'shared-models/train/training-session.model';

@Component({
  selector: 'app-training-session-details',
  templateUrl: './training-session-details.component.html',
  styleUrls: ['./training-session-details.component.scss']
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
