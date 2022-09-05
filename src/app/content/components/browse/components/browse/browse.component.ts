import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { AddTrainingPlanUrlParamsKeys } from 'shared-models/train/training-plan.model';
import { ViewTrainingSessionsUlrParams, ViewTrainingSessionsUrlParamsKeys } from 'shared-models/train/training-session.model';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss']
})
export class BrowseComponent implements OnInit, AfterViewInit {

  trainingSessionsTabActive!: boolean;
  trainingPlanBuilderRequest!: boolean;
  
  PLANS_TAB_VALUE = GlobalFieldValues.PLANS;
  SESSIONS_TAB_VALUE = GlobalFieldValues.SESSIONS;

  @ViewChild('matTabGroup') matTabGroup!: MatTabGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.checkForAdditionalUrlParams();
  }
  
  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.addParamsIfViewingSessions();
    
  }

  private checkForAdditionalUrlParams() {
    const addTrainingSessionString = this.route.snapshot.queryParamMap.get(AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST);
    const viewTrainingSessionsString = this.route.snapshot.queryParamMap.get(ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS);
    if (addTrainingSessionString) {
      const addTrainingSession = JSON.parse(addTrainingSessionString) as boolean; // Convert string to boolean for proper error detection
      if (addTrainingSession) {
        console.log('Plan builder request detected');
        this.trainingSessionsTabActive = true;
        this.trainingPlanBuilderRequest = true;
      }
    }
    if (viewTrainingSessionsString) {
      const viewTrainingSessions = JSON.parse(viewTrainingSessionsString) as boolean; // Convert string to boolean for proper error detection
      if (viewTrainingSessions) {
        this.trainingSessionsTabActive = true;
      }
    }
  }

  // Ensures if the user views a session and then goes back it will load sessions rather than plan tab
  private addParamsIfViewingSessions() {
    
    this.matTabGroup.focusChange.subscribe(changeEvent => {
      console.log('Change event tab index', changeEvent.index);
      const addTrainingSessionString = this.route.snapshot.queryParamMap.get(AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST);
      const viewTrainingSessionsString = this.route.snapshot.queryParamMap.get(ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS);
      const newIndex = changeEvent.index;
      
      // Param logic courtesy of https://stackoverflow.com/a/43706998/6572208
      // If on the training session index, add the viewTrainingSessions query param if it doesn't already exist and it isn't an addTrainingSession builder request
      if (newIndex == 1) {
        // Add query param if it doesn't exist
        if (!viewTrainingSessionsString && !addTrainingSessionString) {
          console.log('Adding viewTrainingSessions query param');
          const queryParams: ViewTrainingSessionsUlrParams = {
            [ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS]: true,
          };
          const navigationExtras: NavigationExtras = {
            queryParams,
            relativeTo: this.route,
            queryParamsHandling: 'merge',
            replaceUrl: true
          };
          this.router.navigate([], navigationExtras);
        }
      }

      if (newIndex == 0) {
        // Remove the query param if exists
        if (viewTrainingSessionsString && !addTrainingSessionString) {
          console.log('Removing viewTrainingSessions query param');
          const queryParams: ViewTrainingSessionsUlrParams = {
            [ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS]: null,
          };
          const navigationExtras: NavigationExtras = {
            queryParams,
            relativeTo: this.route,
            queryParamsHandling: 'merge',
            replaceUrl: true
          };
          this.router.navigate([], navigationExtras);
        }
      }

      
    })
    
  }

}
