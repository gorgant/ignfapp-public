import { Component, Input, OnDestroy, OnInit, Signal, inject, input, signal, viewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, Observable, Subscription, tap } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { AddTrainingSessionUrlToPlanParamsKeys, TrainingPlanKeys, TrainingPlanVisibilityCategoryDbOption, ViewTrainingPlanQueryParams, ViewTrainingPlanQueryParamsKeys } from 'shared-models/train/training-plan.model';
import { TrainingSessionFilterFormKeys, TrainingSessionKeys } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { TrainingSessionFiltersComponent } from '../training-session-filters/training-session-filters.component';
import { NgClass, AsyncPipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProcessingSpinnerComponent } from 'src/app/shared/components/processing-spinner/processing-spinner.component';
import { TrainingSessionCardComponent } from 'src/app/shared/components/training-session-card/training-session-card.component';
import { TrainingSessionSearchFilterPipe } from 'src/app/shared/pipes/training-session-search-filter.pipe';

@Component({
    selector: 'app-browse-training-sessions',
    templateUrl: './browse-training-sessions.component.html',
    styleUrls: ['./browse-training-sessions.component.scss'],
    imports: [MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, FormsModule, NgClass, TrainingSessionFiltersComponent, ProcessingSpinnerComponent, TrainingSessionCardComponent, AsyncPipe, TrainingSessionSearchFilterPipe]
})
export class BrowseTrainingSessionsComponent implements OnInit, OnDestroy {

  $trainingPlanBuilderRequest = input.required<boolean>();
  
  userData$!: Observable<PublicUser | null>;

  ADD_SESSION_TO_PLAN_HEADER_VALUE = GlobalFieldValues.ADD_SESSION_TO_PLAN;
  CREATE_SESSION_BUTTON_VALUE = GlobalFieldValues.CREATE_SESSION;
  NO_TRAINING_SESSIONS_FOUND_BLURB = GlobalFieldValues.NO_TRAINING_SESSIONS;
  RETURN_TO_EDIT_PLAN_BUTTON_VALUE = GlobalFieldValues.RETURN_TO_EDIT_PLAN;
  SEARCH_VIDEO_OR_CHANNEL_TITLE_PLACEHOLDER = GlobalFieldValues.SEARCH_VIDEO_OR_CHANNEL_TITLE;

  fetchAllTrainingSessionsProcessing$!: Observable<boolean>;
  fetchAllTrainingSessionsError$!: Observable<{} | null>;
  
  private $trainingSessionFiltersComponent = viewChild.required<TrainingSessionFiltersComponent>('trainingSessionFiltersComponent');

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
    const test = this.$trainingPlanBuilderRequest();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData);
    this.fetchAllTrainingSessionsProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchAllTrainingSessionsProcessing);
    this.fetchAllTrainingSessionsError$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchAllTrainingSessionsError);
  }

  onCreateTrainingSession() {
    this.router.navigate([PublicAppRoutes.BUILD_NEW_TRAINING_SESSION]);
  }

  onToggleFilters() {
    this.$showFilters.set(!this.$showFilters());
    this.monitorFiltersActive();
  }

  onClearFilters() {
    this.$trainingSessionFiltersComponent().trainingSessionFilterForm.patchValue({
      [TrainingSessionFilterFormKeys.ACTIVITY_CATEGORY_FILTER_ARRAY]: [],
      [TrainingSessionFilterFormKeys.COMPLEXITY_FILTER_ARRAY]: [],
      [TrainingSessionKeys.EQUIPMENT]: null,
      [TrainingSessionFilterFormKeys.INTENSITY_FILTER_ARRAY]: [],
      [TrainingSessionFilterFormKeys.MUSCLE_GROUP_FILTER_ARRAY]: [],
    });
    // This removes the selected animation from the toggle group
    const equipmentToggleGroup = this.$trainingSessionFiltersComponent().$equipmentToggleGroup();
    if (equipmentToggleGroup) {
      equipmentToggleGroup.value = null; // Reset the button toggle group
      equipmentToggleGroup._buttonToggles.forEach(toggle => {
        toggle.checked = false; // Ensure each toggle button is unchecked
      });
    }
    this.$showFilters.set(!this.$showFilters());
  }

  onApplyFilters() {
    this.$showFilters.set(false);
  }

  onReturnToEditPlan() {
    const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_ID) as string;
    const visibilityCategory = this.route.snapshot.queryParamMap.get(TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY) as TrainingPlanVisibilityCategoryDbOption | undefined;

    if (trainingPlanId && visibilityCategory) {
      const queryParams: ViewTrainingPlanQueryParams = {
        [ViewTrainingPlanQueryParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: visibilityCategory!,
        [ViewTrainingPlanQueryParamsKeys.TRAINING_PLAN_ID]: trainingPlanId
      };
      const navigationExtras: NavigationExtras = { queryParams };
      this.router.navigate([PublicAppRoutes.BUILD_EDIT_TRAINING_PLAN, trainingPlanId], navigationExtras);
    } else {
      console.log('Missing trainingPlanId or visibilityCategory, routing to browse instead');
      this.router.navigate([PublicAppRoutes.BROWSE]); // Handles a situation where the navigation params are incomplete
    }
  }

  // Used to highlight the filters icon
  private monitorFiltersActive() {
    if (!this.$filterMonitorInitialized()) {
      this.$filterMonitorInitialized.set(true);
      this.trainingSessionFilterFormSubscription = this.$trainingSessionFiltersComponent().trainingSessionFilterForm.valueChanges
        .pipe(
          distinctUntilChanged(),
          tap(filterForm => {
            const activityCategoryFilterHasValue = this.$trainingSessionFiltersComponent().activityCategoryFilterArray.value.length > 0;
            const complexityFilterHasValue = this.$trainingSessionFiltersComponent().complexityFilterArray.value.length > 0;
            const equipmentFilterHasValue = (this.$trainingSessionFiltersComponent().equipmentFilterArray.value?.length ?? 0) > 0;
            const intensityFilterHasValue = this.$trainingSessionFiltersComponent().intensityFilterArray.value.length > 0;
            const muscleGroupFilterHasValue = this.$trainingSessionFiltersComponent().muscleGroupFilterArray.value.length > 0;
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
