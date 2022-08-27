import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { TrainingPlan } from 'shared-models/train/training-plan.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { RootStoreState, TrainingPlanStoreActions, TrainingPlanStoreSelectors, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-browse-training-plans',
  templateUrl: './browse-training-plans.component.html',
  styleUrls: ['./browse-training-plans.component.scss']
})
export class BrowseTrainingPlansComponent implements OnInit {

  CREATE_PLAN_BUTTON_VALUE = GlobalFieldValues.CREATE_PLAN;
  SEARCH_PLAN_OR_CHANNEL_TITLE_PLACEHOLDER = GlobalFieldValues.SEARCH_PLAN_OR_CHANNEL_TITLE;

  userData$!: Observable<PublicUser | null>;

  trainingPlanCardHeight = 300;

  trainingPlans$!: Observable<TrainingPlan[]>;
  fetchAllTrainingPlansProcessing$!: Observable<boolean>;
  fetchAllTrainingSesssionsError$!: Observable<{} | null>;

  searchText = ''; // Used in template for ngModel

  constructor(
    private router: Router,
    private store$: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.fetchAllTrainingPlans();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectUserData);
    this.fetchAllTrainingPlansProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchAllTrainingPlansProcessing);
    this.fetchAllTrainingSesssionsError$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchAllTrainingPlansError);
  }

  private fetchAllTrainingPlans() {
    this.trainingPlans$ = this.store$.select(TrainingPlanStoreSelectors.selectAllTrainingPlansInStore)
      .pipe(
        withLatestFrom(
          this.fetchAllTrainingPlansProcessing$,
          this.fetchAllTrainingSesssionsError$,
          this.store$.select(TrainingPlanStoreSelectors.selectAllTrainingPlansFetched),
        ),
        map(([trainingPlans, loadingPlans, loadError, allPlansFetched]) => {
          if (loadError) {
            console.log('Error loading training sessions in component', loadError);
          }
  
          // Check if sessions are loaded, if not fetch from server
          if (!loadingPlans && !allPlansFetched) {
            this.store$.dispatch(TrainingPlanStoreActions.fetchAllTrainingPlansRequested());
          }
          return trainingPlans;
        })
      )
  }

  onCreatePlan() {
    this.router.navigate([PublicAppRoutes.TRAINING_PLAN_NEW]);
  }


  onSelectTrainingPlan(trainingPlanData: TrainingPlan) {
    this.router.navigate([`${PublicAppRoutes.TRAINING_PLAN}`, trainingPlanData.id]);
  }



}
