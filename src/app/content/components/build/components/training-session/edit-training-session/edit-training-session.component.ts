import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { map, withLatestFrom, startWith } from 'rxjs/operators';
import { Subscription } from 'rxjs/internal/Subscription';
import { TrainingSessionVideoPlatform, TrainingSession, TrainingSessionFocusDbOption, TrainingSessionForm, TrainingSessionFormVars, TrainingSessionKeys, TrainingSessionNoId, YoutubeVideoDataForm, TrainingSessionFocusList, TrainingSessionFocusUiOption, TrainingSessionFocusListModel, TrainingSessionFocusObject } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { RootStoreState, TrainingSessionStoreActions, TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { combineLatest, Observable } from 'rxjs';
import { YoutubeVideoDataCompact } from 'shared-models/youtube/youtube-video-data.model';
import { SocialUrlPrefixes } from 'shared-models/meta/social-urls.model';
import { MatStepper, StepperOrientation } from '@angular/material/stepper';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UiService } from 'src/app/core/services/ui.service';
import { TrainingSessionFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { MatDialog } from '@angular/material/dialog';
import { ComponentCanDeactivate } from 'src/app/core/route-guards/unsaved-changes.guard';
import { Duration } from 'luxon';
import { COMMA, ENTER, J } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

@Component({
  selector: 'app-edit-training-session',
  templateUrl: './edit-training-session.component.html',
  styleUrls: ['./edit-training-session.component.scss'],
  providers: [ {
    provide: STEPPER_GLOBAL_OPTIONS, useValue: {showError: true} // Required for stepper error to show
  }]
})
export class EditTrainingSessionComponent implements OnInit, OnDestroy, ComponentCanDeactivate {

  @ViewChild('editTrainingSessionStepper') private editTrainingSessionStepper!: MatStepper;
  
  stepperOrientation!: StepperOrientation;
  
  youtubeVideoDataForm!: FormGroup<YoutubeVideoDataForm>;
  trainingSessionForm!: FormGroup<TrainingSessionForm>;
  FORM_VALIDATION_MESSAGES = TrainingSessionFormValidationMessages;
  intensityMin = TrainingSessionFormVars.complexityMin;
  intensityMax = TrainingSessionFormVars.complexityMax;
  complexityMin = TrainingSessionFormVars.complexityMin;
  complexityMax = TrainingSessionFormVars.complexityMax;
  
  chipListSeparatorKeysCodes: number[] = [ENTER, COMMA];
  trainingSessionFocusUserInputForm = new FormControl('');
  filteredtrainingSessionFocusList!: Observable<TrainingSessionFocusObject[]>;
  
  trainingSessionFocusMasterList: TrainingSessionFocusObject[] = Object.values(TrainingSessionFocusList);
  trainingSessionFocusDbValues = Object.values(TrainingSessionFocusList).map(focusOption => focusOption.dbValue);
  trainingSessionFocusUiValues = Object.values(TrainingSessionFocusList).map(focusOption => focusOption.uiValue);
  @ViewChild('trainingSessionFocusInput') trainingSessionFocusInput!: ElementRef<HTMLInputElement>;

  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  CHANNEL_BLURB = GlobalFieldValues.CHANNEL;
  COMPLEXITY_FIELD_VALUE = GlobalFieldValues.COMPLEXITY;
  CREATE_SESSION_TITLE_VALUE = GlobalFieldValues.CREATE_SESSION;
  CREATE_SESSION_BUTTON_VALUE = GlobalFieldValues.CREATE_SESSION;
  DISCARD_EDITS_TITLE_VALUE = GlobalFieldValues.DISCARD_EDITS_TITLE;
  DISCARD_EDITS_BODY_VALUE = GlobalFieldValues.DISCARD_EDITS_BODY;
  DURATION_BLURB = GlobalFieldValues.DURATION;
  EDIT_SESSION_TITLE_VALUE = GlobalFieldValues.EDIT_SESSION;
  EDIT_SESSION_BUTTON_VALUE = GlobalFieldValues.SUBMIT;
  EQUIPMENT_FIELD_VALUE = GlobalFieldValues.EQUIPMENT;
  FETCH_VIDEO_DATA_BUTTON_VALUE = GlobalFieldValues.FETCH_VIDEO_DATA
  INPUT_YOUTUBE_VIDEO_URL_HINT = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_HINT
  INPUT_YOUTUBE_VIDEO_URL_FIELD_VALUE = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_FIELD_VALUE;
  INPUT_YOUTUBE_VIDEO_URL_STEP_LABEL = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_TITLE;
  INPUT_SESSION_DATA_STEP_LABEL = GlobalFieldValues.INPUT_SESSION_DATA
  INTENSITY_FIELD_VALUE = GlobalFieldValues.INTENSITY;
  SESSION_FOCUS_FIELD_VALUE = GlobalFieldValues.SESSION_FOCUS;
  SESSION_FOCUS_PLACEHOLDER = GlobalFieldValues.ADD_A_FOCUS;
  TITLE_BLURB = GlobalFieldValues.TITLE;

  youtubeVideoData$!: Observable<YoutubeVideoDataCompact>;
  videoUrlSubscription!: Subscription;

  getUserSubscription!: Subscription;
  userData$!: Observable<PublicUser>;

  getYoutubeVideoDataProcessing$!: Observable<boolean>;
  getYoutubeVideoDataSubscription!: Subscription;
  getYoutubeVideoDataError$!: Observable<Error | null>;
  getYoutubeVideoDataSubmitted!: boolean;

  createTrainingSessionProcessing$!: Observable<boolean>;
  createTrainingSessionSubscription!: Subscription;
  createTrainingSessionError$!: Observable<{} | null>;
  createTrainingSessionSubmitted!: boolean;

  updateTrainingSessionProcessing$!: Observable<boolean>;
  updateTrainingSessionSubscription!: Subscription;
  updateTrainingSessionError$!: Observable<{} | null>;
  updateTrainingSessionSubmitted!: boolean;

  serverRequestProcessing$!: Observable<boolean>;

  isNewSession = true;
  existingSessionData!: TrainingSession;
  
  

  constructor(
    private nonNullableFb: NonNullableFormBuilder,
    private fb: FormBuilder,
    private store$: Store<RootStoreState.AppState>,
    private uiService: UiService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.monitorProcesses();
    this.setStepperOrientation();
    this.initializeFilteredFocusList();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectUserData)) as Observable<PublicUser>;

    this.getYoutubeVideoDataProcessing$ = this.store$.pipe(select(TrainingSessionStoreSelectors.selectFetchYoutubeVideoDataProcessing));
    this.getYoutubeVideoDataError$ = this.store$.pipe(select(TrainingSessionStoreSelectors.selectFetchYoutubeVideoDataError));
    this.youtubeVideoData$ = this.store$.pipe(select(TrainingSessionStoreSelectors.selectYoutubeVideoData)) as Observable<YoutubeVideoDataCompact>;

    this.createTrainingSessionProcessing$ = this.store$.pipe(select(TrainingSessionStoreSelectors.selectCreateTrainingSessionProcessing));
    this.createTrainingSessionError$ = this.store$.pipe(select(TrainingSessionStoreSelectors.selectCreateTrainingSessionError));

    this.updateTrainingSessionProcessing$ = this.store$.pipe(select(TrainingSessionStoreSelectors.selectUpdateTrainingSessionProcessing));
    this.updateTrainingSessionError$ = this.store$.pipe(select(TrainingSessionStoreSelectors.selectUpdateTrainingSessionError));

    this.serverRequestProcessing$ = combineLatest(
      [
        this.getYoutubeVideoDataProcessing$,
        this.createTrainingSessionProcessing$,
        this.updateTrainingSessionProcessing$
      ]
    ).pipe(
        map(([gettingYoutubeVideoData, creatingTrainingSession, updatingTrainingSession]) => {
          if (gettingYoutubeVideoData || creatingTrainingSession || updatingTrainingSession) {
            return true
          }
          return false
        })
    );
  }

  private setStepperOrientation(): void {
    this.uiService.screenIsMobile.subscribe(isMobile => {
      if (isMobile) {
        this.stepperOrientation = 'vertical'
      } else {
        this.stepperOrientation = 'horizontal'
      }
    })
  }

  private initForm(): void {

    this.youtubeVideoDataForm = this.nonNullableFb.group({
      [TrainingSessionKeys.VIDEO_URL]: ['', [Validators.required, Validators.pattern(/^\S*(?:https\:\/\/youtu\.be)\S*$/)]],
      [TrainingSessionKeys.YOUTUBE_VIDEO_DATA_RETREIVED]: [false, [Validators.requiredTrue]]
    });

    // Note: Not useing formbuilder here due to typing error (will likey be fixed in a future angular forms update)
    this.trainingSessionForm = new FormGroup({
      [TrainingSessionKeys.COMPLEXITY_DEFAULT]: new FormControl(0, [Validators.required, Validators.pattern(/^\d+$/), Validators.min(this.complexityMin + 1), Validators.max(this.complexityMax)]),
      [TrainingSessionKeys.EQUIPMENT]: new FormControl(false, [Validators.required]),
      [TrainingSessionKeys.FOCUS_LIST]: new FormControl([] as TrainingSessionFocusDbOption[], [Validators.required]),
      [TrainingSessionKeys.INTENSITY_DEFAULT]: new FormControl(0, [Validators.required, Validators.pattern(/^\d+$/), Validators.min(this.intensityMin + 1), Validators.max(this.intensityMax)]),
      [TrainingSessionKeys.VIDEO_PLATFORM]: new FormControl(TrainingSessionVideoPlatform.YOUTUBE, [Validators.required]),
    });
  }

  onGetYoutubeVideoData() {
    const url = this.videoUrl.value as string;
    const videoId = url.split('/').pop() as string; // Grab the video ID from the end of the url https://stackoverflow.com/a/8376542/6572208
    this.store$.dispatch(TrainingSessionStoreActions.fetchYoutubeVideoDataRequested({videoId}));
    this.postGetYoutubeVideoDataActions();
  }

  private postGetYoutubeVideoDataActions() {

    this.getYoutubeVideoDataSubscription = this.youtubeVideoData$
      .pipe(
        withLatestFrom(this.getYoutubeVideoDataProcessing$, this.getYoutubeVideoDataError$)
      )
      .subscribe(([videoData, processing, error]) => {
        if (processing) {
          this.getYoutubeVideoDataSubmitted = true;
        }

        // If error, cancel operation
        if (error) {
          console.log('Error fetching video data, resetting form');
          this.getYoutubeVideoDataSubscription.unsubscribe();
          this.getYoutubeVideoDataSubmitted = false;
          this.youtubeVideoDataForm.reset(); // Prevents user from proceeding manually to next step by clicking in stepper
          return;
        }

        // If succeeds, proceed to next step
        if (this.getYoutubeVideoDataSubmitted && !processing) {
          console.log('Video data retreival successful');
          console.log('Image url', videoData.thumbnailUrl);
          this.videoDataRetreived.setValue(true); // Ensures youtube data is retreived before user can proceed
          this.getYoutubeVideoDataSubscription.unsubscribe(); // Clear subscription no longer needed
          this.monitorYoutubeVideoUrlChange(); 
          this.proceedToNextStep();
        }
      })
  }

  private monitorYoutubeVideoUrlChange() {
    this.videoUrlSubscription = this.videoUrl.statusChanges
      .subscribe(change => {
        // Ensures new youtube data is retreived if user makes additional edits
        if (this.videoDataRetreived.value) {
          this.videoDataRetreived.setValue(false);
        }
      })
  }

  private proceedToNextStep() {
    this.editTrainingSessionStepper.next()
  }


  // TODO: can we move the mat chip form field to its own component

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
      const uiValue = TrainingSessionFocusList[dbValue].uiValue;
      this.focusList.setValue([...this.focusList.value, dbValue]); // Using setValue vs push because push doesn't trigger changeDetection so formControl thinks empty
      // Clear the input value
      event.chipInput!.clear();
  
      this.trainingSessionFocusUserInputForm.setValue(null);
    }

  }

  addFocusChipFromAutoComplete(event: MatAutocompleteSelectedEvent): void {
    const uiValue = event.option.viewValue as TrainingSessionFocusUiOption;
    const dbValue = event.option.value as TrainingSessionFocusDbOption;
    this.focusList.setValue([...this.focusList.value, dbValue]); // Using setValue vs push because push doesn't trigger changeDetection meaning formControl doesn't register input
    this.trainingSessionFocusInput.nativeElement.value = '';
    this.trainingSessionFocusUserInputForm.setValue(null);
  }

  removeFocusChip(focus: TrainingSessionFocusDbOption): void {

    const dbValue = focus;
    const formIndex = this.focusList.value.indexOf(dbValue);

    if (formIndex >= 0) {
      this.focusList.value.splice(formIndex, 1);
      // Splicing the form value doesn't trigger form detection so here we also manually set it to blank to ensure formControl detects the change to invalid
      if (this.focusList.value.length < 1) {
        this.focusList.patchValue([]);
      }
      // This invisible action ensures the valuechange observable fires in initializeFilteredFocusList, which triggers update to filterFocusListWithoutUserInput
      this.trainingSessionFocusUserInputForm.setValue(''); 
    }
  }

  getFocusUiOptionFromDbOption(dbValue: TrainingSessionFocusDbOption): TrainingSessionFocusUiOption {
    return this.trainingSessionFocusMasterList.find(focusOption => focusOption.dbValue == dbValue)?.uiValue as TrainingSessionFocusUiOption;
  }

  onSubmitTrainingSessionForm(): void {

    this.getUserSubscription = this.userData$
      .pipe(withLatestFrom(this.youtubeVideoData$))
      .subscribe(([userData, videoData]) => {

        if (!videoData) {
          console.log(`No video data, terminating function`);
          return;
        }

        const isoDuration = videoData.duration;
        const msDuration = Duration.fromISO(isoDuration).toMillis();

        const trainingSessionNoId: TrainingSessionNoId = {
          channelUrl: `${SocialUrlPrefixes.YOUTUBE_CHANNEL}/${videoData.channelId}`,
          complexityAverage: this.isNewSession ? this.complexityDefault.value as number : this.existingSessionData.complexityAverage,
          [TrainingSessionKeys.COMPLEXITY_DEFAULT]: this.complexityDefault.value as number,
          complexityRatingCount: 1,
          creatorId: userData.id,
          [TrainingSessionKeys.EQUIPMENT]: this.equipment?.value as boolean,
          duration: msDuration,
          [TrainingSessionKeys.FOCUS_LIST]: (this.focusList.value as TrainingSessionFocusDbOption[]).sort((a,b) => a.localeCompare(b)),
          intensityAverage: this.isNewSession ? this.intensityDefault.value as number : this.existingSessionData.intensityAverage,
          [TrainingSessionKeys.INTENSITY_DEFAULT]: this.intensityDefault.value as number,
          intensityRatingCount: 1,
          thumbnailUrl: videoData.thumbnailUrl,
          [TrainingSessionKeys.VIDEO_PLATFORM]: TrainingSessionVideoPlatform.YOUTUBE,
          videoTitle: videoData.title,
          [TrainingSessionKeys.VIDEO_ID]: videoData.id,
          [TrainingSessionKeys.VIDEO_URL]: `${SocialUrlPrefixes.YOUTUBE_VIDEO}/${videoData.id}`,
        };

        console.log('Training Session Data', trainingSessionNoId);

        // TODO: enable once debugging is complete
        // this.store$.dispatch(TrainingSessionStoreActions.createTrainingSessionRequested({trainingSessionNoId}));
      })

  }

  onGoBack(): void {
    // Note that on navigation, the CanDeactivate guard will prompt user to confirm action
    this.router.navigate([PublicAppRoutes.BROWSE]);
  }
  
  // @HostListener allows us to also CanDeactivate Guard against browser refresh, close, etc.
  @HostListener('window:beforeunload') canDeactivate(): Observable<boolean> | boolean {
    // If form untouched, allow user to navigate freely
    if (!this.youtubeVideoDataForm.touched && !this.youtubeVideoDataForm.dirty) {
      return true;
    }
    // Otherwise, prompt the user to cancel operation
    return false;
  }

  ngOnDestroy(): void {
    
    if (this.getUserSubscription) {
      this.getUserSubscription.unsubscribe();
    }

    if (this.getYoutubeVideoDataSubscription) {
      this.getYoutubeVideoDataSubscription.unsubscribe();
    }

    if (this.createTrainingSessionSubscription) {
      this.createTrainingSessionSubscription.unsubscribe();
    }
    
    if (this.updateTrainingSessionSubscription) {
      this.updateTrainingSessionSubscription.unsubscribe();
    }

    if (this.videoUrlSubscription) {
      this.videoUrlSubscription.unsubscribe();
    }
    
  }

  // These getters are used for easy access in the HTML template
  get complexityDefault() { return this.trainingSessionForm.get(TrainingSessionKeys.COMPLEXITY_DEFAULT) as FormControl<number>; }
  get equipment() { return this.trainingSessionForm.get(TrainingSessionKeys.EQUIPMENT) as FormControl<boolean>; }
  get focusList() { return (this.trainingSessionForm.get(TrainingSessionKeys.FOCUS_LIST) as FormControl<TrainingSessionFocusDbOption[]>); } // Typed to eliminate formControl type error in HTML
  get intensityDefault() { return this.trainingSessionForm.get(TrainingSessionKeys.INTENSITY_DEFAULT) as FormControl<number>; }
  get videoDataRetreived() { return this.youtubeVideoDataForm.get(TrainingSessionKeys.YOUTUBE_VIDEO_DATA_RETREIVED) as FormControl<boolean>; }
  get videoUrl() { return this.youtubeVideoDataForm.get(TrainingSessionKeys.VIDEO_URL) as FormControl<string>; }

}
