import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { AddTrainingPlanUrlParamsKeys } from 'shared-models/train/training-plan.model';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss']
})
export class BrowseComponent implements OnInit {

  trainingSessionsTabActive!: boolean;
  trainingPlanBuilderRequest!: boolean;
  
  PLANS_TAB_VALUE = GlobalFieldValues.PLANS;
  SESSIONS_TAB_VALUE = GlobalFieldValues.SESSIONS;

  constructor(
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.checkForAddSessionRequest();    
  }

  private checkForAddSessionRequest() {
    const addTrainingSessionString = this.route.snapshot.queryParamMap.get(AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST);
    if (addTrainingSessionString) {
      const addTrainingSession = JSON.parse(addTrainingSessionString) as boolean;
      if (addTrainingSession) {
        console.log('Plan builder request detected');
        this.trainingSessionsTabActive = true;
        this.trainingPlanBuilderRequest = true;
      }
    }
  }

}
