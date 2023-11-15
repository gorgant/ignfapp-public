import { Component, Input, OnDestroy, OnInit, Signal, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, Observable, Subscription, tap } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { AddTrainingSessionUrlParams, AddTrainingSessionUrlParamsKeys } from 'shared-models/train/training-plan.model';
import { TrainingSessionFilterFormKeys, TrainingSessionKeys, ViewTrainingSessionsUrlParamsKeys } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { TrainingSessionFiltersComponent } from '../training-session-filters/training-session-filters.component';

@Component({
  selector: 'app-browse-training-sessions',
  templateUrl: './browse-training-sessions.component.html',
  styleUrls: ['./browse-training-sessions.component.scss']
})
export class BrowseTrainingSessionsComponent implements OnInit, OnDestroy {

  @Input() $trainingPlanBuilderRequest!: Signal<boolean>;
  $trainingSessionCardHeight = signal(356);
  
  userData$!: Observable<PublicUser | null>;

  ADD_SESSION_TO_PLAN_HEADER_VALUE = GlobalFieldValues.ADD_SESSION_TO_PLAN;
  CREATE_SESSION_BUTTON_VALUE = GlobalFieldValues.CREATE_SESSION;
  RETURN_TO_EDIT_PLAN_BUTTON_VALUE = GlobalFieldValues.RETURN_TO_EDIT_PLAN;
  SEARCH_VIDEO_OR_CHANNEL_TITLE_PLACEHOLDER = GlobalFieldValues.SEARCH_VIDEO_OR_CHANNEL_TITLE;

  fetchAllTrainingSessionsProcessing$!: Observable<boolean>;
  
  @ViewChild('trainingSessionFilters') trainingSessionFiltersComponent!: TrainingSessionFiltersComponent;

  searchText = ''; // Used in template for ngModel

  $showFilters = signal(false);
  $filtersActive = signal(false);
  $filterMonitorInitialized = signal(false);
  
  trainingSessionFilterFormSubscription!: Subscription;

  private router = inject(Router);
  private store$ = inject(Store);
  private route = inject(ActivatedRoute);

  constructor() { }

  ngOnInit(): void {
    this.monitorProcesses();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData);
    this.fetchAllTrainingSessionsProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchAllTrainingSessionsProcessing);
  }

  onCreateTrainingSession() {
    this.router.navigate([PublicAppRoutes.BUILD_NEW_TRAINING_SESSION]);
  }

  // Indicate in URL that this is a planbuilder request
  private generatePlanBuilderQueryParams() {
    const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_ID) as string;
    const queryParams: AddTrainingSessionUrlParams = {
      [AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: true,
      [AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_ID]: trainingPlanId,
      [ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS]: true
    }
    return queryParams
  }

  onToggleFilters() {
    this.$showFilters.set(!this.$showFilters());
    this.monitorFiltersActive();
  }

  onClearFilters() {
    this.trainingSessionFiltersComponent.trainingSessionFilterForm.patchValue({
      [TrainingSessionFilterFormKeys.ACTIVITY_CATEGORY_FILTER_ARRAY]: [],
      [TrainingSessionFilterFormKeys.COMPLEXITY_FILTER_ARRAY]: [],
      [TrainingSessionKeys.EQUIPMENT]: [],
      [TrainingSessionFilterFormKeys.INTENSITY_FILTER_ARRAY]: [],
      [TrainingSessionFilterFormKeys.MUSCLE_GROUP_FILTER_ARRAY]: [],
    });
    this.$showFilters.set(!this.$showFilters());
  }

  onApplyFilters() {
    this.$showFilters.set(false);
  }

  onReturnToEditPlan() {
    const queryParams = this.generatePlanBuilderQueryParams();
    if (queryParams[AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_ID]) {
      this.router.navigate([PublicAppRoutes.BUILD_EDIT_TRAINING_PLAN, queryParams.trainingPlanId]);
    } else {
      // const queryParams: ViewTrainingSessionsUlrParams = {
      //   [ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS]: true, // Ensures the user views training sessions vs plans
      // };
      // const navigationExtras: NavigationExtras = {queryParams};
      // this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
      this.router.navigate([PublicAppRoutes.BROWSE]); // Handles a situation where the navigation params are incomplete
    }
  }

  // Used to highlight the filters icon
  private monitorFiltersActive() {
    if (!this.$filterMonitorInitialized()) {
      this.$filterMonitorInitialized.set(true);
      this.trainingSessionFilterFormSubscription = this.trainingSessionFiltersComponent.trainingSessionFilterForm.valueChanges
        .pipe(
          distinctUntilChanged(),
          tap(filterForm => {
            const activityCategoryFilterHasValue = this.trainingSessionFiltersComponent.activityCategoryFilterArray.value.length > 0;
            const complexityFilterHasValue = this.trainingSessionFiltersComponent.complexityFilterArray.value.length > 0;
            const equipmentFilterHasValue = this.trainingSessionFiltersComponent.equipmentFilterArray.value.length > 0;
            const intensityFilterHasValue = this.trainingSessionFiltersComponent.intensityFilterArray.value.length > 0;
            const muscleGroupFilterHasValue = this.trainingSessionFiltersComponent.muscleGroupFilterArray.value.length > 0;
            const anyFilterActive = activityCategoryFilterHasValue || complexityFilterHasValue || equipmentFilterHasValue || intensityFilterHasValue || muscleGroupFilterHasValue;
            if (anyFilterActive) {
              this.$filtersActive.set(true);
              console.log('Marking filters active');
            } else {
              this.$filtersActive.set(false);
              console.log('Marking filters inactive');
            }  
          })
        ).subscribe();
    }
  }

  ngOnDestroy(): void {
    this.trainingSessionFilterFormSubscription?.unsubscribe();
  }

}
