import { Component, EventEmitter, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingRecordFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { TrainingSessionCompletionData, TrainingRecordKeys, TrainingRecordNoIdOrTimestamp } from 'shared-models/train/training-record.model';
import { PersonalSessionFragmentStoreActions, PersonalSessionFragmentStoreSelectors, TrainingRecordStoreActions, TrainingRecordStoreSelectors, TrainingSessionStoreActions, TrainingSessionStoreSelectors } from 'src/app/root-store';
import { Duration, DurationLikeObject } from 'luxon';
import { catchError, combineLatest, distinctUntilChanged, filter, map, Observable, Subscription, switchMap, tap, throwError, withLatestFrom } from 'rxjs';
import { CanonicalTrainingSession, TrainingSessionDatabaseCategoryTypes, TrainingSessionFormVars, TrainingSessionKeys } from 'shared-models/train/training-session.model';
import { UiService } from 'src/app/core/services/ui.service';
import { TrainingSessionRatingNoIdOrTimestamp } from 'shared-models/train/session-rating.model';
import { PersonalSessionFragment, PersonalSessionFragmentKeys } from 'shared-models/train/personal-session-fragment.model';
import { PlanSessionFragment, PlanSessionFragmentKeys } from 'shared-models/train/plan-session-fragment.model';
import { Update } from '@ngrx/entity';
import { DurationMsToMmSsPipe } from '../../../../../../shared/pipes/duration-ms-to-mm-ss.pipe';
import { ProcessingSpinnerComponent } from '../../../../../../shared/components/processing-spinner/processing-spinner.component';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgClass, AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-training-session-complete-dialogue',
    templateUrl: './training-session-complete-dialogue.component.html',
    styleUrls: ['./training-session-complete-dialogue.component.scss'],
    standalone: true,
    imports: [MatButtonModule, ReactiveFormsModule, NgClass, MatFormFieldModule, MatInputModule, MatSliderModule, MatDialogClose, ProcessingSpinnerComponent, AsyncPipe, DurationMsToMmSsPipe]
})
export class TrainingSessionCompleteDialogueComponent implements OnInit, OnDestroy {

  deletePersonalSessionFragmentInitiated = new EventEmitter<boolean>(); // This is used to pre-emptively unsubscribe from the localTrainingSessionSubscription in the parent component so that a fetch error isn't triggered once deleted
  
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
  SAVE_TRAINING_SESSION_TITLE_VALUE = GlobalFieldValues.SAVE_TRAINING_SESSION_TITLE;
  SECONDS_FIELD_VALUE = GlobalFieldValues.SECONDS_SHORT;

  intensityMin = TrainingSessionFormVars.complexityMin;
  intensityMax = TrainingSessionFormVars.complexityMax;
  complexityMin = TrainingSessionFormVars.complexityMin;
  complexityMax = TrainingSessionFormVars.complexityMax;

  private trainingRecordFormStatusSubscription!: Subscription;

  private $createTrainingRecordSubmitted = signal(false);
  private $createTrainingRecordCycleInit = signal(false);
  private $createTrainingRecordCycleComplete = signal(false);
  private createTrainingRecordError$!: Observable<{} | null>;
  private createTrainingRecordProcessing$!: Observable<boolean>;
  private createTrainingRecordSubscription!: Subscription;

  private $updateSessionRatingSubmitted = signal(false);
  private $updateSessionRatingCycleInit = signal(false);
  private $updateSessionRatingCycleComplete = signal(false);
  private updateSessionRatingProcessing$!: Observable<boolean>;
  private updateSessionRatingError$!: Observable<{} | null>;

  private $deletePersonalSessionFragmentSubmitted = signal(false);
  private $deletePersonalSessionFragmentCycleInit = signal(false);
  private $deletePersonalSessionFragmentCycleComplete = signal(false);
  private deletePersonalSessionFragmentProcessing$!: Observable<boolean>;
  private deletePersonalSessionFragmentError$!: Observable<{} | null>;

  private $fetchPersonalSessionFragmentsSubmitted = signal(false);
  private allPersonalSessionFragmentsFetched$!: Observable<boolean>;
  private allPersonalSessionFragmentsInStore$!: Observable<PersonalSessionFragment[]>;
  private fetchAllPersonalSessionFragmentsProcessing$!: Observable<boolean>;
  private fetchAllPersonalSessionFragmentsError$!: Observable<{} | null>;

  private $batchModifyPersonalSessionFragmentsSubmitted = signal(false);
  private $batchModifyPersonalSessionFragmentsCycleInit = signal(false);
  private $batchModifyPersonalSessionFragmentsCycleComplete = signal(false);
  private batchModifyPersonalSessionFragmentsProcessing$!: Observable<boolean>;
  private batchModifyPersonalSessionFragmentsError$!: Observable<{} | null>;

  combinedCreateTrainingRecordProcessing$!: Observable<boolean>;
  private combinedCreateTrainingRecordError$!: Observable<{} | null>;
  
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

    this.updateSessionRatingProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectUpdateSessionRatingProcessing);
    this.updateSessionRatingError$ = this.store$.select(TrainingSessionStoreSelectors.selectUpdateSessionRatingError);

    this.deletePersonalSessionFragmentProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectDeletePersonalSessionFragmentProcessing);
    this.deletePersonalSessionFragmentError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectDeletePersonalSessionFragmentError);

    this.allPersonalSessionFragmentsFetched$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsFetched);  // We use this to determine if the initial empty array returned when the store is fetched is a pre-loaded state or the actual state
    this.allPersonalSessionFragmentsInStore$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsInStore); // Used to contrast the server version against the local version for debounce purposes
    this.fetchAllPersonalSessionFragmentsError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsError);
    this.fetchAllPersonalSessionFragmentsProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsProcessing);

    this.batchModifyPersonalSessionFragmentsError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectBatchModifyPersonalSessionFragmentsError);
    this.batchModifyPersonalSessionFragmentsProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectBatchModifyPersonalSessionFragmentsProcessing);

    this.combinedCreateTrainingRecordProcessing$ = combineLatest(
      [
        this.createTrainingRecordProcessing$,
        this.updateSessionRatingProcessing$,
        this.deletePersonalSessionFragmentProcessing$,
        this.fetchAllPersonalSessionFragmentsProcessing$,
        this.batchModifyPersonalSessionFragmentsProcessing$,

      ]
    ).pipe(
        map(([createProcessing, updateProcessing, deleteProcessing, fetchProcessing, batchModifyProcessing]) => {
          if (createProcessing || updateProcessing || deleteProcessing || fetchProcessing || batchModifyProcessing) {
            return createProcessing || updateProcessing || deleteProcessing || fetchProcessing || batchModifyProcessing;
          }
          return false;
        })
      );
    
    this.combinedCreateTrainingRecordError$ = combineLatest(
      [
        this.createTrainingRecordError$,
        this.updateSessionRatingError$,
        this.deletePersonalSessionFragmentError$,
        this.fetchAllPersonalSessionFragmentsError$,
        this.batchModifyPersonalSessionFragmentsError$,
      ]
    ).pipe(
        map(([createError, updateError, deleteError, fetchProcessing, batchModifyProcessing]) => {
          if (createError || updateError || deleteError || fetchProcessing || batchModifyProcessing) {
            return createError || updateError || deleteError || fetchProcessing || batchModifyProcessing;
          }
          return false;
        })
      );
  }

  
  onSubmitTrainingRecord() {
    const userId = this.sessionCompletionData.userId;

    const [trainingRecordNoId, sessionRating] = this.generateTrainingRecordAndRating(userId);
    
    // This 1) creates a trainingRecord 2) creates a sessionRating and updates the trainingSession's ratings with the new rating values, and 3) deletes a personalSessionFragment if it exists
    this.createTrainingRecordSubscription = this.combinedCreateTrainingRecordError$
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
          if (!this.$createTrainingRecordSubmitted()) {
            this.$createTrainingRecordSubmitted.set(true);
            this.store$.dispatch(TrainingRecordStoreActions.createTrainingRecordRequested({userId, trainingRecordNoId}));
          }
          return this.createTrainingRecordProcessing$
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(createProcessing => {
          if (createProcessing) {
            this.$createTrainingRecordCycleInit.set(true);
          }
          if (!createProcessing && this.$createTrainingRecordCycleInit()) {
            console.log('createTrainingRecord successful, proceeding with pipe.');
            this.$createTrainingRecordCycleInit.set(false);
            this.$createTrainingRecordCycleComplete.set(true);
          }
        }),
        filter(createProcessing => !createProcessing && this.$createTrainingRecordCycleComplete()),
        switchMap(createProcessing => {
          if (!this.$updateSessionRatingSubmitted()) {
            this.$updateSessionRatingSubmitted.set(true);
            this.store$.dispatch(TrainingSessionStoreActions.updateSessionRatingRequested({sessionRating}));
          }
          return this.updateSessionRatingProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(updateProcessing => {
          if (updateProcessing) {
            this.$updateSessionRatingCycleInit.set(true);
          }
          if (!updateProcessing && this.$updateSessionRatingCycleInit()) {
            console.log('updateSessionRating successful, proceeding with pipe.');
            this.$updateSessionRatingCycleInit.set(false);
            this.$updateSessionRatingCycleComplete.set(true);
          }
        }),
        filter(updateProcessing => !updateProcessing && this.$updateSessionRatingCycleComplete()),
        tap(updateProcessing => {
          const databaseCategory = this.sessionCompletionData.trainingSession[TrainingSessionKeys.DATABASE_CATEGORY];
          if (databaseCategory !== TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT) {
            console.log(`All actions complete: 1) Created trainingRecord, 2) Updated sessionRating, 3) Did not delete personalSessionFragment since this was a ${databaseCategory}`);
            this.uiService.showSnackBar(`Training Record created!`, 10000);
            this.resetComponentState();
            this.dialogRef.close(true);
          }
        }),
        // Only proceed beyond this point if this is a personalSessionFragment
        filter((updateProcessing: boolean) => !!this.sessionCompletionData.trainingSession[TrainingSessionKeys.ID]), 
        switchMap((updateProcessing: boolean) => {
          if (!this.$deletePersonalSessionFragmentSubmitted()) {
            this.deletePersonalSessionFragmentInitiated.emit(true);
            this.store$.dispatch(PersonalSessionFragmentStoreActions.deletePersonalSessionFragmentRequested({
              userId: this.sessionCompletionData.userId, 
              personalSessionFragmentId: this.sessionCompletionData.trainingSession[TrainingSessionKeys.ID]
            }));
          }
          return this.deletePersonalSessionFragmentProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap((deleteProcessing: boolean) => {
          if (deleteProcessing) {
            this.$deletePersonalSessionFragmentCycleInit.set(true);
          }
          if (!deleteProcessing && this.$deletePersonalSessionFragmentCycleInit()) {
            console.log('deletePersonalSessionFragment successful, proceeding with pipe.');
            this.$deletePersonalSessionFragmentCycleInit.set(false);
            this.$deletePersonalSessionFragmentCycleComplete.set(true);
          }
        }),
        filter((deleteProcessing: boolean) => !deleteProcessing && this.$deletePersonalSessionFragmentCycleComplete()),
        withLatestFrom(this.allPersonalSessionFragmentsFetched$),
        switchMap(([deleteProcessing, allFetched]: [boolean, boolean]) => {
          if (!allFetched && !this.$fetchPersonalSessionFragmentsSubmitted()) {
            this.store$.dispatch(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsRequested({userId: this.sessionCompletionData.userId}));
            this.$fetchPersonalSessionFragmentsSubmitted.set(true);
          }
          return this.allPersonalSessionFragmentsInStore$;
        }),
        withLatestFrom(this.allPersonalSessionFragmentsFetched$),
        filter(([personalSessionFragments, allFetched ]: [PersonalSessionFragment[], boolean]) => allFetched),
        switchMap(([personalSessionFragments, allFetched ]: [PersonalSessionFragment[], boolean]) => {
          if (!this.$batchModifyPersonalSessionFragmentsSubmitted()) {
            const personalSessionFragmentUpdates = this.updateIndexesOfRemainingPersonalSessionFragments(personalSessionFragments);
            this.$batchModifyPersonalSessionFragmentsSubmitted.set(true);
            this.store$.dispatch(PersonalSessionFragmentStoreActions.batchModifyPersonalSessionFragmentsRequested({userId: this.sessionCompletionData.userId, personalSessionFragmentUpdates}));
          }
          return this.batchModifyPersonalSessionFragmentsProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap((batchModifyProcessing: boolean) => {
          if (batchModifyProcessing) {
            this.$batchModifyPersonalSessionFragmentsCycleInit.set(true);
          }
          if (!batchModifyProcessing && this.$batchModifyPersonalSessionFragmentsCycleInit()) {
            console.log('batchModifyPersonalSessionFragments successful, proceeding with pipe.');
            this.$batchModifyPersonalSessionFragmentsCycleInit.set(false)
            this.$batchModifyPersonalSessionFragmentsCycleComplete.set(true);
          }
        }),
        filter((batchModifyProcessing: boolean) => !batchModifyProcessing && this.$batchModifyPersonalSessionFragmentsCycleComplete()),
        tap((batchModifyProcessing: boolean) => {
          console.log('All actions complete: 1) Created trainingRecord, 2) Updated sessionRating, 3) Deleted personalSessionFragment 4) Batch-modified personalSessionFragment queue');
          this.uiService.showSnackBar(`Training Record created!`, 10000);
          this.resetComponentState();
          this.dialogRef.close(true);
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

  // This prepares a batch update for the planSessionFragment queue
  private updateIndexesOfRemainingPersonalSessionFragments(allPersonalSessionFragments: PersonalSessionFragment[]): Update<PersonalSessionFragment>[] {
    const personalSessionFragmentUpdates = [] as Update<PersonalSessionFragment>[]; // This will be used to send batch update to database
    // Get a mutable array of personalSessionFragments for current trainingPlan
    const updatedArray = [...allPersonalSessionFragments!];
    
    updatedArray.forEach((personalSessionFragment, index) => {
      const itemToUpdate = {...personalSessionFragment};
      itemToUpdate[PersonalSessionFragmentKeys.QUEUE_INDEX] = index;
      updatedArray[index] = itemToUpdate;
      // If no change to index, don't push changes to server
      if (personalSessionFragment[PersonalSessionFragmentKeys.QUEUE_INDEX] === index) {
        return;
      }
      // Otherwise, create an update object and push it to the update array
      const affectedItemUpdateObject: Update<PersonalSessionFragment> = {
        id: itemToUpdate.id,
        changes: {
          queueIndex: itemToUpdate.queueIndex
        }
      };
      personalSessionFragmentUpdates.push(affectedItemUpdateObject);
    })

    console.log('Updated personalSessionFragment array', updatedArray);
    console.log('List of updates for server', personalSessionFragmentUpdates);

    return personalSessionFragmentUpdates;
  }

  // // This prepares a batch update for the planSessionFragment queue
  // private prepareUpdatesForPersonalSessionFragmentQueue(deletedPersonalSessionFragment: PersonalSessionFragment, allPersonalSessionFragments: PersonalSessionFragment[]): Update<PersonalSessionFragment>[] {
  //   // Filter out the deleted session fragment
  //   const updatedSessions = allPersonalSessionFragments.filter(session => session.id !== deletedPersonalSessionFragment.id);

  //   // Update the queueIndex of the remaining sessions and prepare the NgRx update objects
  //   const sessionUpdates = updatedSessions.map((session, index) => {
  //     if (session.queueIndex !== index) {
  //       session.queueIndex = index;
  //       const altAffectedItemUpdateObject: Update<PersonalSessionFragment> = {
  //         id: session.id,
  //         changes: {
  //           queueIndex: index
  //         }
  //       };
  //      return altAffectedItemUpdateObject;
  //     }
  //     return null;
  //   }).filter(update => update !== null);

  //   return sessionUpdates as Update<PersonalSessionFragment>[];
  // }

  private generateTrainingRecordAndRating(userId: string): [TrainingRecordNoIdOrTimestamp, TrainingSessionRatingNoIdOrTimestamp] {
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
      creatorId: userId,
    };
    console.log('Training session record data', trainingRecordNoId);

    const sessionRating: TrainingSessionRatingNoIdOrTimestamp = {
      complexityRating: this.complexityRating.value,
      databaseCategory: this.sessionCompletionData.trainingSession[TrainingSessionKeys.DATABASE_CATEGORY],
      intensityRating: this.intensityRating.value,
      canonicalTrainingSessionId: this.getCanonicalId(this.sessionCompletionData.trainingSession),
      trainingSessionVisibilityCategory: this.sessionCompletionData.trainingSession[TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY],
      userId: this.sessionCompletionData.userId,
    };
    console.log('sessionRating generated', sessionRating);

    return [trainingRecordNoId, sessionRating];
  }

  private getCanonicalId(trainingSession: CanonicalTrainingSession | PlanSessionFragment | PersonalSessionFragment): string {
    let canonicalId: string;
    switch (trainingSession[TrainingSessionKeys.DATABASE_CATEGORY]) {
      case TrainingSessionDatabaseCategoryTypes.CANONICAL:
        canonicalId = (trainingSession as CanonicalTrainingSession)[TrainingSessionKeys.ID];
        break;
      case TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT:
        canonicalId = (trainingSession as PlanSessionFragment)[PlanSessionFragmentKeys.CANONICAL_ID];
        break;
      case TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT:
        canonicalId = (trainingSession as PersonalSessionFragment)[PersonalSessionFragmentKeys.CANONICAL_ID];
        break;
      default:
        throw new Error ('No databaseCategory found on trainingSession');
    }
    return canonicalId;
  }

  private resetComponentState() {
    this.createTrainingRecordSubscription?.unsubscribe();

    this.$createTrainingRecordSubmitted.set(false);
    this.$createTrainingRecordCycleInit.set(false);
    this.$createTrainingRecordCycleComplete.set(false);

    this.$updateSessionRatingSubmitted.set(false);
    this.$updateSessionRatingCycleInit.set(false);
    this.$updateSessionRatingCycleComplete.set(false);
  
    this.$deletePersonalSessionFragmentSubmitted.set(false);
    this.$deletePersonalSessionFragmentCycleInit.set(false);
    this.$deletePersonalSessionFragmentCycleComplete.set(false);

    this.$fetchPersonalSessionFragmentsSubmitted.set(false);

    this.$batchModifyPersonalSessionFragmentsSubmitted.set(false);
    this.$batchModifyPersonalSessionFragmentsCycleInit.set(false);
    this.$batchModifyPersonalSessionFragmentsCycleComplete.set(false);

    this.store$.dispatch(TrainingRecordStoreActions.purgeTrainingRecordErrors());
    this.store$.dispatch(TrainingSessionStoreActions.purgeTrainingSessionErrors());
    this.store$.dispatch(PersonalSessionFragmentStoreActions.purgePersonalSessionFragmentErrors());
  }

  ngOnDestroy(): void {
    this.trainingRecordFormStatusSubscription?.unsubscribe();
    this.createTrainingRecordSubscription?.unsubscribe();
  }

  get complexityRating() { return this.trainingRecordForm.get(TrainingRecordKeys.COMPLEXITY_RATING) as FormControl<number>; }
  get intensityRating() { return this.trainingRecordForm.get(TrainingRecordKeys.INTENSITY_RATING) as FormControl<number>; }
  get hours() { return this.trainingRecordForm.get(TrainingRecordKeys.HOURS) as FormControl<number>; }
  get minutes() { return this.trainingRecordForm.get(TrainingRecordKeys.MINUTES) as FormControl<number>; }
  get seconds() { return this.trainingRecordForm.get(TrainingRecordKeys.SECONDS) as FormControl<number>; }

}
