import { Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription, withLatestFrom, map, catchError, combineLatest, filter, switchMap, tap, throwError } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { NewDataForPersonalSessionFragmentNoIdOrTimestamp, PersonalSessionFragment, PersonalSessionFragmentKeys, PersonalSessionFragmentNoIdOrTimestamp } from 'shared-models/train/personal-session-fragment.model';
import { PlanSessionFragment, PlanSessionFragmentKeys } from 'shared-models/train/plan-session-fragment.model';
import { CanonicalTrainingSession, TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps } from 'shared-models/train/training-session.model';
import { EMPTY_SPINNER_MESSAGE } from 'shared-models/user-interface/dialogue-box-default-config.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { SnackbarActions } from 'shared-models/utils/snackbar-actions.model';
import { UiService } from 'src/app/core/services/ui.service';
import { PersonalSessionFragmentStoreSelectors, PersonalSessionFragmentStoreActions, UserStoreSelectors } from 'src/app/root-store';
import { AsyncPipe } from '@angular/common';
import { ProcessingSpinnerComponent } from '../processing-spinner/processing-spinner.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-add-training-session-to-personal-queue-button',
    templateUrl: './add-training-session-to-personal-queue-button.component.html',
    styleUrls: ['./add-training-session-to-personal-queue-button.component.scss'],
    imports: [MatButtonModule, MatIconModule, ProcessingSpinnerComponent, AsyncPipe]
})
export class AddTrainingSessionToPersonalQueueButtonComponent implements OnInit, OnDestroy {

  @Input() trainingSessionData!: CanonicalTrainingSession | PlanSessionFragment;
  @Input() useMiniFabButton!: boolean;

  ADD_TO_MY_QUEUE_BUTTON_VALUE = GlobalFieldValues.ADD_TO_MY_QUEUE;
  EMPTY_MESSAGE = EMPTY_SPINNER_MESSAGE;

  $isActiveButton = signal(false); // Identifies the instance of the button being clicked vs all other instances of buttons

  private userData$!: Observable<PublicUser>;

  private createPersonalSessionFragmentProcessing$!: Observable<boolean>;
  private createPersonalSessionFragmentError$!: Observable<{} | null>;
  private $createPersonalSessionFragmentSubmitted = signal(false);
  private $createPersonalSessionFragmentCycleInit = signal(false);
  private $createPersonalSessionFragmentCycleComplete = signal(false);

  private $fetchPersonalSessionFragmentsSubmitted = signal(false);
  private allPersonalSessionFragmentsFetched$!: Observable<boolean>;
  private allPersonalSessionFragmentsInStore$!: Observable<PersonalSessionFragment[]>;
  private fetchAllPersonalSessionFragmentsError$!: Observable<{} | null>;
  private fetchAllPersonalSessionFragmentsProcessing$!: Observable<boolean>;
  
  private combinedAddTrainingSessionToQueueError$!: Observable<{} | null>;
  combinedAddTrainingSessionToQueueProcessing$!: Observable<boolean>;
  private combinedAddTrainingSessionToQueueSubscription!: Subscription;

  private store$ = inject(Store);
  private uiService = inject(UiService);

  constructor() { }

  ngOnInit(): void {
    // Since this doesn't get destroyed in a list view, we aggressively unsubscribe after we complete the necessary action
    
    this.monitorProcesses(); // Optionally, this can be disabled here and instead enabled on demand when clicked (we chose to enable so that we can disable inactive buttons when serverRequestProcessing)
  }

  private monitorProcesses() {

    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;

    this.createPersonalSessionFragmentProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectCreatePersonalSessionFragmentProcessing);
    this.createPersonalSessionFragmentError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectCreatePersonalSessionFragmentError);

    this.allPersonalSessionFragmentsInStore$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsInStore);
    this.fetchAllPersonalSessionFragmentsProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsProcessing);
    this.fetchAllPersonalSessionFragmentsError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsError);
    this.allPersonalSessionFragmentsFetched$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsFetched);

    this.combinedAddTrainingSessionToQueueProcessing$ = combineLatest(
      [
        this.fetchAllPersonalSessionFragmentsProcessing$,
        this.createPersonalSessionFragmentProcessing$,
      ]
    ).pipe(
      map(([fetchTrainingPlanProcessing, createTrainingSessionsProcessing]) => {
        if (fetchTrainingPlanProcessing || createTrainingSessionsProcessing) {
          return true;
        }
        return false;
      })
    );

    this.combinedAddTrainingSessionToQueueError$ = combineLatest(
      [
        this.fetchAllPersonalSessionFragmentsError$,
        this.createPersonalSessionFragmentError$,
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

  onAddTrainingSessionToQueue() {
    this.$isActiveButton.set(true);
    const incompleteTrainingSessionNoId = this.buildTrainingSessionNoId();

    // This does the following: 1) Fetch personalSessionFragments 2) create new personalSessionFragment and add it to the queue
    this.combinedAddTrainingSessionToQueueSubscription = this.combinedAddTrainingSessionToQueueError$
      .pipe(
        map(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetComponentState();
          }
          return processingError;
        }),
        withLatestFrom(this.userData$, this.allPersonalSessionFragmentsFetched$),
        filter(([ processingError, userData, allFetched]) => !processingError),
        switchMap(([processingError, userData, allFetched]) => {
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
          const indexOfNewItem = personalSessionFragments.length;
          const dataToAdd: NewDataForPersonalSessionFragmentNoIdOrTimestamp = {
            [PersonalSessionFragmentKeys.CANONICAL_ID]: this.trainingSessionData.id,
            [PersonalSessionFragmentKeys.COMPLETE]: false,
            [PersonalSessionFragmentKeys.CREATOR_ID]: userData.id,
            [PersonalSessionFragmentKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT,
            [PersonalSessionFragmentKeys.QUEUE_INDEX]: indexOfNewItem,
          };
          const personalSessionFragmentNoId: PersonalSessionFragmentNoIdOrTimestamp = {
            ...incompleteTrainingSessionNoId,
            ...dataToAdd
          };
          if(!this.$createPersonalSessionFragmentSubmitted()) {
            this.store$.dispatch(PersonalSessionFragmentStoreActions.createPersonalSessionFragmentRequested({userId: userData.id, personalSessionFragmentNoId}));
            this.$createPersonalSessionFragmentSubmitted.set(true);
          }
          return this.createPersonalSessionFragmentProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(creationProcessing => {
          if (creationProcessing) {
            this.$createPersonalSessionFragmentCycleInit.set(true);
          }
          if (!creationProcessing && this.$createPersonalSessionFragmentCycleInit()) {
            console.log('personalSessionFragment creation successful, proceeding with pipe.');
            this.$createPersonalSessionFragmentCycleInit.set(false)
            this.$createPersonalSessionFragmentCycleComplete.set(true);
          }
        }),
        filter(creationProcessing => !creationProcessing && this.$createPersonalSessionFragmentCycleComplete()),
        tap(creationProcessing => {
          this.uiService.showSnackBar(`Training Session Added to Your Queue!`, 10000, SnackbarActions.VIEW_MY_QUEUE);
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


  private resetComponentState() {
    this.combinedAddTrainingSessionToQueueSubscription?.unsubscribe();
    this.$isActiveButton.set(false);
    this.$fetchPersonalSessionFragmentsSubmitted.set(false);
    this.$createPersonalSessionFragmentSubmitted.set(false);
    this.$createPersonalSessionFragmentCycleInit.set(false);
    this.$createPersonalSessionFragmentCycleComplete.set(false);
    this.store$.dispatch(PersonalSessionFragmentStoreActions.purgePersonalSessionFragmentErrors());
  }

  // Convert current trainingSession into a no-id version to serve as the base for the personalSessionFragment
  private buildTrainingSessionNoId(): TrainingSessionNoIdOrTimestamps {
    const trainingSession = this.trainingSessionData;
    const clone: any = {...trainingSession};
    let incompleteTrainingSessionNoId: TrainingSessionNoIdOrTimestamps;

    // Delete all potentially conflicting keys based on DatabaseCategoryType
    switch (trainingSession[TrainingSessionKeys.DATABASE_CATEGORY]) {
      case TrainingSessionDatabaseCategoryTypes.CANONICAL:
        Object.keys(PersonalSessionFragmentKeys).forEach(key => {
          const propertyToDelete = clone[key];
          if (propertyToDelete) {
            delete clone[key];
          }
        });
        incompleteTrainingSessionNoId = clone;
        break;
      case TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT:
        Object.keys(PlanSessionFragmentKeys).forEach(key => {
          const propertyToDelete = clone[key];
          if (propertyToDelete) {
            delete clone[key];
          }
        });
        incompleteTrainingSessionNoId = clone;
        break;
      case TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT:
          Object.keys(PersonalSessionFragmentKeys).forEach(key => {
            const propertyToDelete = clone[key];
            if (propertyToDelete) {
              delete clone[key];
            }
          });
          incompleteTrainingSessionNoId = clone;
          break;
      default:
        throw new Error('No databaseCategory found. Cannot buildTrainingSessionNoId.');
    }
    return incompleteTrainingSessionNoId;
  }

  ngOnDestroy(): void {
    this.combinedAddTrainingSessionToQueueSubscription?.unsubscribe();
  }

}
