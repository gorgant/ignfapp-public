import { Component, Input, OnInit, inject, input, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription, catchError, combineLatest, filter, map, switchMap, tap, throwError, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { NewDataForPersonalSessionFragmentNoIdOrTimestamp, PersonalSessionFragment, PersonalSessionFragmentKeys, PersonalSessionFragmentNoIdOrTimestamp } from 'shared-models/train/personal-session-fragment.model';
import { PlanSessionFragment, PlanSessionFragmentKeys } from 'shared-models/train/plan-session-fragment.model';
import { TrainingSessionDatabaseCategoryTypes, TrainingSessionNoIdOrTimestamps } from 'shared-models/train/training-session.model';
import { EMPTY_SPINNER_MESSAGE } from 'shared-models/user-interface/dialogue-box-default-config.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { SnackbarActions } from 'shared-models/utils/snackbar-actions.model';
import { UiService } from 'src/app/core/services/ui.service';
import { PersonalSessionFragmentStoreActions, PersonalSessionFragmentStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { AsyncPipe } from '@angular/common';
import { ProcessingSpinnerComponent } from '../processing-spinner/processing-spinner.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-add-training-plan-to-personal-queue',
    templateUrl: './add-training-plan-to-personal-queue.component.html',
    styleUrls: ['./add-training-plan-to-personal-queue.component.scss'],
    imports: [MatButtonModule, ProcessingSpinnerComponent, AsyncPipe]
})
export class AddTrainingPlanToPersonalQueueComponent implements OnInit {
  
  $planSessionFragments = input.required<PlanSessionFragment[]>();

  ADD_PLAN_TO_MY_QUEUE_BUTTON_VALUE = GlobalFieldValues.ADD_PLAN_TO_MY_QUEUE;
  EMPTY_MESSAGE = EMPTY_SPINNER_MESSAGE;

  
  $isActiveButton = signal(false); // Identifies the instance of the button being clicked vs all other instances of buttons

  private userData$!: Observable<PublicUser>;

  private batchCreatePersonalSessionFragmentsRequestedProcessing$!: Observable<boolean>;
  private batchCreatePersonalSessionFragmentsRequestedError$!: Observable<{} | null>;
  private $batchCreatePersonalSessionFragmentsRequestedSubmitted = signal(false);
  private $batchCreatePersonalSessionFragmentsRequestedCycleInit = signal(false);
  private $batchCreatePersonalSessionFragmentsRequestedCycleComplete = signal(false);

  private $fetchPersonalSessionFragmentsSubmitted = signal(false);
  private allPersonalSessionFragmentsFetched$!: Observable<boolean>;
  private allPersonalSessionFragmentsInStore$!: Observable<PersonalSessionFragment[]>;
  private fetchAllPersonalSessionFragmentsError$!: Observable<{} | null>;
  private fetchAllPersonalSessionFragmentsProcessing$!: Observable<boolean>;
  
  private combinedAddTrainingPlanToQueueError$!: Observable<{} | null>;
  combinedAddTrainingPlanToQueueProcessing$!: Observable<boolean>;
  private combinedAddTrainingPlanToQueueSubscription!: Subscription;

  private store$ = inject(Store);
  private uiService = inject(UiService);

  constructor() { }

  ngOnInit(): void {
    // Since this doesn't get destroyed in a list view, we aggressively unsubscribe after we complete the necessary action
    
    this.monitorProcesses(); // Optionally, this can be disabled here and instead enabled on demand when clicked (we chose to enable so that we can disable inactive buttons when serverRequestProcessing)
  }

  private monitorProcesses() {

    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;

    this.batchCreatePersonalSessionFragmentsRequestedProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectBatchCreatePersonalSessionFragmentsProcessing);
    this.batchCreatePersonalSessionFragmentsRequestedError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectBatchCreatePersonalSessionFragmentsError);

    this.allPersonalSessionFragmentsInStore$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsInStore);
    this.fetchAllPersonalSessionFragmentsProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsProcessing);
    this.fetchAllPersonalSessionFragmentsError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsError);
    this.allPersonalSessionFragmentsFetched$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsFetched);

    this.combinedAddTrainingPlanToQueueProcessing$ = combineLatest(
      [
        this.fetchAllPersonalSessionFragmentsProcessing$,
        this.batchCreatePersonalSessionFragmentsRequestedProcessing$,
      ]
    ).pipe(
      map(([fetchTrainingPlanProcessing, createTrainingSessionsProcessing]) => {
        if (fetchTrainingPlanProcessing || createTrainingSessionsProcessing) {
          return true;
        }
        return false;
      })
    );

    this.combinedAddTrainingPlanToQueueError$ = combineLatest(
      [
        this.fetchAllPersonalSessionFragmentsError$,
        this.batchCreatePersonalSessionFragmentsRequestedError$,
      ]
    ).pipe(
        map(([fetchTrainingPlanError, createTrainingSessionsError]) => {
          if (fetchTrainingPlanError || createTrainingSessionsError) {
            return fetchTrainingPlanError || createTrainingSessionsError;
          }
          return false;
        })
      );
  }

  onBatchAddTrainingSessionsToQueue() {
    console.log('onBatchAddTrainingSessionsToQueue click registered');
    this.$isActiveButton.set(true);

    // This does the following: 1) Fetch personalSessionFragments 2) convert trainingSession array into personalSessionFragment array 3) add that new array to database
    this.combinedAddTrainingPlanToQueueSubscription = this.combinedAddTrainingPlanToQueueError$
      .pipe(
        map(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetComponentState();
          }
          return processingError
        }),
        withLatestFrom(this.allPersonalSessionFragmentsInStore$, this.userData$, this.allPersonalSessionFragmentsFetched$),
        filter(([processingError, personalSessionFragments, userData, allFetched]) => !processingError),
        switchMap(([processingError, personalSessionFragments, userData, allFetched]) => {
          if (!allFetched && !this.$fetchPersonalSessionFragmentsSubmitted()) {
            this.$fetchPersonalSessionFragmentsSubmitted.set(true);
            console.log(`no personalSessionFragments in store, fetching from database`);
            this.store$.dispatch(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsRequested({userId: userData.id}));
          }
          return this.allPersonalSessionFragmentsInStore$;
        }),
        withLatestFrom(this.userData$, this.allPersonalSessionFragmentsFetched$),
        filter(([personalSessionFragments, userData, allFetched]) => allFetched),
        switchMap(([personalSessionFragments, userData, allFetched]) => {
          if (!this.$batchCreatePersonalSessionFragmentsRequestedSubmitted()) {
            const personalSessionFragmentsNoId = this.generatePersonalSessionFragmentQueue(personalSessionFragments, userData);
            this.store$.dispatch(PersonalSessionFragmentStoreActions.batchCreatePersonalSessionFragmentsRequested({userId: userData.id, personalSessionFragmentsNoId}));
            this.$batchCreatePersonalSessionFragmentsRequestedSubmitted.set(true);
          }
          return this.batchCreatePersonalSessionFragmentsRequestedProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(creationProcessing => {
          if (creationProcessing) {
            this.$batchCreatePersonalSessionFragmentsRequestedCycleInit.set(true);
          }
          if (!creationProcessing && this.$batchCreatePersonalSessionFragmentsRequestedCycleInit()) {
            console.log('personalSessionFragment creation successful, proceeding with pipe.');
            this.$batchCreatePersonalSessionFragmentsRequestedCycleInit.set(false)
            this.$batchCreatePersonalSessionFragmentsRequestedCycleComplete.set(true);
          }
        }),
        filter(creationProcessing => !creationProcessing && this.$batchCreatePersonalSessionFragmentsRequestedCycleComplete()),
        tap(creationProcessing => {
          this.uiService.showSnackBar(`Training Plan Added to Your Queue!`, 10000, SnackbarActions.VIEW_MY_QUEUE);
          this.resetComponentState();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 10000);
          this.resetComponentState();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  // Generate array of personalSessionFragments to upload to database
  private generatePersonalSessionFragmentQueue(personalSessionFragments: PersonalSessionFragment[], userData: PublicUser): PersonalSessionFragmentNoIdOrTimestamp[] {
    let indexOfNewItem = personalSessionFragments.length;
    // Generate array of personalSessionFragments to upload to database
    const personalSessionFragmentsQueue = this.$planSessionFragments().map(planSessionFragment => {
      // Convert current planSessionFragment into a no-id TrainingSession to serve as the base for the planSessionFragment
      const clone: any = {...planSessionFragment};
      // Delete all the planSessionFragment-specific data
      Object.keys(PlanSessionFragmentKeys).forEach(key => {
        const propertyToDelete = clone[key];
        if (propertyToDelete) {
          delete clone[key];
        }
      });
      const incompleteTrainingSessionNoId = clone as TrainingSessionNoIdOrTimestamps;
      
      // Generate personalSessionFragment and push it to array
      const dataToAdd: NewDataForPersonalSessionFragmentNoIdOrTimestamp = {
        [PersonalSessionFragmentKeys.CANONICAL_ID]: planSessionFragment.id,
        [PersonalSessionFragmentKeys.COMPLETE]: false,
        [PersonalSessionFragmentKeys.CREATOR_ID]: userData.id,
        [PersonalSessionFragmentKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT,
        [PersonalSessionFragmentKeys.QUEUE_INDEX]: indexOfNewItem
      };

      // Generate personalSessionFragment and push it to array
      const personalSessionFragmentNoId: PersonalSessionFragmentNoIdOrTimestamp = {
        ...incompleteTrainingSessionNoId,
        ...dataToAdd
      };
      indexOfNewItem++;
      return personalSessionFragmentNoId;
    });
    return personalSessionFragmentsQueue;
  }


  private resetComponentState() {
    this.combinedAddTrainingPlanToQueueSubscription?.unsubscribe();
    this.$isActiveButton.set(false);
    this.$fetchPersonalSessionFragmentsSubmitted.set(false);
    this.$batchCreatePersonalSessionFragmentsRequestedSubmitted.set(false);
    this.$batchCreatePersonalSessionFragmentsRequestedCycleInit.set(false);
    this.$batchCreatePersonalSessionFragmentsRequestedCycleComplete.set(false);
    this.store$.dispatch(PersonalSessionFragmentStoreActions.purgePersonalSessionFragmentErrors());
  }

  ngOnDestroy(): void {
    this.combinedAddTrainingPlanToQueueSubscription?.unsubscribe();
  }
}
