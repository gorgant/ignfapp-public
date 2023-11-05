import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, filter, map, Observable, switchMap, throwError, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { TrainingPlan } from 'shared-models/train/training-plan.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
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

  allTrainingPlansFetched$!: Observable<boolean>;
  trainingPlans$!: Observable<TrainingPlan[]>;
  fetchAllTrainingPlansProcessing$!: Observable<boolean>;
  fetchAllTrainingPlansError$!: Observable<{} | null>;
  private $trainingPlansRequested = signal(false);

  searchText = ''; // Used in template for ngModel

  private router = inject(Router);
  private store$ = inject(Store);
  private uiService = inject(UiService);

  constructor() { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.fetchAllTrainingPlans();
  }

  private monitorProcesses() {
    this.allTrainingPlansFetched$ = this.store$.select(TrainingPlanStoreSelectors.selectAllTrainingPlansFetched); // We use this to determine if the initial empty array returned when the store is fetched is a pre-loaded state or the actual state
    this.fetchAllTrainingPlansError$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchAllTrainingPlansError);
    this.fetchAllTrainingPlansProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchAllTrainingPlansProcessing);
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData);
  }

  private fetchAllTrainingPlans() {
    this.trainingPlans$ = this.fetchAllTrainingPlansError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.$trainingPlansRequested.set(false);
          }
          const trainingPlansInStore$ = this.store$.select(TrainingPlanStoreSelectors.selectAllTrainingPlansInStore);
          return trainingPlansInStore$;
        }),
        withLatestFrom(this.fetchAllTrainingPlansError$, this.allTrainingPlansFetched$),
        filter(([trainingPlans, processingError, allFetched]) => !processingError),
        map(([trainingPlans, processingError, allFetched]) => {
          if (!allFetched && !this.$trainingPlansRequested()) {
            this.store$.dispatch(TrainingPlanStoreActions.fetchAllTrainingPlansRequested());
            this.$trainingPlansRequested.set(true);
          }
          return trainingPlans;
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.$trainingPlansRequested.set(false);
          return throwError(() => new Error(error));
        })
      );
  }

  onCreatePlan() {
    this.router.navigate([PublicAppRoutes.TRAINING_PLAN_NEW]);
  }


  onSelectTrainingPlan(trainingPlanData: TrainingPlan) {
    this.router.navigate([`${PublicAppRoutes.TRAINING_PLAN}`, trainingPlanData.id]);
  }



}
