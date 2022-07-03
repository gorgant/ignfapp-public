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
import { TrainingSession, TrainingSessionFocusDbOption, TrainingSessionFocusList, TrainingSessionFocusObject, TrainingSessionFocusUiOption, TrainingSessionFormVars, TrainingSessionKeys, TrainingSessionVideoPlatform } from 'shared-models/train/training-session.model';
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
  trainingSessionForm = new FormGroup({
    [TrainingSessionKeys.COMPLEXITY_DEFAULT]: new FormControl(0, [Validators.required, Validators.pattern(/^\d+$/), Validators.min(this.complexityMin + 1), Validators.max(this.complexityMax)]),
    [TrainingSessionKeys.EQUIPMENT]: new FormControl(false, [Validators.required]),
    [TrainingSessionKeys.FOCUS_LIST]: new FormControl([] as TrainingSessionFocusDbOption[], [Validators.required]),
    [TrainingSessionKeys.INTENSITY_DEFAULT]: new FormControl(0, [Validators.required, Validators.pattern(/^\d+$/), Validators.min(this.intensityMin + 1), Validators.max(this.intensityMax)]),
    [TrainingSessionKeys.VIDEO_PLATFORM]: new FormControl(TrainingSessionVideoPlatform.YOUTUBE, [Validators.required]),
  });

  chipListSeparatorKeysCodes: number[] = [ENTER, COMMA];
  trainingSessionFocusUserInputForm = new FormControl('');
  filteredtrainingSessionFocusList!: Observable<TrainingSessionFocusObject[]>;

  trainingSessionFocusMasterList: TrainingSessionFocusObject[] = Object.values(TrainingSessionFocusList);
  trainingSessionFocusDbValues = Object.values(TrainingSessionFocusList).map(focusOption => focusOption.dbValue);
  trainingSessionFocusUiValues = Object.values(TrainingSessionFocusList).map(focusOption => focusOption.uiValue);
  @ViewChild('trainingSessionFocusInput') trainingSessionFocusInput!: ElementRef<HTMLInputElement>;

  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  COMPLEXITY_FIELD_VALUE = GlobalFieldValues.COMPLEXITY;
  CREATE_SESSION_BUTTON_VALUE = GlobalFieldValues.CREATE_SESSION;
  EDIT_SESSION_BUTTON_VALUE = GlobalFieldValues.SUBMIT;
  EQUIPMENT_FIELD_VALUE = GlobalFieldValues.EQUIPMENT;
  INTENSITY_FIELD_VALUE = GlobalFieldValues.INTENSITY;
  SESSION_FOCUS_FIELD_VALUE = GlobalFieldValues.SESSION_FOCUS;
  SESSION_FOCUS_PLACEHOLDER = GlobalFieldValues.ADD_A_FOCUS;
  
  constructor(
    private store$: Store<RootStoreState.AppState>,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.patchExistingDataIfExists();
    this.initializeFilteredFocusList();
  }

  private patchExistingDataIfExists() {
    const idParamName = 'id';
    const sessionId = this.route.snapshot.params[idParamName];
    if (sessionId) {
      // Session should already be loaded into store from step 1 so no need to fetch
      this.existingTrainingSessionData$ = this.store$.select(TrainingSessionStoreSelectors.selectSessionById(sessionId));
      this.existingTrainingSessionDataSubscription = this.existingTrainingSessionData$
        .subscribe(trainingSessionData => {
          if (trainingSessionData) {
            console.log('Patching training session data into Step Two');
            this.trainingSessionForm.patchValue({
              [TrainingSessionKeys.COMPLEXITY_DEFAULT]: trainingSessionData[TrainingSessionKeys.COMPLEXITY_DEFAULT],
              [TrainingSessionKeys.EQUIPMENT]: trainingSessionData[TrainingSessionKeys.EQUIPMENT],
              [TrainingSessionKeys.FOCUS_LIST]: trainingSessionData[TrainingSessionKeys.FOCUS_LIST],
              [TrainingSessionKeys.INTENSITY_DEFAULT]: trainingSessionData[TrainingSessionKeys.INTENSITY_DEFAULT],
              [TrainingSessionKeys.VIDEO_PLATFORM]: trainingSessionData[TrainingSessionKeys.VIDEO_PLATFORM],
            })
          }
        })
    }
  }

  // Mat mat-chip framework courtesy of: https://material.angular.io/components/chips/examples
  // Filter search results based on user input
  private initializeFilteredFocusList() {
    this.filteredtrainingSessionFocusList = this.trainingSessionFocusUserInputForm.valueChanges.pipe(
      startWith(null),
      map((userInput) => (userInput ? this.filterFocusListWithUserInput(userInput) : this.filterFocusListWithoutUserInput())),
    );
  }

  // Match user input to a focus option and filter out existing selected options
  private filterFocusListWithUserInput(userInput: string): TrainingSessionFocusObject[] {
    const formattedUserInput = userInput.toLowerCase();
    // Find all focus options that match user input
    const matchingOptions = this.trainingSessionFocusUiValues.filter(uiFocusOption => uiFocusOption.toLowerCase().includes(formattedUserInput));

    // Exclude all focus options that have already been selected
    const matchingOptionsExcludingExisting = this.filterUiArrayFromSeparateDbArray(matchingOptions, this.focusList.value);

    // Get the focus object corresponding to the ui value
    const matchingObjects = matchingOptionsExcludingExisting.map(focusUiOption => this.getFocusObjectFromFocusUiOption(focusUiOption));

    return matchingObjects;
  }

  // Query master list for matching focus object
  private getFocusObjectFromFocusUiOption(focusUiOption: TrainingSessionFocusUiOption): TrainingSessionFocusObject {
    return this.trainingSessionFocusMasterList.find(focusObject => focusObject.uiValue === focusUiOption) as TrainingSessionFocusObject;
  }

  // Query master list for matching focus object
  private getFocusObjectFromFocusDbOption(focusDbOption: TrainingSessionFocusDbOption): TrainingSessionFocusObject {
    return this.trainingSessionFocusMasterList.find(focusObject => focusObject.dbValue === focusDbOption) as TrainingSessionFocusObject;
  }

  // Filter an array for items found in a separate array
  private filterUiArrayFromSeparateDbArray(arrayToFilter: TrainingSessionFocusUiOption[], arrayOfItemsToBeExcluded: TrainingSessionFocusDbOption[]): TrainingSessionFocusUiOption[] {
    // First convert array of db values to ui values
    const uiVersionOfDbArray = arrayOfItemsToBeExcluded.map(dbOption => this.getFocusObjectFromFocusDbOption(dbOption).uiValue);
    // Then use that converted array for filtering
    return arrayToFilter.filter(focusUiOption => !uiVersionOfDbArray.includes(focusUiOption));
  }

  // Filter out existing selected options
  private filterFocusListWithoutUserInput(): TrainingSessionFocusObject[] {
    
    // Exclude all focus options that have already been selected
    const focusListExcludingExisting = this.filterUiArrayFromSeparateDbArray(this.trainingSessionFocusUiValues, this.focusList.value);

    // Get the focus object corresponding to the ui value
    const matchingObjects = focusListExcludingExisting.map(focusUiOption => this.getFocusObjectFromFocusUiOption(focusUiOption));

    return matchingObjects;
  }

  addFocusChipFromKeyboard(event: MatChipInputEvent): void {

    const uiValue = (event.value || '').trim() as TrainingSessionFocusUiOption;
    
    const dbValue = this.trainingSessionFocusMasterList.find(focusOption => focusOption.uiValue == uiValue)?.dbValue;

    // Add our fruit if it is valid
    if (dbValue) {
      this.focusList.setValue([...this.focusList.value, dbValue]); // Using setValue vs push because push doesn't trigger changeDetection so formControl thinks empty
      // Clear the input value
      event.chipInput!.clear();
  
      this.trainingSessionFocusUserInputForm.setValue(null);
    }

  }

  addFocusChipFromAutoComplete(event: MatAutocompleteSelectedEvent): void {
    const dbValue = event.option.value as TrainingSessionFocusDbOption;
    this.focusList.setValue([...this.focusList.value, dbValue]); // Using setValue vs push because push doesn't trigger changeDetection meaning formControl doesn't register input
    this.trainingSessionFocusInput.nativeElement.value = '';
    this.trainingSessionFocusUserInputForm.setValue(null);
  }

  removeFocusChip(focus: TrainingSessionFocusDbOption): void {

    console.log('Preparing to remove focus chip, current focusListValue', this.focusList.value);
    console.log('Db option to remove', focus);
    
    const dbValue = focus;
    const formIndex = this.focusList.value.indexOf(dbValue);

    if (formIndex >= 0) {
      // Using a temp array here bc splicing the focusList directly causes initialization issues
      const tempArray = [...this.focusList.value];
      tempArray.splice(formIndex,1);
      this.focusList.setValue(tempArray);
      // Splicing the form value doesn't trigger form detection so here we also manually set it to blank to ensure formControl detects the change to invalid
      if (this.focusList.value.length < 1) {
        this.focusList.patchValue([]);
      }
      // This invisible action ensures the valuechange observable fires in initializeFilteredFocusList, which triggers update to filterFocusListWithoutUserInput
      this.trainingSessionFocusUserInputForm.setValue(''); 
    }
  }
  
  // Convert this to a pipe since it is used in the html template
  getFocusUiOptionFromDbOption(dbValue: TrainingSessionFocusDbOption): TrainingSessionFocusUiOption {
    return this.trainingSessionFocusMasterList.find(focusOption => focusOption.dbValue == dbValue)?.uiValue as TrainingSessionFocusUiOption;
  }

  ngOnDestroy(): void {
    if (this.existingTrainingSessionDataSubscription) {
      this.existingTrainingSessionDataSubscription.unsubscribe();
    }
  }

  // These getters are used for easy access in the HTML template
  get complexityDefault() { return this.trainingSessionForm.get(TrainingSessionKeys.COMPLEXITY_DEFAULT) as FormControl<number>; }
  get equipment() { return this.trainingSessionForm.get(TrainingSessionKeys.EQUIPMENT) as FormControl<boolean>; }
  get focusList() { return (this.trainingSessionForm.get(TrainingSessionKeys.FOCUS_LIST) as FormControl<TrainingSessionFocusDbOption[]>); } // Typed to eliminate formControl type error in HTML
  get intensityDefault() { return this.trainingSessionForm.get(TrainingSessionKeys.INTENSITY_DEFAULT) as FormControl<number>; }

}
