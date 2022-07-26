import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingRecordFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { TrainingSessionCompletionData, TrainingRecordForm, TrainingRecordKeys, TrainingRecordNoId } from 'shared-models/train/training-record.model';
import { RootStoreState, TrainingRecordStoreActions, TrainingRecordStoreSelectors } from 'src/app/root-store';
import { Duration, DurationLikeObject } from 'luxon';
import { distinctUntilChanged, Observable, Subscription, withLatestFrom } from 'rxjs';
import { TrainingSessionFormVars } from 'shared-models/train/training-session.model';
import { UiService } from 'src/app/core/services/ui.service';
import { Router } from '@angular/router';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';

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


  trainingRecordForm = new FormGroup<TrainingRecordForm>({
    [TrainingRecordKeys.COMPLEXITY_RATING]: new FormControl(null, [Validators.pattern(/^[0-9]+$/), Validators.min(this.complexityMin + 1), Validators.max(this.complexityMax)]),
    [TrainingRecordKeys.HOURS]: new FormControl(null, [Validators.pattern(/^[0-9]+$/), Validators.min(0)]),
    [TrainingRecordKeys.INTENSITY_RATING]: new FormControl(0, [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.min(this.intensityMin + 1), Validators.max(this.intensityMax)]),
    [TrainingRecordKeys.MINUTES]: new FormControl(null, [Validators.pattern(/^[0-9]+$/), Validators.min(0)]),
    [TrainingRecordKeys.SECONDS]: new FormControl(null, [Validators.pattern(/^[0-9]+$/), Validators.min(0)]),
  });
  trainingRecordFormStatusSubscription!: Subscription;

  createTrainingRecordProcessing$!: Observable<boolean>;
  createTrainingRecordSubscription!: Subscription;
  createTrainingRecordError$!: Observable<{} | null>;
  createTrainingRecordSubmitted!: boolean;
  
  editDuration = false;

  

  constructor(
    private dialogRef: MatDialogRef<TrainingSessionCompleteDialogueComponent>,
    @Inject(MAT_DIALOG_DATA) public sessionCompletionData: TrainingSessionCompletionData,
    private store$: Store<RootStoreState.AppState>,
    private uiService: UiService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.monitorFormValidity();
    this.monitorProcesses();
  }

  onEditDuration() {
    this.editDuration = true;
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
    // Create a duration object and convert to ms
    let hmsObject: DurationLikeObject = {
      hours: this.hours.value ? this.hours.value : 0,
      minutes: this.minutes.value ? this.minutes.value : 0,
      seconds: this.seconds.value ? this.seconds.value : 0,
    };
    // If user sets all values to zero, set seconds to 1 to ensure it has a minimum duration
    if (hmsObject.hours as number <= 0 && hmsObject.minutes as number <= 0 && hmsObject.seconds as number <= 0) {
      hmsObject.seconds = 1;
    }
    const updatedDuration = Duration.fromObject(hmsObject).toMillis();

    const trainingRecordNoId: TrainingRecordNoId = {
      complexityRating: this.complexityRating.value,
      duration: updatedDuration,
      intensityRating: this.intensityRating.value,
      trainingSessionData: this.sessionCompletionData.trainingSession,
      userId: this.sessionCompletionData.userId,
      completedTimestamp: this.sessionCompletionData.sessionCompletionTimestamp
    }

    console.log('Training session record data', trainingRecordNoId);
    
    this.store$.dispatch(TrainingRecordStoreActions.createTrainingRecordRequested({userId: this.sessionCompletionData.userId, trainingRecordNoId}));
    this.postCreateTrainingRecordActions();
    
    // TODO: submit function to update trainingSession average rating with this rating data
  }

  private postCreateTrainingRecordActions() {
    this.createTrainingRecordSubscription = this.createTrainingRecordProcessing$
      .pipe(
        withLatestFrom(this.createTrainingRecordError$)
      )
      .subscribe(([creatingRecord, creationError]) => {
        if (creatingRecord) {
          this.createTrainingRecordSubmitted = true;
        }

        if (creationError) {
          console.log('Error creating training record in database, terminating function');
          this.createTrainingRecordSubscription.unsubscribe();
          this.createTrainingRecordSubmitted = false;
          return;
        }

        if (!creatingRecord && this.createTrainingRecordSubmitted) {
          console.log('Training Record creation successful.');
          this.uiService.showSnackBar(`Training Record created!`, 5000);
          this.createTrainingRecordSubscription.unsubscribe();
          this.dialogRef.close(true);
          this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
        }
      })
  }

  ngOnDestroy(): void {
    if (this.trainingRecordFormStatusSubscription) {
      this.trainingRecordFormStatusSubscription.unsubscribe();
    }
  }


  get complexityRating() { return this.trainingRecordForm.get(TrainingRecordKeys.COMPLEXITY_RATING) as FormControl<number>; }
  get intensityRating() { return this.trainingRecordForm.get(TrainingRecordKeys.INTENSITY_RATING) as FormControl<number>; }
  get hours() { return this.trainingRecordForm.get(TrainingRecordKeys.HOURS) as FormControl<number>; }
  get minutes() { return this.trainingRecordForm.get(TrainingRecordKeys.MINUTES) as FormControl<number>; }
  get seconds() { return this.trainingRecordForm.get(TrainingRecordKeys.SECONDS) as FormControl<number>; }

}
