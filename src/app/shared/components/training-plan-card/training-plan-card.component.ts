import { Component, Input, OnInit } from '@angular/core';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicImagePaths } from 'shared-models/routes-and-paths/image-paths.model';
import { TrainingPlan } from 'shared-models/train/training-plan.model';

@Component({
    selector: 'app-training-plan-card',
    templateUrl: './training-plan-card.component.html',
    styleUrls: ['./training-plan-card.component.scss'],
    standalone: true
})
export class TrainingPlanCardComponent implements OnInit {

  @Input() trainingPlanData!: TrainingPlan; 

  TRAINING_SESSIONS_SUBTEXT = GlobalFieldValues.TRAINING_SESSIONS;

  PLACEHOLDER_PLAN_THUMBNAIL = PublicImagePaths.DEFAULT_TRAINING_PLAN_IMAGE_LARGE;

  constructor() { }

  ngOnInit(): void {
  }

}
