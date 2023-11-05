import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingRecordFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { TrainingSessionCompletionData, TrainingRecordKeys, TrainingRecordNoIdOrTimestamp } from 'shared-models/train/training-record.model';
import { PersonalSessionFragmentStoreActions, TrainingRecordStoreActions, TrainingRecordStoreSelectors, TrainingSessionStoreActions } from 'src/app/root-store';
import { Duration, DurationLikeObject } from 'luxon';
import { catchError, distinctUntilChanged, filter, Observable, Subscription, switchMap, tap, throwError, withLatestFrom } from 'rxjs';
import { TrainingSessionFormVars } from 'shared-models/train/training-session.model';
import { UiService } from 'src/app/core/services/ui.service';
import { TrainingSessionRatingNoIdOrTimestamp } from 'shared-models/train/session-rating.model';

@Component({
  selector: 'app-training-session-complete-dialogue',
  templateUrl: './training-session-complete-dialogue.component.html',
  styleUrls: ['./training-session-complete-dialogue.component.scss']
})
export class TrainingSessionCompleteDialogueComponent implements OnInit, OnDestroy {
  
  FORM_VALIDATION_MESSAGES = TrainingRecordFormValidationMessages;
  
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  EDIT_BUTTON_VALUE = GlobalFieldValues.EDIT;
  SAVE_BUTTON_VALUE = GlobalFieldValues.SAVE;
  SAVE_TRAINING_SESSION_TITLE_VALUE = GlobalFieldValues.SAVE_TRAINING_SESSION_TITLE;
  HOURS_FIELD_VALUE = GlobalFieldValues.HOURS_SHORT;
  MINUTES_FIELD_VALUE = GlobalFieldValues.MINUTES_SHORT;
  SECONDS_FIELD_VALUE = GlobalFieldValues.SECONDS_SHORT;
  DURATION_TITLE_VALUE = GlobalFieldValues.DURATION;
  COMPLEXITY_TITLE_VALUE = GlobalFieldValues.COMPLEXITY;
  INTENSITY_TITLE_VALUE = GlobalFieldValues.INTENSITY;

  intensityMin = TrainingSessionFormVars.complexityMin;
  intensityMax = TrainingSessionFormVars.complexityMax;
  complexityMin = TrainingSessionFormVars.complexityMin;
  complexityMax = TrainingSessionFormVars.complexityMax;

  private trainingRecordFormStatusSubscription!: Subscription;

  createTrainingRecordProcessing$!: Observable<boolean>;
  private createTrainingRecordSubscription!: Subscription;
  private createTrainingRecordError$!: Observable<{} | null>;
  private createTrainingRecordSubmitted = signal(false);
  
  editDuration = signal(false);

  private dialogRef = inject(MatDialogRef<TrainingSessionCompleteDialogueComponent>);
  public sessionCompletionData: TrainingSessionCompletionData = inject(MAT_DIALOG_DATA);
  private store$ = inject(Store);
  private uiService = inject(UiService);
  private fb = inject(FormBuilder);

  trainingRecordForm = this.fb.group({
    [TrainingRecordKeys.COMPLEXITY_RATING]: [0, [Validators.pattern(/^[0-9]+$/), Validators.min(this.complexityMin + 1), Validators.max(this.complexityMax)]],
    [TrainingRecordKeys.HOURS]: [0, [Validators.pattern(/^[0-9]+$/), Validators.min(0)]],
    [TrainingRecordKeys.INTENSITY_RATING]: [0, [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.min(this.intensityMin + 1), Validators.max(this.intensityMax)]],
    [TrainingRecordKeys.MINUTES]: [0, [Validators.pattern(/^[0-9]+$/), Validators.min(0)]],
    [TrainingRecordKeys.SECONDS]: [0, [Validators.pattern(/^[0-9]+$/), Validators.min(0)]],
  });

  constructor() { }

  ngOnInit(): void {
    this.initForm();
    this.monitorFormValidity();
    this.monitorProcesses();
  }

  onEditDuration() {
    this.editDuration.set(true);
  }

  private initForm(): void {
    // Convert ms into individual h:m:s units
    const combined = Duration.fromMillis(this.sessionCompletionData.sessionDuration).toFormat('h:m:s');
    const combinedArray = combined.split(':');
    console.log('Combined array', combinedArray)
    const hours = +combinedArray[0];
    const minutes = +combinedArray[1];
    const seconds = +combinedArray[2];

    console.log('Patching hours', hours);
    console.log('Patching minutes', minutes);
    console.log('Patching seconds', seconds);

    // Patch in existing data
    this.trainingRecordForm.patchValue({
      [TrainingRecordKeys.HOURS]: hours,
      [TrainingRecordKeys.MINUTES]: minutes,
      [TrainingRecordKeys.SECONDS]: seconds,
    });
  }

  // Produce a single error message that triggers on any invalid entry in the form group
  private monitorFormValidity(): void {
    this.trainingRecordFormStatusSubscription = this.trainingRecordForm.valueChanges
      .pipe(
        distinctUntilChanged()
      )
      .subscribe(newValue => {
        const newDuration = this.hours.value + this.minutes.value + this.seconds.value;
        const isInteger = new RegExp('^[0-9]+$').test(newDuration.toString());
        if (newDuration < 1) {
          this.trainingRecordForm.setErrors({durationGreaterThanZero: true});
        }
        if (!isInteger) {
          this.trainingRecordForm.setErrors({durationIsInteger: true});
        }
    });
  }

  private monitorProcesses() {
    this.createTrainingRecordProcessing$ = this.store$.select(TrainingRecordStoreSelectors.selectCreateTrainingRecordProcessing);
    this.createTrainingRecordError$ = this.store$.select(TrainingRecordStoreSelectors.selectCreateTrainingRecordError);
  }

  onSubmitTrainingRecord() {
    const userId = this.sessionCompletionData.userId;
    const personalSessionFragmentId = this.sessionCompletionData.personalSessionFragmentId;

    // Create a duration object and convert to ms
    let hmsObject: DurationLikeObject = {
      hours: this.hours.value,
      minutes: this.minutes.value,
      seconds: this.seconds.value,
    };
    // If user sets all values to zero, set seconds to 1 to ensure it has a minimum duration
    if (hmsObject.hours as number <= 0 && hmsObject.minutes as number <= 0 && hmsObject.seconds as number <= 0) {
      hmsObject.seconds = 1;
    }
    const updatedDuration = Duration.fromObject(hmsObject).toMillis();
    
    const trainingRecordNoId: TrainingRecordNoIdOrTimestamp = {
      complexityRating: this.complexityRating.value,
      duration: updatedDuration,
      intensityRating: this.intensityRating.value,
      trainingSessionData: this.sessionCompletionData.trainingSession,
      userId,
    }
    console.log('Training session record data', trainingRecordNoId);

    const sessionRating: TrainingSessionRatingNoIdOrTimestamp = {
      complexityRating: this.complexityRating.value,
      intensityRating: this.intensityRating.value,
      trainingSessionId: this.sessionCompletionData.trainingSession.id,
      userId: this.sessionCompletionData.userId
    };
    console.log('sessionRating', sessionRating);
    
    this.store$.dispatch(TrainingRecordStoreActions.createTrainingRecordRequested({userId, trainingRecordNoId}));
    this.createTrainingRecordSubmitted.set(true);
    this.postCreateTrainingRecordActions(sessionRating);
  }

  private postCreateTrainingRecordActions(sessionRating: TrainingSessionRatingNoIdOrTimestamp) {
    
    this.createTrainingRecordSubscription = this.createTrainingRecordError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.createTrainingRecordSubmitted.set(false);
            this.createTrainingRecordSubscription?.unsubscribe();
          }
          return this.createTrainingRecordProcessing$; 
        }),
        withLatestFrom(this.createTrainingRecordError$),
        filter(([creationProcessing, processingError]) => !processingError),
        tap(([creationProcessing, processingError]) => {
          if (!creationProcessing && this.createTrainingRecordSubmitted()) {
            console.log('Training Record creation successful.');
            this.uiService.showSnackBar(`Training Record created!`, 5000);
            // After creating the record, update the sessionRating and optionally delete the personalSessionFragment, both of which can happen asyncronously
            this.store$.dispatch(TrainingSessionStoreActions.updateSessionRatingRequested({sessionRating}));
            // If this was loaded from a personalSessionFragment, delete that from user's queue upon completion
            if (this.sessionCompletionData.personalSessionFragmentId) {
              this.store$.dispatch(PersonalSessionFragmentStoreActions.deletePersonalSessionFragmentRequested({
                userId: this.sessionCompletionData.userId, 
                personalSessionFragmentId: this.sessionCompletionData.personalSessionFragmentId
              }));
            }
            this.dialogRef.close(true);
          }
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.createTrainingRecordSubmitted.set(false);
          return throwError(() => new Error(error));
        })
      ).subscribe()
  }

  ngOnDestroy(): void {
    this.trainingRecordFormStatusSubscription?.unsubscribe();
  }


  get complexityRating() { return this.trainingRecordForm.get(TrainingRecordKeys.COMPLEXITY_RATING) as FormControl<number>; }
  get intensityRating() { return this.trainingRecordForm.get(TrainingRecordKeys.INTENSITY_RATING) as FormControl<number>; }
  get hours() { return this.trainingRecordForm.get(TrainingRecordKeys.HOURS) as FormControl<number>; }
  get minutes() { return this.trainingRecordForm.get(TrainingRecordKeys.MINUTES) as FormControl<number>; }
  get seconds() { return this.trainingRecordForm.get(TrainingRecordKeys.SECONDS) as FormControl<number>; }

}
