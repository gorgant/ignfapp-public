import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, filter, map, Observable, Subscription, switchMap, take, tap, throwError, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { TrainingPlan, TrainingPlanKeys, ViewTrainingPlanQueryParams, ViewTrainingPlanQueryParamsKeys } from 'shared-models/train/training-plan.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { TrainingPlanStoreActions, TrainingPlanStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { AsyncPipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { ProcessingSpinnerComponent } from 'src/app/shared/components/processing-spinner/processing-spinner.component';
import { TrainingPlanCardComponent } from 'src/app/shared/components/training-plan-card/training-plan-card.component';
import { TrainingPlanSearchFilterPipe } from 'src/app/shared/pipes/training-plan-search-filter.pipe';

@Component({
    selector: 'app-browse-training-plans',
    templateUrl: './browse-training-plans.component.html',
    styleUrls: ['./browse-training-plans.component.scss'],
    imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, ReactiveFormsModule, FormsModule, ProcessingSpinnerComponent, TrainingPlanCardComponent, AsyncPipe, TrainingPlanSearchFilterPipe]
})
export class BrowseTrainingPlansComponent implements OnInit, OnDestroy {

  CREATE_PLAN_BUTTON_VALUE = GlobalFieldValues.CREATE_PLAN;
  SEARCH_PLAN_OR_CHANNEL_TITLE_PLACEHOLDER = GlobalFieldValues.SEARCH_PLAN_OR_CHANNEL_TITLE;
  NO_TRAINING_PLANS_FOUND_BLURB = GlobalFieldValues.NO_TRAINING_PLANS;

  userData$!: Observable<PublicUser | null>;

  private $fetchTrainingPlansSubmitted = signal(false);
  $localTrainingPlans = signal([] as TrainingPlan[]);
  private allTrainingPlansFetched$!: Observable<boolean>;
  fetchAllTrainingPlansError$!: Observable<{} | null>;
  fetchAllTrainingPlansProcessing$!: Observable<boolean>;
  private trainingPlansSubscription!: Subscription;

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
    this.trainingPlansSubscription = this.fetchAllTrainingPlansError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetComponentState();
          }
          const trainingPlansInStore$ = this.store$.select(TrainingPlanStoreSelectors.selectAllTrainingPlansInStore);
          return trainingPlansInStore$;
        }),
        withLatestFrom(this.fetchAllTrainingPlansError$, this.allTrainingPlansFetched$, this.userData$),
        filter(([trainingPlans, processingError, allFetched, userData]) => !processingError),
        map(([trainingPlans, processingError, allFetched, userData]) => {
          if (!allFetched && !this.$fetchTrainingPlansSubmitted()) {
            this.store$.dispatch(TrainingPlanStoreActions.fetchAllTrainingPlansRequested({userId: userData!.id}));
            this.$fetchTrainingPlansSubmitted.set(true);
          }
          return trainingPlans;
        }),
        withLatestFrom(this.allTrainingPlansFetched$),
        filter(([trainingPlans, allFetched]) => allFetched),
        tap(([trainingPlans, allFetched]) => {
          console.log('Set trainingPlans', trainingPlans);
          this.$localTrainingPlans.set(trainingPlans);
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetComponentState();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetComponentState() {
    this.trainingPlansSubscription?.unsubscribe();
    this.$fetchTrainingPlansSubmitted.set(false);
  }

  onCreatePlan() {
    this.router.navigate([PublicAppRoutes.BUILD_NEW_TRAINING_PLAN]);
  }


  onSelectTrainingPlan(trainingPlanData: TrainingPlan) {
    const queryParams: ViewTrainingPlanQueryParams = {
      [ViewTrainingPlanQueryParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: trainingPlanData[TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY], // Ensures the user views training sessions vs plans
    };
    const navigationExtras: NavigationExtras = {queryParams};
    this.router.navigate([PublicAppRoutes.TRAIN_TRAINING_PLAN, trainingPlanData.id], navigationExtras);
  }

  ngOnDestroy(): void {
    this.trainingPlansSubscription?.unsubscribe();

    this.fetchAllTrainingPlansError$
      .pipe(
        take(1),
        tap(error => {
          if (error) {
            this.store$.dispatch(TrainingPlanStoreActions.purgeTrainingPlanErrors());
          }
        })
      ).subscribe();
  }

}
