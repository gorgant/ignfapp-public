import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { TrainingSession, TrainingSessionFilterFormKeys, TrainingSessionKeys } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { RootStoreState, TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { TrainingSessionFiltersComponent } from '../training-session-filters/training-session-filters.component';

@Component({
  selector: 'app-browse-training-sessions',
  templateUrl: './browse-training-sessions.component.html',
  styleUrls: ['./browse-training-sessions.component.scss']
})
export class BrowseTrainingSessionsComponent implements OnInit, OnDestroy {

  userData$!: Observable<PublicUser | null>;

  CREATE_SESSION_BUTTON_VALUE = GlobalFieldValues.CREATE_SESSION;
  SEARCH_VIDEO_OR_CHANNEL_TITLE_PLACEHOLDER = GlobalFieldValues.SEARCH_VIDEO_OR_CHANNEL_TITLE;

  fetchAllTrainingSesssionsProcessing$!: Observable<boolean>;
  trainingSessionsSubscription!: Subscription;
  
  @ViewChild('trainingSessionFilters') trainingSessionFiltersComponent!: TrainingSessionFiltersComponent;

  searchText = ''; // Used in template for ngModel

  showFilters = false;
  filtersActive = false;
  filterMonitorInitialized = false;
  
  trainingSessionFilterFormSubscription!: Subscription;

  constructor(
    private router: Router,
    private store$: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit(): void {
    this.monitorProcesses();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectUserData);
    this.fetchAllTrainingSesssionsProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchAllTrainingSessionsProcessing);
  }

  onCreateSession() {
    this.router.navigate([PublicAppRoutes.TRAINING_SESSION_NEW]);
  }

  onSelectTrainingSession(sessionData: TrainingSession) {
    this.router.navigate([`${PublicAppRoutes.TRAINING_SESSION}/${sessionData.id}`]);
  }

  onToggleFilters() {
    this.showFilters = !this.showFilters;
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
    this.showFilters = !this.showFilters;
  }

  onApplyFilters() {
    this.showFilters = false;
  }

  // Used to highlight the filters icon
  private monitorFiltersActive() {
    if (!this.filterMonitorInitialized) {
      this.filterMonitorInitialized = true;
      this.trainingSessionFilterFormSubscription = this.trainingSessionFiltersComponent.trainingSessionFilterForm.valueChanges
        .pipe(distinctUntilChanged())
        .subscribe(filterForm => {
          const activityCategoryFilterHasValue = this.trainingSessionFiltersComponent.activityCategoryFilterArray.value.length > 0;
          const complexityFilterHasValue = this.trainingSessionFiltersComponent.complexityFilterArray.value.length > 0;
          const equipmentFilterHasValue = this.trainingSessionFiltersComponent.equipmentFilterArray.value.length > 0;
          const intensityFilterHasValue = this.trainingSessionFiltersComponent.intensityFilterArray.value.length > 0;
          const muscleGroupFilterHasValue = this.trainingSessionFiltersComponent.muscleGroupFilterArray.value.length > 0;
          const anyFilterActive = activityCategoryFilterHasValue || complexityFilterHasValue || equipmentFilterHasValue || intensityFilterHasValue || muscleGroupFilterHasValue;
          if (anyFilterActive) {
            this.filtersActive = true;
            console.log('Marking filters active');
          } else {
            this.filtersActive = false;
            console.log('Marking filters inactive');
          }
        })
    }
  }

  ngOnDestroy(): void {
    if (this.trainingSessionFilterFormSubscription) {
      this.trainingSessionFilterFormSubscription.unsubscribe();
    }

    if (this.trainingSessionsSubscription) {
      this.trainingSessionsSubscription.unsubscribe();
    }
  }

}
