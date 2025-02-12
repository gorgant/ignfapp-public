import { AfterViewInit, Component, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Subscription, map } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { AddTrainingSessionUrlToPlanParamsKeys } from 'shared-models/train/training-plan.model';
import { BrowseTrainingSessionsQueryParams, BrowseTrainingSessionsQueryParamsKeys } from 'shared-models/train/training-session.model';
import { BrowseTrainingSessionsComponent } from './browse-training-sessions/browse-training-sessions.component';
import { BrowseTrainingPlansComponent } from './browse-training-plans/browse-training-plans.component';

@Component({
    selector: 'app-browse',
    templateUrl: './browse.component.html',
    styleUrls: ['./browse.component.scss'],
    imports: [MatTabsModule, BrowseTrainingPlansComponent, BrowseTrainingSessionsComponent]
})
export class BrowseComponent implements OnInit, AfterViewInit, OnDestroy {

  private $matTabGroup = viewChild.required<MatTabGroup>('matTabGroup');

  PLANS_TAB_VALUE = GlobalFieldValues.PLANS;
  SESSIONS_TAB_VALUE = GlobalFieldValues.SESSIONS;

  $trainingSessionsTabActive = signal(false);
  $trainingPlanBuilderRequest = signal(false);
  
  private queryParamMapSubscription!: Subscription;

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() { }

  ngOnInit(): void {
    this.monitorUrlForAdditionalUrlParams();
  }
  
  ngAfterViewInit(): void {
    this.addParamsIfViewingSessions();
    
  }

  private monitorUrlForAdditionalUrlParams() {

    // Subscribe to observable vs snapshot bc URL can change without route change
    this.queryParamMapSubscription = this.route.queryParamMap
      .pipe(
        map((paramMap) => {
          const planBuilderParam = paramMap.get(AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_BUILDER_REQUEST);
          const viewTrainingSessionsValue = paramMap.get(BrowseTrainingSessionsQueryParamsKeys.VIEW_TRAINING_SESSIONS);
          if (planBuilderParam && JSON.parse(planBuilderParam)) {
            console.log('Plan builder request detected');
            this.$trainingPlanBuilderRequest.set(true);
          } else {
            this.$trainingPlanBuilderRequest.set(false);
          }
          if (viewTrainingSessionsValue && JSON.parse(viewTrainingSessionsValue)) {
            console.log('viewTrainingSessions param found, setting view to trainingSessions');
            this.$trainingSessionsTabActive.set(true);
          } else {
            console.log('No viewTrainingSessions param found, setting view to trainingPlans');
            this.$trainingSessionsTabActive.set(false);
          }
        })
      ).subscribe();
  }

  // Ensures if the user views a session and then goes back it will load sessions rather than plan tab
  private addParamsIfViewingSessions() {
    
    this.$matTabGroup().focusChange.subscribe(changeEvent => {
      console.log('Change event tab index', changeEvent.index);
      const addTrainingSessionString = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_BUILDER_REQUEST);
      const viewTrainingSessionsString = this.route.snapshot.queryParamMap.get(BrowseTrainingSessionsQueryParamsKeys.VIEW_TRAINING_SESSIONS);
      const newIndex = changeEvent.index;
      
      // Param logic courtesy of https://stackoverflow.com/a/43706998/6572208
      // If on the training session index, add the viewTrainingSessions query param if it doesn't already exist and it isn't an addTrainingSession builder request
      if (newIndex == 1) {
        // Add query param if it doesn't exist
        if (!viewTrainingSessionsString && !addTrainingSessionString) {
          console.log('Adding viewTrainingSessions query param');
          const queryParams: BrowseTrainingSessionsQueryParams = {
            [BrowseTrainingSessionsQueryParamsKeys.VIEW_TRAINING_SESSIONS]: true,
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
          const queryParams: BrowseTrainingSessionsQueryParams = {
            [BrowseTrainingSessionsQueryParamsKeys.VIEW_TRAINING_SESSIONS]: null,
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

  ngOnDestroy(): void {
    this.queryParamMapSubscription?.unsubscribe();
  }

}
