import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, Subject, takeUntil, withLatestFrom, map } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PersonalSessionFragment, ViewPersonalSessionFragmentUrlParams, PersonalSessionFragmentKeys, PersonalSessionFragmentNoIdOrTimestamp } from 'shared-models/train/personal-session-fragment.model';
import { ViewPlanSessionFragmentUrlParams } from 'shared-models/train/plan-session-fragment.model';
import { TrainingSession, TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { RootStoreState, PersonalSessionFragmentStoreSelectors, PersonalSessionFragmentStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-add-training-session-to-personal-queue-button',
  templateUrl: './add-training-session-to-personal-queue-button.component.html',
  styleUrls: ['./add-training-session-to-personal-queue-button.component.scss']
})
export class AddTrainingSessionToPersonalQueueButtonComponent implements OnInit {

  // TODO: In the process of reformatting this to be for personal queue rather than personal and thus removing/replacing most personal-related functionality
  
  @Input() trainingSessionData!: TrainingSession;

  ADD_TRAINING_SESSION_TO_PERSONAL_QUEUE_BUTTON_VALUE = GlobalFieldValues.ADD_TO_MY_QUEUE;

  createPersonalSessionFragmentProcessing$!: Observable<boolean>;
  createPersonalSessionFragmentError$!: Observable<{} | null>;
  createPersonalSessionFragmentSubmitted!: boolean;
  createPersonalSessionFragmentSubscription!: Subscription;

  fetchAllPersonalSessionFragmentsProcessing$!: Observable<boolean>;
  fetchAllPersonalSessionFragmentsError$!: Observable<{} | null>;
  personalSessionFragmentsLoaded!: boolean;
  personalSessionFragmentData$!: Observable<PersonalSessionFragment[]>;

  userData$!: Observable<PublicUser | null>;

  // serverRequestProcessing!: Observable<boolean>;

  addTrainingSessionSubscription!: Subscription;

  // databaseCategoryType!: TrainingSessionDatabaseCategoryTypes;
  // personalSessionFragmentQueryParams: ViewPersonalSessionFragmentUrlParams | undefined;
  // planSessionFragmentQueryParams: ViewPlanSessionFragmentUrlParams | undefined;

  unsubAllRequested$: Subject<void> = new Subject();
  unsubButtonRequested$: Subject<void> = new Subject();

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private route: ActivatedRoute,
    private router: Router,
    private uiService: UiService
  ) { }

  ngOnInit(): void {
    // Note everything is triggered by button click to conserve resources since this gets duplicated a lot on a list view
    // Additionally, since this doesn't get destroyed in a list view, we aggressively unsubscribe after we complete the necessary action
  }

  private monitorProcesses() {
    this.fetchAllPersonalSessionFragmentsProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsProcessing)
      .pipe(takeUntil(this.unsubAllRequested$));
    this.fetchAllPersonalSessionFragmentsError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchMultiplePersonalSessionFragmentsError)
      .pipe(takeUntil(this.unsubAllRequested$));

    this.createPersonalSessionFragmentProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectCreatePersonalSessionFragmentProcessing)
      .pipe(takeUntil(this.unsubAllRequested$));
    this.createPersonalSessionFragmentError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectCreatePersonalSessionFragmentError)
      .pipe(takeUntil(this.unsubAllRequested$));

    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData)
      .pipe(takeUntil(this.unsubAllRequested$));

  }

  // // Pulls data from params if source is a personalSessionFragment or personalSessionFragment
  // private checkForAdditionalViewSessionData() {
  //   const databaseCategoryType = this.route.snapshot.queryParamMap.get(TrainingSessionKeys.DATABASE_CATEGORY);
  //   if (databaseCategoryType) {
  //     console.log('Alternate database category detected');
  //     this.databaseCategoryType = databaseCategoryType as TrainingSessionDatabaseCategoryTypes;
  //     if (databaseCategoryType === TrainingSessionDatabaseCategoryTypes.PLAN_FRAGMENT) {
  //       this.planSessionFragmentQueryParams = this.route.snapshot.queryParams as ViewPlanSessionFragmentUrlParams;
  //     }
  //     if (databaseCategoryType === TrainingSessionDatabaseCategoryTypes.PERSONAL_FRAGMENT) {
  //       this.personalSessionFragmentQueryParams = this.route.snapshot.queryParams as ViewPersonalSessionFragmentUrlParams;
  //     }
  //   }
  // }

  private monitorAllPersonalSessionFragments() {
    this.personalSessionFragmentData$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsInStore)
      .pipe(
        takeUntil(this.unsubAllRequested$),
        withLatestFrom(
          this.fetchAllPersonalSessionFragmentsProcessing$,
          this.fetchAllPersonalSessionFragmentsError$,
          this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsFetched),
          this.userData$
        ),
        map(([personalSessionFragments, loadingPersonalSessionFragments, loadError, allPersonalSessionFragmentsFetched, userData]) => {
          console.log('personalSessionFragment subscription fired with this value', personalSessionFragments);
          if (loadError) {
            console.log('Error loading personalSessionFragments in component', loadError);
            this.personalSessionFragmentsLoaded = false;
          }
  
          // Check if sessions are loaded, if not fetch from server
          if (!loadingPersonalSessionFragments && !this.personalSessionFragmentsLoaded && !allPersonalSessionFragmentsFetched && userData) {
            this.store$.dispatch(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsRequested({userId: userData.id}));
            this.personalSessionFragmentsLoaded = true;
          }
          return personalSessionFragments;
        }),
      )
  }

  // Gather personalSessionFragment collection and trainingPersonal and then use that create a personalSessionFragment
  onAddTrainingSessionToPersonalQueue() {
    if (this.createPersonalSessionFragmentSubmitted) {
      console.log(`Create personalSessionFragment already created for ${this.trainingSessionData.id}`, this.createPersonalSessionFragmentSubmitted)
      return;
    }

    // this.checkForAdditionalViewSessionData();
    this.monitorProcesses();
    
    this.monitorAllPersonalSessionFragments();

    const trainingSessionToModify: any = {...this.trainingSessionData};

    delete trainingSessionToModify.id;

    const trainingSessionNoId = trainingSessionToModify as TrainingSessionNoIdOrTimestamps;

    this.addTrainingSessionSubscription = this.personalSessionFragmentData$
      .pipe(
        takeUntil(this.unsubButtonRequested$),
        withLatestFrom(
          this.userData$
        ),
      )
      .subscribe(([personalSessionFragments, userData]) => {
        if (personalSessionFragments && !this.createPersonalSessionFragmentSubmitted && userData) {
          const indexOfFinalItem = personalSessionFragments.length - 1;
          const personalSessionFragmentNoId: PersonalSessionFragmentNoIdOrTimestamp = {
            ...trainingSessionNoId,
            [PersonalSessionFragmentKeys.CANONICAL_ID]: this.trainingSessionData.id,
            [PersonalSessionFragmentKeys.COMPLETE]: false,
            [TrainingSessionKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.PERSONAL_FRAGMENT,
            [PersonalSessionFragmentKeys.QUEUE_INDEX]: indexOfFinalItem + 1,
            [PersonalSessionFragmentKeys.USER_ID]: userData.id
          }
          this.unsubButton();
          this.store$.dispatch(PersonalSessionFragmentStoreActions.createPersonalSessionFragmentRequested({userId: userData.id, personalSessionFragmentNoId}));
          this.createPersonalSessionFragmentSubmitted = true;
          if (this.addTrainingSessionSubscription) {
            console.log('Unsubbing addTrainingSessionSubscription');
            this.addTrainingSessionSubscription.unsubscribe();
          }
          this.postAddTrainingSessionToPersonalQueueActions();
        }
      })
  }


  // Once training session has been added to personal, update the personal data accordingly
  private postAddTrainingSessionToPersonalQueueActions() {
    this.createPersonalSessionFragmentSubscription = this.createPersonalSessionFragmentProcessing$
    .pipe(
      takeUntil(this.unsubAllRequested$),
      withLatestFrom(
        this.createPersonalSessionFragmentError$,
      ),
    )
    .subscribe(([creatingPersonalSessionFragment, creationError]) => {
      if (creationError) {
        console.log('Error creating personalSessionFragment in database, terminating function');
        this.createPersonalSessionFragmentSubscription.unsubscribe();
        this.createPersonalSessionFragmentSubmitted = false;
        return;
      }
      
      if (!creatingPersonalSessionFragment && this.createPersonalSessionFragmentSubmitted) {
        console.log('personalSessionFragment creation successful.');
        if (this.createPersonalSessionFragmentSubscription) {
          this.createPersonalSessionFragmentSubscription.unsubscribe();
        }
        this.uiService.showSnackBar(`Training Session Added to Training Queue!`, 5000);
        this.navigateToTrainingSessionSelection();

      }
    })
  }

  // TODO: configure this to show the Sessions tab
  private navigateToTrainingSessionSelection() {
    console.log('Navigating to training session selection');
    this.unsubAll();
    this.router.navigate([PublicAppRoutes.BROWSE]);
  }

  private unsubAll() {
    this.unsubAllRequested$.next();
    this.unsubAllRequested$.complete(); // Send signal to subscriptions to unsubscribe
    this.unsubAllRequested$ = new Subject<void>(); // Reinitialize the unsubscribe subject in case page isn't refreshed after logout (which means auth wouldn't reset)
  }

  private unsubButton() {
    this.unsubButtonRequested$.next();
    this.unsubButtonRequested$.complete(); // Send signal to subscriptions to unsubscribe
    this.unsubButtonRequested$ = new Subject<void>(); // Reinitialize the unsubscribe subject in case page isn't refreshed after logout (which means auth wouldn't reset)
  }

  ngOnDestroy(): void {
    if (this.createPersonalSessionFragmentSubscription) {
      this.createPersonalSessionFragmentSubscription.unsubscribe();
    }

    if (this.addTrainingSessionSubscription) {
      this.addTrainingSessionSubscription.unsubscribe();
    }
  }

}
