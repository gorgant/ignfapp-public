import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatButtonToggle, MatButtonToggleChange, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, Observable, Subscription, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingSessionActivityCategoryObject, TrainingSessionActivityCategoryList, TrainingSessionActivityCategoryDbOption } from 'shared-models/train/activity-category.model';
import { TrainingSessionMuscleGroupObject, TrainingSessionMuscleGroupList, TrainingSessionMuscleGroupDbOption } from 'shared-models/train/muscle-group.model';
import { TrainingSessionComplexityObject, TrainingSessionComplexityList, TrainingSessionComplexityDbOption } from 'shared-models/train/training-complexity.model';
import { TrainingSessionIntensityObject, TrainingSessionIntensityList, TrainingSessionIntensityDbOption } from 'shared-models/train/training-intensity.model';
import { TrainingSession, TrainingSessionFilterForm, TrainingSessionFilterFormKeys, TrainingSessionKeys } from 'shared-models/train/training-session.model';
import { RootStoreState, TrainingSessionStoreActions, TrainingSessionStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-training-session-filters',
  templateUrl: './training-session-filters.component.html',
  styleUrls: ['./training-session-filters.component.scss']
})
export class TrainingSessionFiltersComponent implements OnInit, OnDestroy {

  ACTIVITY_CATEGORY_FIELD_VALUE = GlobalFieldValues.ACTIVITY_CATEGORY;
  BODYWEIGHT_FIELD_VALUE = GlobalFieldValues.BODYWEIGHT;
  COMPLEXITY_FIELD_VALUE = GlobalFieldValues.COMPLEXITY;
  EQUIPMENT_FIELD_VALUE = GlobalFieldValues.EQUIPMENT;
  INTENSITY_FIELD_VALUE = GlobalFieldValues.INTENSITY;
  MUSCLE_GROUP_FIELD_VALUE = GlobalFieldValues.MUSCLE_GROUP;

  fetchAllTrainingSesssionsProcessing$!: Observable<boolean>;
  fetchAllTrainingSesssionsError$!: Observable<{} | null>;
  trainingSessionsSubscription!: Subscription;
  trainingSessionsLoaded!: boolean;

  unfilteredTrainingSessions!: TrainingSession[];
  filteredTrainingSessions!: TrainingSession[];
  filterTransitionContainer!: TrainingSession[];

  trainingSessionFilterForm = new FormGroup<TrainingSessionFilterForm>({
    [TrainingSessionFilterFormKeys.ACTIVITY_CATEGORY_FILTER_ARRAY]: new FormControl([]),
    [TrainingSessionFilterFormKeys.COMPLEXITY_FILTER_ARRAY]: new FormControl([]),
    [TrainingSessionKeys.EQUIPMENT]: new FormControl([]),
    [TrainingSessionFilterFormKeys.INTENSITY_FILTER_ARRAY]: new FormControl([]),
    [TrainingSessionFilterFormKeys.MUSCLE_GROUP_FILTER_ARRAY]: new FormControl([]),
  });

  trainingSessionActivityCategoryMasterList: TrainingSessionActivityCategoryObject[] = Object.values(TrainingSessionActivityCategoryList);
  trainingSessionComplexityMasterList: TrainingSessionComplexityObject[] = Object.values(TrainingSessionComplexityList);
  trainingSessionIntensityMasterList: TrainingSessionIntensityObject[] = Object.values(TrainingSessionIntensityList);
  trainingSessionMuscleGroupMasterList: TrainingSessionMuscleGroupObject[] = Object.values(TrainingSessionMuscleGroupList);

  trainingSessionFilterFormSubscription!: Subscription;

  constructor(
    private store$: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit(): void {
    this.monitorfilterChanges();
    this.fetchInitialTrainingSessionBatch();
  }

  private fetchInitialTrainingSessionBatch() {
    this.trainingSessionsSubscription = this.store$.select(TrainingSessionStoreSelectors.selectAllSessionsInStore)
      .pipe(
        withLatestFrom(
          this.store$.select(TrainingSessionStoreSelectors.selectFetchAllTrainingSessionsProcessing),
          this.store$.select(TrainingSessionStoreSelectors.selectFetchAllTrainingSessionsError),
          this.store$.select(TrainingSessionStoreSelectors.selectAllTrainingSessionsFetched),
        )
      )
      .subscribe(([trainingSessions, loadingSessions, loadError, allSessionsFetched]) => {
        if (loadError) {
          console.log('Error loading training sessions in component', loadError);
          this.trainingSessionsLoaded = false;
        }

        // Check if sessions are loaded, if not fetch from server
        if (!loadingSessions && !this.trainingSessionsLoaded && !allSessionsFetched) {
          this.store$.dispatch(TrainingSessionStoreActions.fetchAllTrainingSessionsRequested());
          this.trainingSessionsLoaded = true;
        }
        if (trainingSessions) {
          this.unfilteredTrainingSessions = trainingSessions;
          this.filteredTrainingSessions = trainingSessions;
        }
      })
  }

  private monitorfilterChanges() {
    this.trainingSessionFilterFormSubscription = this.trainingSessionFilterForm.valueChanges
      .pipe(
        distinctUntilChanged(),
      )
      .subscribe((value) => {

        if (this.complexityOnlyMinMaxValueSelected() || this.intensityOnlyMinMaxValueSelected() ) {
          return; // Exit function to prevent infinite loop since either one of these will trigger a new subscription value
        }

        this.filterTransitionContainer = this.unfilteredTrainingSessions; // Initialize with all sessions
        this.applyActivityCategoryFilter();
        this.applyComplexityFilter();
        this.applyEquipmentFilter();
        this.applyIntensityFilter();
        this.applyMuscleGroupFilter();
        this.filteredTrainingSessions = this.filterTransitionContainer;
      })

  }

  // Autofill moderate if both min and max are selected
  private complexityOnlyMinMaxValueSelected(): boolean {
    const complexityFilterArray = this.complexityFilterArray.value;
    const onlyMinAndMaxValueSelected = complexityFilterArray.includes(TrainingSessionComplexityDbOption.LOW_COMPLEXITY) && 
      complexityFilterArray.includes(TrainingSessionComplexityDbOption.HIGH_COMPLEXITY) &&
      !complexityFilterArray.includes(TrainingSessionComplexityDbOption.MODERATE_COMPLEXITY);

    if (onlyMinAndMaxValueSelected) {
      this.complexityFilterArray.setValue([
        TrainingSessionComplexityDbOption.LOW_COMPLEXITY,
        TrainingSessionComplexityDbOption.MODERATE_COMPLEXITY,
        TrainingSessionComplexityDbOption.HIGH_COMPLEXITY
      ]);
      return true;
    }
    return false;
  }

  // Autofill moderate if both min and max are selected
  private intensityOnlyMinMaxValueSelected(): boolean {
    const intensityFilterArray = this.intensityFilterArray.value;
    const onlyMinAndMaxValueSelected = intensityFilterArray.includes(TrainingSessionIntensityDbOption.LOW_INTENSITY) && 
      intensityFilterArray.includes(TrainingSessionIntensityDbOption.HIGH_INTENSITY) &&
      !intensityFilterArray.includes(TrainingSessionIntensityDbOption.MODERATE_INTENSITY);

    if (onlyMinAndMaxValueSelected) {
      this.intensityFilterArray.setValue([
        TrainingSessionIntensityDbOption.LOW_INTENSITY,
        TrainingSessionIntensityDbOption.MODERATE_INTENSITY,
        TrainingSessionIntensityDbOption.HIGH_INTENSITY
      ]);
      return true;
    }
    return false;
  }

  private applyActivityCategoryFilter() {
    const activityCategoryFilterArray = this.activityCategoryFilterArray.value;
    // Do nothing if no filter option selected
    if (activityCategoryFilterArray.length < 1) {
      return;
    }
    this.filterTransitionContainer = this.filterTransitionContainer.filter(session => {
      const sessionActivityCategoryArray = session.activityCategoryList;
      const hasMatchingActivityCategory = sessionActivityCategoryArray.some(category => {
        return activityCategoryFilterArray.includes(category);
      });
      return hasMatchingActivityCategory;
    })
  }

  private applyComplexityFilter() {
    const complexityFilterArray = this.complexityFilterArray.value;

    // Do nothing if no filter option selected
    if (complexityFilterArray.length < 1) {
      return;
    }
    let filterComplexityMin = TrainingSessionComplexityDbOption.HIGH_COMPLEXITY; // Start at max
    let filterComplexityMax = TrainingSessionComplexityDbOption.LOW_COMPLEXITY;

    complexityFilterArray.forEach(value => {
      switch (value) {
        case TrainingSessionComplexityDbOption.LOW_COMPLEXITY:
          filterComplexityMin = value < filterComplexityMin ? value : filterComplexityMin ;
          filterComplexityMax = value > filterComplexityMax ? value : filterComplexityMax ;
          break;          
        case TrainingSessionComplexityDbOption.MODERATE_COMPLEXITY:
          filterComplexityMin = value < filterComplexityMin ? value : filterComplexityMin ;
          filterComplexityMax = value > filterComplexityMax ? value : filterComplexityMax ;
          break;
        case TrainingSessionComplexityDbOption.HIGH_COMPLEXITY:
          filterComplexityMin = value < filterComplexityMin ? value : filterComplexityMin ;
          filterComplexityMax = value > filterComplexityMax ? value : filterComplexityMax ;
          break;
      }
    });

    // console.log(`Filtering complexity between ${filterComplexityMin} - ${filterComplexityMax} `);

    this.filterTransitionContainer = this.filterTransitionContainer.filter(session => {
      const roundedSessionComplexity = Math.round(session.complexityAverage);
      const withinFilterRange = filterComplexityMin <= roundedSessionComplexity && filterComplexityMax >= roundedSessionComplexity;
      return withinFilterRange;
    })
  }

  // TODO: See if we can give the equipment toggle boxes an accent color

  onEquipmentToggle(event: MatButtonToggleChange) {

    const fieldValueChangeArray: boolean[] = event.value; // This is an array of selected values

    // If no value selected, set form value to blank
    if (fieldValueChangeArray.length < 1) {
      this.equipmentFilterArray.setValue([]);
      return;
    }

    // Otherwise, set both form value and object value to the currently selected value (effectively deleting other previously selected values from the array to prevent multiple highlights)
    const toggleObject: MatButtonToggle | undefined = event.source; // Source will be undefined if deselected
    const currentToggleValue = toggleObject.value; // This will be blank if no value selected
    const toggleGroup = toggleObject.buttonToggleGroup;

    toggleGroup.value = [currentToggleValue];
    this.equipmentFilterArray.setValue([currentToggleValue]);

  }
  
  private applyEquipmentFilter() {
    const equipmentFilterArray = this.equipmentFilterArray.value;
    // Do nothing if no filter option selected
    if (equipmentFilterArray.length < 1) {
      return;
    }
    const equipmentFilterValue = this.equipmentFilterArray.value[0];
    this.filterTransitionContainer = this.filterTransitionContainer.filter(session => session.equipment === equipmentFilterValue);
  }

  private applyIntensityFilter() {
    const intensityFilterArray = this.intensityFilterArray.value;

    // Do nothing if no filter option selected
    if (intensityFilterArray.length < 1) {
      return;
    }
    let filterIntensityMin = TrainingSessionIntensityDbOption.HIGH_INTENSITY; // Start at max
    let filterIntensityMax = TrainingSessionIntensityDbOption.LOW_INTENSITY;

    intensityFilterArray.forEach(value => {
      switch (value) {
        case TrainingSessionIntensityDbOption.LOW_INTENSITY:
          filterIntensityMin = value < filterIntensityMin ? value : filterIntensityMin ;
          filterIntensityMax = value > filterIntensityMax ? value : filterIntensityMax ;
          break;          
        case TrainingSessionIntensityDbOption.MODERATE_INTENSITY:
          filterIntensityMin = value < filterIntensityMin ? value : filterIntensityMin ;
          filterIntensityMax = value > filterIntensityMax ? value : filterIntensityMax ;
          break;
        case TrainingSessionIntensityDbOption.HIGH_INTENSITY:
          filterIntensityMin = value < filterIntensityMin ? value : filterIntensityMin ;
          filterIntensityMax = value > filterIntensityMax ? value : filterIntensityMax ;
          break;
      }
    });

    // console.log(`Filtering intensity between ${filterIntensityMin} - ${filterIntensityMax} `);

    this.filterTransitionContainer = this.filterTransitionContainer.filter(session => {
      const roundedSessionIntensity = Math.round(session.intensityAverage);
      const withinFilterRange = filterIntensityMin <= roundedSessionIntensity && filterIntensityMax >= roundedSessionIntensity;
      return withinFilterRange;
    })
  }

  private applyMuscleGroupFilter() {
    const muscleGroupFilterArray = this.muscleGroupFilterArray.value;
    
    // Do nothing if no filter option selected
    if (muscleGroupFilterArray.length < 1) {
      return;
    }
    
    this.filterTransitionContainer = this.filterTransitionContainer.filter(session => {
      const sessionMuscleGroup = session.muscleGroup;
      return muscleGroupFilterArray.includes(sessionMuscleGroup);
    })
  }

  ngOnDestroy(): void {

    if (this.trainingSessionsSubscription) {
      this.trainingSessionsSubscription.unsubscribe();
    }

    if (this.trainingSessionFilterFormSubscription) {
      this.trainingSessionFilterFormSubscription.unsubscribe();
    }
    
  }

  // These getters are used for easy access in the HTML template
  get activityCategoryFilterArray() { return (this.trainingSessionFilterForm.get(TrainingSessionFilterFormKeys.ACTIVITY_CATEGORY_FILTER_ARRAY) as FormControl<TrainingSessionActivityCategoryDbOption[]>); } // Typed to eliminate formControl type error in HTML
  get complexityFilterArray() { return this.trainingSessionFilterForm.get(TrainingSessionFilterFormKeys.COMPLEXITY_FILTER_ARRAY) as FormControl<TrainingSessionComplexityDbOption[]>; }
  get equipmentFilterArray() { return this.trainingSessionFilterForm.get(TrainingSessionKeys.EQUIPMENT) as FormControl<boolean[]>; }
  get intensityFilterArray() { return this.trainingSessionFilterForm.get(TrainingSessionFilterFormKeys.INTENSITY_FILTER_ARRAY) as FormControl<TrainingSessionIntensityDbOption[]>; }
  get muscleGroupFilterArray() {return this.trainingSessionFilterForm.get(TrainingSessionFilterFormKeys.MUSCLE_GROUP_FILTER_ARRAY) as FormControl<TrainingSessionMuscleGroupDbOption[]>;}

}
