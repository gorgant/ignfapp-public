import { NgClass, AsyncPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { Store } from '@ngrx/store';
import { Subscription, Observable, distinctUntilChanged, map, filter, switchMap, tap, catchError, throwError } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingRecord, TrainingRecordKeys, UiTrainingRecord } from 'shared-models/train/training-record.model';
import { TrainingSessionFormVars } from 'shared-models/train/training-session.model';
import { UiService } from 'src/app/core/services/ui.service';
import { ProcessingSpinnerComponent } from 'src/app/shared/components/processing-spinner/processing-spinner.component';
import { DurationMsToMmSsPipe } from 'src/app/shared/pipes/duration-ms-to-mm-ss.pipe';
import { Duration, DurationLikeObject } from 'luxon';
import { TrainingRecordStoreActions, TrainingRecordStoreSelectors } from 'src/app/root-store';
import { Update } from '@ngrx/entity';

@Component({
    selector: 'app-edit-training-record-dialogue',
    imports: [MatButtonModule, ReactiveFormsModule, NgClass, MatFormFieldModule, MatInputModule, MatSliderModule, MatDialogClose, ProcessingSpinnerComponent, AsyncPipe, DurationMsToMmSsPipe],
    templateUrl: './edit-training-record-dialogue.component.html',
    styleUrl: './edit-training-record-dialogue.component.scss'
})
export class EditTrainingRecordDialogueComponent implements OnInit {

  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  COMPLEXITY_FIELD_VALUE = GlobalFieldValues.COMPLEXITY;
  COMPLEXITY_TITLE_VALUE = GlobalFieldValues.COMPLEXITY;
  DURATION_TITLE_VALUE = GlobalFieldValues.DURATION;
  EDIT_BUTTON_VALUE = GlobalFieldValues.EDIT;
  HOURS_FIELD_VALUE = GlobalFieldValues.HOURS_SHORT;
  INTENSITY_FIELD_VALUE = GlobalFieldValues.INTENSITY;
  INTENSITY_TITLE_VALUE = GlobalFieldValues.INTENSITY;
  MINUTES_FIELD_VALUE = GlobalFieldValues.MINUTES_SHORT;
  SAVE_BUTTON_VALUE = GlobalFieldValues.SAVE;
  UPDATE_TRAINING_RECORD_TITLE_VALUE = GlobalFieldValues.UPDATE_TRAINING_RECORD;
  SECONDS_FIELD_VALUE = GlobalFieldValues.SECONDS_SHORT;

  readonly intensityMin = TrainingSessionFormVars.complexityMin;
  readonly intensityMax = TrainingSessionFormVars.complexityMax;
  readonly complexityMin = TrainingSessionFormVars.complexityMin;
  readonly complexityMax = TrainingSessionFormVars.complexityMax;

  private trainingRecordFormStatusSubscription!: Subscription;

  private $updateTrainingRecordSubmitted = signal(false);
  private $updateTrainingRecordCycleInit = signal(false);
  private $updateTrainingRecordCycleComplete = signal(false);
  private updateTrainingRecordError$!: Observable<{} | null>;
  updateTrainingRecordProcessing$!: Observable<boolean>;
  private updateTrainingRecordSubscription!: Subscription;

  editDuration = signal(false);

  private dialogRef = inject(MatDialogRef<EditTrainingRecordDialogueComponent>);
  trainingRecordData: UiTrainingRecord = inject(MAT_DIALOG_DATA);
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

  ngOnInit(): void {
    this.initForm();
    this.monitorFormValidity();
    this.monitorProcesses();
  }

  get trainingRecordFormErrorMessage() {
    let errorMessage = '';
    if (this.trainingRecordForm.hasError('durationIsInteger')) {
      return errorMessage = 'Duration must be an integer.';
    }
    if (this.trainingRecordForm.hasError('durationGreaterThanZero')) {
      return errorMessage =  'Duration must be greater than zero.';
    }
    return errorMessage;
  }

  get complexityRatingErrorMessage() {
    let errorMessage = '';
    if (this.complexityRating.hasError('required')) {
      return errorMessage = 'You must enter a value';
    }
    if (this.complexityRating.hasError('pattern')) {
      return errorMessage = 'Value must be a number';
    }
    if (this.complexityRating.hasError('min')) {
      return errorMessage = `Value must be greater than ${this.complexityMin}`;
    }
    if (this.complexityRating.hasError('max')) {
      return errorMessage = `Value must be at most ${this.complexityMax}`;
    }
    return errorMessage;
  }

  get intensityRatingErrorMessage() {
    let errorMessage = '';
    if (this.intensityRating.hasError('required')) {
      return errorMessage = 'You must enter a value';
    }
    if (this.intensityRating.hasError('pattern')) {
      return errorMessage = 'Value must be a number';
    }
    if (this.intensityRating.hasError('min')) {
      return errorMessage = `Value must be greater than ${this.intensityMin}`;
    }
    if (this.intensityRating.hasError('max')) {
      return errorMessage = `Value must be at most ${this.intensityMax}`;
    }
    return errorMessage;
  }

  onEditDuration() {
    this.editDuration.set(true);
  }

  private initForm(): void {
    // Convert ms into individual h:m:s units
    const combined = Duration.fromMillis(this.trainingRecordData.duration).toFormat('h:m:s');
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
      [TrainingRecordKeys.COMPLEXITY_RATING]: this.trainingRecordData[TrainingRecordKeys.COMPLEXITY_RATING],
      [TrainingRecordKeys.HOURS]: hours,
      [TrainingRecordKeys.INTENSITY_RATING]: this.trainingRecordData[TrainingRecordKeys.INTENSITY_RATING],
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
    this.updateTrainingRecordProcessing$ = this.store$.select(TrainingRecordStoreSelectors.selectUpdateTrainingRecordProcessing);
    this.updateTrainingRecordError$ = this.store$.select(TrainingRecordStoreSelectors.selectUpdateTrainingRecordError);
  }

  onUpdateTrainingRecord() {
    const userId = this.trainingRecordData[TrainingRecordKeys.CREATOR_ID];

    // This 1) updates a trainingRecord 2) updates a sessionRating and updates the trainingSession's ratings with the new rating values, and 3) deletes a personalSessionFragment if it exists
    this.updateTrainingRecordSubscription = this.updateTrainingRecordError$
      .pipe(
        map(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetComponentState();
            this.dialogRef.close(false);
          }
          return processingError; 
        }),
        filter(processingError => !processingError),
        switchMap(processingError => {
          if (!this.$updateTrainingRecordSubmitted()) {
            const trainingRecordUpdates = this.generateTrainingRecordUpdates();
            this.$updateTrainingRecordSubmitted.set(true);
            this.store$.dispatch(TrainingRecordStoreActions.updateTrainingRecordRequested({userId, trainingRecordUpdates}));
          }
          return this.updateTrainingRecordProcessing$
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(updateProcessing => {
          if (updateProcessing) {
            this.$updateTrainingRecordCycleInit.set(true);
          }
          if (!updateProcessing && this.$updateTrainingRecordCycleInit()) {
            console.log('updateTrainingRecord successful, proceeding with pipe.');
            this.$updateTrainingRecordCycleInit.set(false);
            this.$updateTrainingRecordCycleComplete.set(true);
          }
        }),
        filter(updateProcessing => !updateProcessing && this.$updateTrainingRecordCycleComplete()),
        tap(updateProcessing => {
          this.resetComponentState();
          this.dialogRef.close();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetComponentState();
          this.dialogRef.close(false);
          return throwError(() => new Error(error));
        })
      ).subscribe()
  }

  private resetComponentState() {
    this.updateTrainingRecordSubscription?.unsubscribe();

    this.$updateTrainingRecordSubmitted.set(false);
    this.$updateTrainingRecordCycleInit.set(false);
    this.$updateTrainingRecordCycleComplete.set(false);

    this.store$.dispatch(TrainingRecordStoreActions.purgeTrainingRecordErrors());
  }

  private generateTrainingRecordUpdates(): Update<TrainingRecord> {
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

    const trainingRecordUpdates: Update<TrainingRecord> = {
      id: this.trainingRecordData[TrainingRecordKeys.ID],
      changes: {
        [TrainingRecordKeys.COMPLEXITY_RATING]: this.complexityRating.value,
        [TrainingRecordKeys.DURATION]: updatedDuration,
        [TrainingRecordKeys.INTENSITY_RATING]: this.intensityRating.value,
        [TrainingRecordKeys.CREATOR_ID]: this.trainingRecordData[TrainingRecordKeys.CREATOR_ID]
      }
    };
    console.log('updated trainingRecord', trainingRecordUpdates);

    return trainingRecordUpdates;
  }

 

  get complexityRating() { return this.trainingRecordForm.get(TrainingRecordKeys.COMPLEXITY_RATING) as FormControl<number>; }
  get intensityRating() { return this.trainingRecordForm.get(TrainingRecordKeys.INTENSITY_RATING) as FormControl<number>; }
  get hours() { return this.trainingRecordForm.get(TrainingRecordKeys.HOURS) as FormControl<number>; }
  get minutes() { return this.trainingRecordForm.get(TrainingRecordKeys.MINUTES) as FormControl<number>; }
  get seconds() { return this.trainingRecordForm.get(TrainingRecordKeys.SECONDS) as FormControl<number>; }

}
