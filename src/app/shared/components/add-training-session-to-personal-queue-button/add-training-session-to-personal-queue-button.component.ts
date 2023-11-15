import { Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription, withLatestFrom, map, catchError, combineLatest, filter, switchMap, tap, throwError } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PersonalSessionFragment, PersonalSessionFragmentKeys, PersonalSessionFragmentNoIdOrTimestamp } from 'shared-models/train/personal-session-fragment.model';
import { TrainingSession, TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { PersonalSessionFragmentStoreSelectors, PersonalSessionFragmentStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-add-training-session-to-personal-queue-button',
  templateUrl: './add-training-session-to-personal-queue-button.component.html',
  styleUrls: ['./add-training-session-to-personal-queue-button.component.scss']
})
export class AddTrainingSessionToPersonalQueueButtonComponent implements OnInit, OnDestroy {

  @Input() trainingSessionData!: TrainingSession;

  ADD_TO_MY_QUEUE_BUTTON_VALUE = GlobalFieldValues.ADD_TO_MY_QUEUE;

  $isActiveButton = signal(false); // Identifies the instance of the button being clicked vs all other instances of buttons

  private userData$!: Observable<PublicUser | null>;

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

    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData);

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
    console.log('onAddTrainingSessionToQueue click registered');
    this.$isActiveButton.set(true);

    // Convert current trainingSession into a no-id version to serve as the base for the planSessionFragment
    const currentTrainingSessionClone: any = {...this.trainingSessionData};
    delete currentTrainingSessionClone.id;
    delete currentTrainingSessionClone[TrainingSessionKeys.CREATED_TIMESTAMP];
    delete currentTrainingSessionClone[TrainingSessionKeys.LAST_MODIFIED_TIMESTAMP];
    const trainingSessionNoId = currentTrainingSessionClone as TrainingSessionNoIdOrTimestamps;

    // This does the following: 1) Fetch personalSessionFragments 2) create new personalSessionFragment and add it to the queue
    this.combinedAddTrainingSessionToQueueSubscription = this.combinedAddTrainingSessionToQueueError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.combinedAddTrainingSessionToQueueSubscription?.unsubscribe();

          }
          return this.allPersonalSessionFragmentsInStore$;
        }),
        withLatestFrom(this.userData$, this.combinedAddTrainingSessionToQueueError$),
        filter(([personalSessionFragments, userData, processingError]) => !processingError),
        switchMap(([personalSessionFragments, userData, processingError]) => {
          if (!this.$fetchPersonalSessionFragmentsSubmitted()) {
            this.$fetchPersonalSessionFragmentsSubmitted.set(true);
            console.log(`no personalSessionFragments in store, fetching from database`);
            this.store$.dispatch(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsRequested({userId: userData!.id}));
          }
          return this.allPersonalSessionFragmentsInStore$;
        }),
        withLatestFrom(this.userData$, this.allPersonalSessionFragmentsFetched$),
        filter(([personalSessionFragments, userData, allFetched]) => allFetched),
        switchMap(([personalSessionFragments, userData, allFetched]) => {
          const indexOfNewItem = personalSessionFragments.length;
          const personalSessionFragmentNoId: PersonalSessionFragmentNoIdOrTimestamp = {
            ...trainingSessionNoId,
            [PersonalSessionFragmentKeys.CANONICAL_ID]: this.trainingSessionData.id,
            [PersonalSessionFragmentKeys.COMPLETE]: false,
            [TrainingSessionKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT,
            [PersonalSessionFragmentKeys.QUEUE_INDEX]: indexOfNewItem,
            [PersonalSessionFragmentKeys.USER_ID]: userData!.id
          };
          if(!this.$createPersonalSessionFragmentSubmitted()) {
            this.store$.dispatch(PersonalSessionFragmentStoreActions.createPersonalSessionFragmentRequested({userId: userData!.id, personalSessionFragmentNoId}));
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
          // TODO: Have this snackbar show offer an action to route to the queue
          this.uiService.showSnackBar(`Training Session Added to Personal Queue!`, 10000);
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 10000);
          this.combinedAddTrainingSessionToQueueSubscription?.unsubscribe();
          this.resetComponentState();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }


  private resetComponentState() {
    this.$isActiveButton.set(false);
    this.$fetchPersonalSessionFragmentsSubmitted.set(false);
    this.$createPersonalSessionFragmentSubmitted.set(false);
    this.$createPersonalSessionFragmentCycleInit.set(false);
    this.$createPersonalSessionFragmentCycleComplete.set(false);
  }

  ngOnDestroy(): void {
    this.combinedAddTrainingSessionToQueueSubscription?.unsubscribe();
  }

}
