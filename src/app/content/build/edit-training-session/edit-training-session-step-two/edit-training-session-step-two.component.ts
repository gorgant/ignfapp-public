import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Input, OnDestroy, OnInit, Signal, inject, input, signal, viewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingSessionActivityCategoryDbOption, TrainingSessionActivityCategoryObject, TrainingSessionActivityCategoryList, TrainingSessionActivityCategoryUiOption } from 'shared-models/train/activity-category.model';
import { TrainingSessionMuscleGroupDbOption, TrainingSessionMuscleGroupList, TrainingSessionMuscleGroupObject } from 'shared-models/train/muscle-group.model';
import { CanonicalTrainingSession, TrainingSessionFormVars, TrainingSessionKeys, TrainingSessionVideoPlatform, TrainingSessionVisibilityCategoryObject, TrainingSessionVisibilityTypeList } from 'shared-models/train/training-session.model';
import { UiService } from 'src/app/core/services/ui.service';
import { NgClass, AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivityCategoryDbToUiPipe } from 'src/app/shared/pipes/activity-category-db-to-ui.pipe';

@Component({
    selector: 'app-edit-training-session-step-two',
    templateUrl: './edit-training-session-step-two.component.html',
    styleUrls: ['./edit-training-session-step-two.component.scss'],
    imports: [ReactiveFormsModule, MatSlideToggleModule, MatSliderModule, MatFormFieldModule, MatRadioModule, MatChipsModule, MatIconModule, MatAutocompleteModule, MatOptionModule, MatButtonModule, NgClass, AsyncPipe, ActivityCategoryDbToUiPipe]
})
export class EditTrainingSessionStepTwoComponent implements OnInit, OnDestroy {

  $localTrainingSession = input<CanonicalTrainingSession>();
  $isNewSession = input<boolean>();

  ACTIVITY_CATEGORY_FIELD_VALUE = GlobalFieldValues.ACTIVITY_CATEGORY;
  ACTIVITY_CATEGORY_PLACEHOLDER = GlobalFieldValues.ADD_AN_ACTIVITY_CATEGORY;
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  COMPLEXITY_FIELD_VALUE = GlobalFieldValues.COMPLEXITY;
  CREATE_SESSION_BUTTON_VALUE = GlobalFieldValues.CREATE_SESSION;
  EDIT_SESSION_BUTTON_VALUE = GlobalFieldValues.SUBMIT;
  EQUIPMENT_FIELD_VALUE = GlobalFieldValues.EQUIPMENT;
  INTENSITY_FIELD_VALUE = GlobalFieldValues.INTENSITY;
  KEYWORD_FIELD_VALUE = GlobalFieldValues.OTHER_KEYWORDS;
  KEYWORD_PLACEHOLDER = GlobalFieldValues.ADD_AN_ACTIVITY_CATEGORY;
  MUSCLE_GROUP_FIELD_VALUE = GlobalFieldValues.MUSCLE_GROUP;
  VISIBILITY_FIELD_TOOLTIP = GlobalFieldValues.VISIBILITY_TOOLTIP;
  VISIBILITY_FIELD_VALUE = GlobalFieldValues.VISIBILITY;

  intensityMin = TrainingSessionFormVars.complexityMin;
  intensityMax = TrainingSessionFormVars.complexityMax;
  complexityMin = TrainingSessionFormVars.complexityMin;
  complexityMax = TrainingSessionFormVars.complexityMax;

  chipListSeparatorKeysCodes: number[] = [ENTER, COMMA];
  trainingSessionActivityCategoryUserInputForm = new FormControl('');
  filteredtrainingSessionActivityCategoryList!: Observable<TrainingSessionActivityCategoryObject[]>;
  
  $activityCategoryInputFieldValue = signal('');
  $keywordInputFieldValue = signal('');
  
  readonly trainingSessionMuscleGroupMasterList: TrainingSessionMuscleGroupObject[] = Object.values(TrainingSessionMuscleGroupList);
  private readonly trainingSessionActivityCategoryMasterList: TrainingSessionActivityCategoryObject[] = Object.values(TrainingSessionActivityCategoryList);
  private readonly trainingSessionActivityCategoryUiValues = Object.values(TrainingSessionActivityCategoryList).map(activityCategoryOption => activityCategoryOption.uiValue);
  private $trainingSessionActivityCategoryInput = viewChild.required<ElementRef<HTMLInputElement>>('trainingSessionActivityCategoryInput');
  readonly visibilityCategoryMasterList: TrainingSessionVisibilityCategoryObject[] = Object.values(TrainingSessionVisibilityTypeList);

  $showKeywordsForm = signal(false);


  private fb = inject(FormBuilder);
  private uiService = inject(UiService);

  trainingSessionForm = this.fb.group({
    [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: [[] as TrainingSessionActivityCategoryDbOption[], [Validators.required, unsavedActivityCategoryValidator(() => this.$activityCategoryInputFieldValue())]],
    [TrainingSessionKeys.COMPLEXITY_DEFAULT]: [0, [Validators.required, Validators.pattern(/^\d+$/), Validators.min(this.complexityMin + 1), Validators.max(this.complexityMax)]],
    [TrainingSessionKeys.EQUIPMENT]: [false, [Validators.required]],
    [TrainingSessionKeys.INTENSITY_DEFAULT]: [0, [Validators.required, Validators.pattern(/^\d+$/), Validators.min(this.intensityMin + 1), Validators.max(this.intensityMax)]],
    [TrainingSessionKeys.KEYWORD_LIST]: [[] as string[], [unsavedKeywordValidator(() => this.$keywordInputFieldValue())]],
    [TrainingSessionKeys.MUSCLE_GROUP]: ['' as TrainingSessionMuscleGroupDbOption, [Validators.required]],
    [TrainingSessionKeys.VIDEO_PLATFORM]: [TrainingSessionVideoPlatform.YOUTUBE, [Validators.required]],
  });
  
  constructor() { }

  ngOnInit(): void {
    this.patchExistingDataIfExists();
    this.initializeFilteredActivityCategoryList();
    console.log('isNewSession: ', this.$isNewSession());
  }

  get complexityDefaultErrorMessage() {
    let errorMessage = '';
    if (this.complexityDefault.hasError('required')) {
      return errorMessage = 'You must enter a value';
    }
    if (this.complexityDefault.hasError('pattern')) {
      return errorMessage = 'Value must be a number';
    }
    if (this.complexityDefault.hasError('min')) {
      return errorMessage = `Value must be greater than ${this.complexityMin}`;
    }
    if (this.complexityDefault.hasError('max')) {
      return errorMessage = `Value must be at most ${this.complexityMax}`;
    }
    return errorMessage;
  }

  get intensityDefaultErrorMessage() {
    let errorMessage = '';
    if (this.intensityDefault.hasError('required')) {
      return errorMessage = 'You must enter a value';
    }
    if (this.intensityDefault.hasError('pattern')) {
      return errorMessage = 'Value must be a number';
    }
    if (this.intensityDefault.hasError('min')) {
      return errorMessage = `Value must be greater than ${this.intensityMin}`;
    }
    if (this.intensityDefault.hasError('max')) {
      return errorMessage = `Value must be at most ${this.intensityMax}`;
    }
    return errorMessage;
  }

  get activityCategoryListErrorMessage() {
    let errorMessage = '';
    if (this.activityCategoryList.hasError('required')) {
      return errorMessage = 'You must select a value';
    }
    if (this.activityCategoryList.hasError('unsavedActivityCategory')) {
      return errorMessage = 'Invalid activity category.';
    }
    return errorMessage;
  }

  get keywordListErrorMessage() {
    let errorMessage = '';
    if (this.keywordList.hasError('unsavedKeyword')) {
      return errorMessage = 'Press enter to save keyword';
    }
    return errorMessage;
  }

  private patchExistingDataIfExists() {
    const trainingSessionData = this.$localTrainingSession();
    console.log('Found this trainingSessionData in step two', trainingSessionData);
    console.log('Initialized form', this.trainingSessionForm);
    if (trainingSessionData) {
      console.log('Patching training session data into Step Two');
      this.trainingSessionForm.patchValue({
        [TrainingSessionKeys.COMPLEXITY_DEFAULT]: trainingSessionData[TrainingSessionKeys.COMPLEXITY_DEFAULT],
        [TrainingSessionKeys.EQUIPMENT]: trainingSessionData[TrainingSessionKeys.EQUIPMENT],
        [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: trainingSessionData[TrainingSessionKeys.ACTIVITY_CATEGORY_LIST],
        [TrainingSessionKeys.INTENSITY_DEFAULT]: trainingSessionData[TrainingSessionKeys.INTENSITY_DEFAULT],
        [TrainingSessionKeys.KEYWORD_LIST]: trainingSessionData[TrainingSessionKeys.KEYWORD_LIST],
        [TrainingSessionKeys.MUSCLE_GROUP]: trainingSessionData[TrainingSessionKeys.MUSCLE_GROUP],
        [TrainingSessionKeys.VIDEO_PLATFORM]: trainingSessionData[TrainingSessionKeys.VIDEO_PLATFORM],
      });
      if (trainingSessionData[TrainingSessionKeys.KEYWORD_LIST].length > 0) {
        this.$showKeywordsForm.set(true);
      }
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

    // Add item if it is valid
    if (dbValue) {
      this.activityCategoryList.setValue([...this.activityCategoryList.value, dbValue]); // Using setValue vs push because push doesn't trigger changeDetection so formControl thinks empty
      // Clear the input value
      event.chipInput!.clear();
  
      this.trainingSessionActivityCategoryUserInputForm.setValue(null);
  
      this.$activityCategoryInputFieldValue.set(''); // Clears the input value after the user presses enter
      this.activityCategoryList.updateValueAndValidity(); // Clears the unsavedActivityCategory error if the field is empty
    }

  }

  addActivityCategoryChipFromAutoComplete(event: MatAutocompleteSelectedEvent): void {
    const dbValue = event.option.value as TrainingSessionActivityCategoryDbOption;
    this.activityCategoryList.setValue([...this.activityCategoryList.value, dbValue]); // Using setValue vs push because push doesn't trigger changeDetection meaning formControl doesn't register input
    this.$trainingSessionActivityCategoryInput().nativeElement.value = '';
    this.trainingSessionActivityCategoryUserInputForm.setValue(null);
  
    this.$activityCategoryInputFieldValue.set(''); // Clears the input value after the user presses enter
    this.activityCategoryList.updateValueAndValidity(); // Clears the unsavedActivityCategory error if the field is empty
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

  onActivityCategoryInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.$activityCategoryInputFieldValue.set(inputElement.value);
    this.activityCategoryList.updateValueAndValidity();
  }

  onShowKeywordsForm() {
    this.$showKeywordsForm.set(true);
  }

  addKeywordChipFromKeyboard(event: MatChipInputEvent): void {
    const keyword = (event.value || '')?.trim().toLocaleLowerCase();
    const minKeywordCharacterLength = 3;
    const maxKeywordCharacterLength = 30;
    const maxKeywordCount = 5;

    if (keyword.length < minKeywordCharacterLength) {
      this.uiService.showSnackBar(`Keywords must be at least ${minKeywordCharacterLength} characters`, 10000);
      return;
    }

    if (keyword.length > maxKeywordCharacterLength) {
      this.uiService.showSnackBar(`Keywords cannot exceed ${maxKeywordCharacterLength} characters`, 10000);
      return;
    }

    if (this.keywordList.value.length > maxKeywordCount - 1) {
      this.uiService.showSnackBar(`Cannot add more than ${maxKeywordCount} keywords`, 10000);
      return;
    }

    if (this.keywordList.value.length > maxKeywordCount - 1) {
      this.uiService.showSnackBar(`Cannot add more than ${maxKeywordCount} keywords`, 10000);
      return;
    }

    if (this.keywordList.value.includes(keyword)) {
      this.uiService.showSnackBar(`Keyword "${keyword}" is already added`, 10000);
      return;
    }
    
    // Add item if it is valid
    if (keyword) {
      this.keywordList.setValue([...this.keywordList.value, keyword]); // Using setValue vs push because push doesn't trigger changeDetection so formControl thinks empty
      // Clear the input value
      event.chipInput!.clear();
      
      this.$keywordInputFieldValue.set(''); // Clears the input value after the user presses enter
      this.keywordList.updateValueAndValidity(); // Clears the unsavedKeyword error if the field is empty
    }

    console.log('New keywordList', this.keywordList.value);
  }

  removeKeywordChip(keyword: string) {
    console.log('Preparing to remove keyword chip, current this.keywordList.value', this.keywordList.value);
    console.log('Keyword to remove', keyword);
    
    const keywordIndex = this.keywordList.value.indexOf(keyword);
    // Using a temp array here bc splicing the activityCategoryList directly causes initialization issues
    const tempArray = [...this.keywordList.value];
    tempArray.splice(keywordIndex,1);
    this.keywordList.setValue(tempArray);
    // Splicing the form value doesn't trigger form detection so here we also manually set it to blank to ensure formControl detects the change to invalid
    if (this.keywordList.value.length < 1) {
      this.keywordList.patchValue([]);
    }

    console.log('New keywordList', this.keywordList.value);
  }

  onKeywordInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.$keywordInputFieldValue.set(inputElement.value);
    this.keywordList.updateValueAndValidity();
  }
  
  ngOnDestroy(): void {

  }

  // These getters are used for easy access in the HTML template
  get activityCategoryList() { return (this.trainingSessionForm.get(TrainingSessionKeys.ACTIVITY_CATEGORY_LIST) as FormControl<TrainingSessionActivityCategoryDbOption[]>); }
  get complexityDefault() { return this.trainingSessionForm.get(TrainingSessionKeys.COMPLEXITY_DEFAULT) as FormControl<number>; }
  get equipment() { return this.trainingSessionForm.get(TrainingSessionKeys.EQUIPMENT) as FormControl<boolean>; }
  get intensityDefault() { return this.trainingSessionForm.get(TrainingSessionKeys.INTENSITY_DEFAULT) as FormControl<number>; }
  get keywordList() { return this.trainingSessionForm.get(TrainingSessionKeys.KEYWORD_LIST) as FormControl<string[]>; }
  get muscleGroup() {return this.trainingSessionForm.get(TrainingSessionKeys.MUSCLE_GROUP) as FormControl<TrainingSessionMuscleGroupDbOption>;}

}


// Custom validator to ensure activity categories are not left unsaved
export function unsavedActivityCategoryValidator(getActivityCategoryInputValue: () => string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (getActivityCategoryInputValue()) {
      return { unsavedActivityCategory: true }; // Return error if input is not empty
    }
    return null; // No error if input is empty
  };
}

// Custom validator to ensure keywords are not left unsaved
export function unsavedKeywordValidator(getKeywordInputValue: () => string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (getKeywordInputValue()) {
      return { unsavedKeyword: true }; // Return error if input is not empty
    }
    return null; // No error if input is empty
  };
}
