import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingSessionFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { TrainingSessionActivityCategoryDbOption, TrainingSessionActivityCategoryObject, TrainingSessionActivityCategoryList, TrainingSessionActivityCategoryUiOption } from 'shared-models/train/activity-category.model';
import { TrainingSessionMuscleGroupDbOption, TrainingSessionMuscleGroupList, TrainingSessionMuscleGroupObject } from 'shared-models/train/muscle-group.model';
import { TrainingSession, TrainingSessionForm, TrainingSessionFormVars, TrainingSessionKeys, TrainingSessionVideoPlatform } from 'shared-models/train/training-session.model';
import { RootStoreState, TrainingSessionStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-edit-training-session-step-two',
  templateUrl: './edit-training-session-step-two.component.html',
  styleUrls: ['./edit-training-session-step-two.component.scss']
})
export class EditTrainingSessionStepTwoComponent implements OnInit, OnDestroy {

  existingTrainingSessionData$!: Observable<TrainingSession | undefined>;
  existingTrainingSessionDataSubscription!: Subscription

  FORM_VALIDATION_MESSAGES = TrainingSessionFormValidationMessages;
  intensityMin = TrainingSessionFormVars.complexityMin;
  intensityMax = TrainingSessionFormVars.complexityMax;
  complexityMin = TrainingSessionFormVars.complexityMin;
  complexityMax = TrainingSessionFormVars.complexityMax;

  // Note: Not useing formbuilder here due to typing error (will likey be fixed in a future angular forms update)
  trainingSessionForm = new FormGroup<TrainingSessionForm>({
    [TrainingSessionKeys.COMPLEXITY_DEFAULT]: new FormControl(0, [Validators.required, Validators.pattern(/^\d+$/), Validators.min(this.complexityMin + 1), Validators.max(this.complexityMax)]),
    [TrainingSessionKeys.EQUIPMENT]: new FormControl(false, [Validators.required]),
    [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: new FormControl([] as TrainingSessionActivityCategoryDbOption[], [Validators.required]),
    [TrainingSessionKeys.INTENSITY_DEFAULT]: new FormControl(0, [Validators.required, Validators.pattern(/^\d+$/), Validators.min(this.intensityMin + 1), Validators.max(this.intensityMax)]),
    [TrainingSessionKeys.MUSCLE_GROUP]: new FormControl(null, [Validators.required]),
    [TrainingSessionKeys.VIDEO_PLATFORM]: new FormControl(TrainingSessionVideoPlatform.YOUTUBE, [Validators.required]),
  });

  chipListSeparatorKeysCodes: number[] = [ENTER, COMMA];
  trainingSessionActivityCategoryUserInputForm = new FormControl('');
  filteredtrainingSessionActivityCategoryList!: Observable<TrainingSessionActivityCategoryObject[]>;

  trainingSessionMuscleGroupMasterList: TrainingSessionMuscleGroupObject[] = Object.values(TrainingSessionMuscleGroupList);

  trainingSessionActivityCategoryMasterList: TrainingSessionActivityCategoryObject[] = Object.values(TrainingSessionActivityCategoryList);
  trainingSessionActivityCategoryDbValues = Object.values(TrainingSessionActivityCategoryList).map(activityCategoryOption => activityCategoryOption.dbValue);
  trainingSessionActivityCategoryUiValues = Object.values(TrainingSessionActivityCategoryList).map(activityCategoryOption => activityCategoryOption.uiValue);
  @ViewChild('trainingSessionActivityCategoryInput') trainingSessionActivityCategoryInput!: ElementRef<HTMLInputElement>;

  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  COMPLEXITY_FIELD_VALUE = GlobalFieldValues.COMPLEXITY;
  CREATE_SESSION_BUTTON_VALUE = GlobalFieldValues.CREATE_SESSION;
  EDIT_SESSION_BUTTON_VALUE = GlobalFieldValues.SUBMIT;
  EQUIPMENT_FIELD_VALUE = GlobalFieldValues.EQUIPMENT;
  INTENSITY_FIELD_VALUE = GlobalFieldValues.INTENSITY;
  MUSCLE_GROUP_FIELD_VALUE = GlobalFieldValues.MUSCLE_GROUP;
  SESSION_ACTIVITY_CATEGORY_FIELD_VALUE = GlobalFieldValues.SESSION_ACTIVITY_CATEGORY;
  SESSION_ACTIVITY_CATEGORY_PLACEHOLDER = GlobalFieldValues.ADD_AN_ACTIVITY_CATEGORY;
  
  constructor(
    private store$: Store<RootStoreState.AppState>,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.patchExistingDataIfExists();
    this.initializeFilteredActivityCategoryList();
  }

  private patchExistingDataIfExists() {
    const idParamName = 'id';
    const sessionId = this.route.snapshot.params[idParamName];
    if (sessionId) {
      // Session should already be loaded into store from step 1 so no need to fetch
      this.existingTrainingSessionData$ = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(sessionId));
      this.existingTrainingSessionDataSubscription = this.existingTrainingSessionData$
        .subscribe(trainingSessionData => {
          if (trainingSessionData) {
            console.log('Patching training session data into Step Two');
            this.trainingSessionForm.patchValue({
              [TrainingSessionKeys.COMPLEXITY_DEFAULT]: trainingSessionData[TrainingSessionKeys.COMPLEXITY_DEFAULT],
              [TrainingSessionKeys.EQUIPMENT]: trainingSessionData[TrainingSessionKeys.EQUIPMENT],
              [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: trainingSessionData[TrainingSessionKeys.ACTIVITY_CATEGORY_LIST],
              [TrainingSessionKeys.INTENSITY_DEFAULT]: trainingSessionData[TrainingSessionKeys.INTENSITY_DEFAULT],
              [TrainingSessionKeys.MUSCLE_GROUP]: trainingSessionData[TrainingSessionKeys.MUSCLE_GROUP],
              [TrainingSessionKeys.VIDEO_PLATFORM]: trainingSessionData[TrainingSessionKeys.VIDEO_PLATFORM],
            })
          }
        })
    }
  }

  // Mat mat-chip framework courtesy of: https://material.angular.io/components/chips/examples
  // Filter search results based on user input
  private initializeFilteredActivityCategoryList() {
    this.filteredtrainingSessionActivityCategoryList = this.trainingSessionActivityCategoryUserInputForm.valueChanges.pipe(
      startWith(null),
      map((userInput) => (userInput ? this.filterActivityCategoryListWithUserInput(userInput) : this.filterActivityCategoryListWithoutUserInput())),
    );
  }

  // Match user input to a activityCategory option and filter out existing selected options
  private filterActivityCategoryListWithUserInput(userInput: string): TrainingSessionActivityCategoryObject[] {
    const formattedUserInput = userInput.toLowerCase();
    // Find all activityCategory options that match user input
    const matchingOptions = this.trainingSessionActivityCategoryUiValues.filter(uiActivityCategoryOption => uiActivityCategoryOption.toLowerCase().includes(formattedUserInput));

    // Exclude all activityCategory options that have already been selected
    const matchingOptionsExcludingExisting = this.filterUiArrayFromSeparateDbArray(matchingOptions, this.activityCategoryList.value);

    // Get the activityCategory object corresponding to the ui value
    const matchingObjects = matchingOptionsExcludingExisting.map(activityCategoryUiOption => this.getActivityCategoryObjectFromActivityCategoryUiOption(activityCategoryUiOption));

    return matchingObjects;
  }

  // Query master list for matching activityCategory object
  private getActivityCategoryObjectFromActivityCategoryUiOption(activityCategoryUiOption: TrainingSessionActivityCategoryUiOption): TrainingSessionActivityCategoryObject {
    return this.trainingSessionActivityCategoryMasterList.find(activityCategoryObject => activityCategoryObject.uiValue === activityCategoryUiOption) as TrainingSessionActivityCategoryObject;
  }

  // Query master list for matching activityCategory object
  private getActivityCategoryObjectFromActivityCategoryDbOption(activityCategoryDbOption: TrainingSessionActivityCategoryDbOption): TrainingSessionActivityCategoryObject {
    return this.trainingSessionActivityCategoryMasterList.find(activityCategoryObject => activityCategoryObject.dbValue === activityCategoryDbOption) as TrainingSessionActivityCategoryObject;
  }

  // Filter an array for items found in a separate array
  private filterUiArrayFromSeparateDbArray(arrayToFilter: TrainingSessionActivityCategoryUiOption[], arrayOfItemsToBeExcluded: TrainingSessionActivityCategoryDbOption[]): TrainingSessionActivityCategoryUiOption[] {
    // First convert array of db values to ui values
    const uiVersionOfDbArray = arrayOfItemsToBeExcluded.map(dbOption => this.getActivityCategoryObjectFromActivityCategoryDbOption(dbOption).uiValue);
    // Then use that converted array for filtering
    return arrayToFilter.filter(activityCategoryUiOption => !uiVersionOfDbArray.includes(activityCategoryUiOption));
  }

  // Filter out existing selected options
  private filterActivityCategoryListWithoutUserInput(): TrainingSessionActivityCategoryObject[] {
    
    // Exclude all activityCategory options that have already been selected
    const activityCategoryListExcludingExisting = this.filterUiArrayFromSeparateDbArray(this.trainingSessionActivityCategoryUiValues, this.activityCategoryList.value);

    // Get the activityCategory object corresponding to the ui value
    const matchingObjects = activityCategoryListExcludingExisting.map(activityCategoryUiOption => this.getActivityCategoryObjectFromActivityCategoryUiOption(activityCategoryUiOption));

    return matchingObjects;
  }

  addActivityCategoryChipFromKeyboard(event: MatChipInputEvent): void {

    const uiValue = (event.value || '').trim() as TrainingSessionActivityCategoryUiOption;
    
    const dbValue = this.trainingSessionActivityCategoryMasterList.find(activityCategoryOption => activityCategoryOption.uiValue == uiValue)?.dbValue;

    // Add our fruit if it is valid
    if (dbValue) {
      this.activityCategoryList.setValue([...this.activityCategoryList.value, dbValue]); // Using setValue vs push because push doesn't trigger changeDetection so formControl thinks empty
      // Clear the input value
      event.chipInput!.clear();
  
      this.trainingSessionActivityCategoryUserInputForm.setValue(null);
    }

  }

  addActivityCategoryChipFromAutoComplete(event: MatAutocompleteSelectedEvent): void {
    const dbValue = event.option.value as TrainingSessionActivityCategoryDbOption;
    this.activityCategoryList.setValue([...this.activityCategoryList.value, dbValue]); // Using setValue vs push because push doesn't trigger changeDetection meaning formControl doesn't register input
    this.trainingSessionActivityCategoryInput.nativeElement.value = '';
    this.trainingSessionActivityCategoryUserInputForm.setValue(null);
  }

  removeActivityCategoryChip(activityCategory: TrainingSessionActivityCategoryDbOption): void {

    console.log('Preparing to remove activityCategory chip, current activityCategoryListValue', this.activityCategoryList.value);
    console.log('Db option to remove', activityCategory);
    
    const dbValue = activityCategory;
    const formIndex = this.activityCategoryList.value.indexOf(dbValue);

    if (formIndex >= 0) {
      // Using a temp array here bc splicing the activityCategoryList directly causes initialization issues
      const tempArray = [...this.activityCategoryList.value];
      tempArray.splice(formIndex,1);
      this.activityCategoryList.setValue(tempArray);
      // Splicing the form value doesn't trigger form detection so here we also manually set it to blank to ensure formControl detects the change to invalid
      if (this.activityCategoryList.value.length < 1) {
        this.activityCategoryList.patchValue([]);
      }
      // This invisible action ensures the valuechange observable fires in initializeFilteredActivityCategoryList, which triggers update to filterActivityCategoryListWithoutUserInput
      this.trainingSessionActivityCategoryUserInputForm.setValue(''); 
    }
  }
  
  ngOnDestroy(): void {
    if (this.existingTrainingSessionDataSubscription) {
      this.existingTrainingSessionDataSubscription.unsubscribe();
    }
  }

  // These getters are used for easy access in the HTML template
  get activityCategoryList() { return (this.trainingSessionForm.get(TrainingSessionKeys.ACTIVITY_CATEGORY_LIST) as FormControl<TrainingSessionActivityCategoryDbOption[]>); } // Typed to eliminate formControl type error in HTML
  get complexityDefault() { return this.trainingSessionForm.get(TrainingSessionKeys.COMPLEXITY_DEFAULT) as FormControl<number>; }
  get equipment() { return this.trainingSessionForm.get(TrainingSessionKeys.EQUIPMENT) as FormControl<boolean>; }
  get intensityDefault() { return this.trainingSessionForm.get(TrainingSessionKeys.INTENSITY_DEFAULT) as FormControl<number>; }
  get muscleGroup() {return this.trainingSessionForm.get(TrainingSessionKeys.MUSCLE_GROUP) as FormControl<TrainingSessionMuscleGroupDbOption>;}

}
