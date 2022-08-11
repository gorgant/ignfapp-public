import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription, take } from 'rxjs';
import { distinctUntilChanged, map, withLatestFrom } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingSessionDatabaseCategoryTypes, TrainingSession, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps } from 'shared-models/train/training-session.model';
import { PlanSessionFragmentStoreActions, PlanSessionFragmentStoreSelectors, RootStoreState, TrainingPlanStoreActions, TrainingPlanStoreSelectors, TrainingSessionStoreActions, TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { TrainingSessionCompleteDialogueComponent } from './training-session-complete-dialogue/training-session-complete-dialogue.component';
import { TrainingSessionDetailsComponent } from './training-session-details/training-session-details.component';
import { TrainingSessionVideoComponent } from './training-session-video/training-session-video.component';
import { ComponentCanDeactivate } from 'src/app/core/route-guards/unsaved-changes.guard';
import { CanDeactivateData } from 'shared-models/utils/can-deactivate-data.model';
import { TrainingSessionCompletionData } from 'shared-models/train/training-record.model';
import { ActionConfirmDialogueComponent } from 'src/app/shared/components/action-confirm-dialogue/action-confirm-dialogue.component';
import { ActionConfData } from 'shared-models/forms/action-conf-data.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { TrainingPlan, AddTrainingPlanUrlParams, AddTrainingPlanUrlParamsKeys } from 'shared-models/train/training-plan.model';
import { PlanSessionFragment, PlanSessionFragmentKeys, PlanSessionFragmentNoIdOrTimestamp, ViewPlanSessionFragmentUrlParams } from 'shared-models/train/plan-session-fragment.model';
import { UiService } from 'src/app/core/services/ui.service';
import { Timestamp } from '@angular/fire/firestore';
import { PersonalSessionFragment, PersonalSessionFragmentKeys, ViewPersonalSessionFragmentUrlParams } from 'shared-models/train/personal-session-fragment.model';

@Component({
  selector: 'app-training-session',
  templateUrl: './training-session.component.html',
  styleUrls: ['./training-session.component.scss']
})
export class TrainingSessionComponent implements OnInit, ComponentCanDeactivate, OnDestroy {

  userData$!: Observable<PublicUser | null>;

  ADD_TRAINING_SESSION_TO_PLAN_BUTTON_VALUE = GlobalFieldValues.ADD_TRAINING_SESSION;
  CANCEL_TRAINING_BUTTON_VALUE = GlobalFieldValues.CANCEL_TRAINING;
  CANCEL_TRAINING_CONF_BODY = GlobalFieldValues.CANCEL_TRAINING_CONF_BODY;
  CANCEL_TRAINING_CONF_TITLE = GlobalFieldValues.CANCEL_TRAINING;
  COMPLETE_TRAINING_BUTTON_VALUE = GlobalFieldValues.COMPLETE_TRAINING;
  EDIT_TRAINING_SESSION_BUTTON_VALUE = GlobalFieldValues.EDIT_SESSION;
  GO_BACK_BUTTON_VALUE = GlobalFieldValues.GO_BACK;
  PAUSE_TRAINING_BUTTON_VALUE = GlobalFieldValues.PAUSE_TRAINING;
  RESUME_TRAINING_BUTTON_VALUE = GlobalFieldValues.RESUME_TRAINING;
  SCHEDULE_LATER_BUTTON_VALUE = GlobalFieldValues.SCHEDULE_LATER;
  START_NOW_BUTTON_VALUE = GlobalFieldValues.START_NOW;

  trainingSessionData$!: Observable<TrainingSession | PlanSessionFragment | PersonalSessionFragment | undefined>;
  fetchTrainingSessionProcessing$!: Observable<boolean>;

  videoInitialized: boolean = false;

  @ViewChild('videoComponent') videoComponent!: TrainingSessionVideoComponent;
  @ViewChild('detailsComponent') detailsComponent!: TrainingSessionDetailsComponent;

  sessionDuration!: number | null;
  sessionStartTime!: number | null;
  sessionEndTime!: number | null;
  sessionPaused!: boolean;
  sessionCompleted!: boolean;
  videoStateSubscription!: Subscription;

  trainingPlanBuilderRequest!: boolean;
  createPlanSessionFragmentProcessing$!: Observable<boolean>;
  createPlanSessionFragmentSubscription!: Subscription;
  createPlanSessionFragmentError$!: Observable<{} | null>;
  createPlanSessionFragmentSubmitted!: boolean;

  fetchAllPlanSessionFragmentsProcessing$!: Observable<boolean>;
  fetchAllPlanSessionFragmentsError$!: Observable<{} | null>;
  planSessionFragmentsLoaded!: boolean;
  planSessionFragmentData$!: Observable<PlanSessionFragment[]>;

  fetchSingleTrainingPlanProcessing$!: Observable<boolean>;
  fetchSingleTrainingPlanError$!: Observable<{} | null>;
  trainingPlanLoaded!: boolean;
  trainingPlanData$!: Observable<TrainingPlan | undefined>;

  serverRequestProcessing!: Observable<boolean>;

  addTrainingSessionSubscription!: Subscription;

  databaseCategoryType!: TrainingSessionDatabaseCategoryTypes;
  planSessionFragmentQueryParams: ViewPlanSessionFragmentUrlParams | undefined;
  personalSessionFragmentQueryParams: ViewPersonalSessionFragmentUrlParams | undefined;

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private uiService: UiService
  ) { }

  ngOnInit(): void {
    this.checkForAdditionalViewSessionData();
    this.checkForAddSessionRequest();
    this.monitorProcesses();
    this.getTrainingSessionData();
  }

  private checkForAddSessionRequest() {
    const addTrainingSessionString = this.route.snapshot.queryParamMap.get(AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST);
    if (addTrainingSessionString) {
      const addTrainingSession = JSON.parse(addTrainingSessionString) as boolean;
      if (addTrainingSession) {
        console.log('Plan builder request detected');
        this.trainingPlanBuilderRequest = true;
      }
    }
  }

  // Pulls data from params if source is a planSessionFragment or personalSessionFragment
  private checkForAdditionalViewSessionData() {
    const databaseCategoryType = this.route.snapshot.queryParamMap.get(TrainingSessionKeys.DATABASE_CATEGORY);
    if (databaseCategoryType) {
      console.log('Alternate database category detected');
      this.databaseCategoryType = databaseCategoryType as TrainingSessionDatabaseCategoryTypes;
      if (databaseCategoryType === TrainingSessionDatabaseCategoryTypes.PLAN_FRAGMENT) {
        this.planSessionFragmentQueryParams = this.route.snapshot.queryParams as ViewPlanSessionFragmentUrlParams;
      }
      if (databaseCategoryType === TrainingSessionDatabaseCategoryTypes.PERSONAL_FRAGMENT) {
        this.personalSessionFragmentQueryParams = this.route.snapshot.queryParams as ViewPersonalSessionFragmentUrlParams;
      }
    }
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectUserData);
    this.fetchTrainingSessionProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchSingleTrainingSessionProcessing);

    this.fetchAllPlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsProcessing);
    this.fetchAllPlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchMultiplePlanSessionFragmentsError);

    this.createPlanSessionFragmentProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectCreatePlanSessionFragmentProcessing);
    this.createPlanSessionFragmentError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectCreatePlanSessionFragmentError);

    this.fetchSingleTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanProcessing);
    this.fetchSingleTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanError);

    this.serverRequestProcessing = combineLatest(
      [
        this.createPlanSessionFragmentProcessing$,
        this.fetchSingleTrainingPlanProcessing$,
      ]
    ).pipe(
        map(([creatingPlanSessionFragment, fetchSingleTrainingPlanProcessing]) => {
          if (creatingPlanSessionFragment || fetchSingleTrainingPlanProcessing) {
            return true
          }
          return false
        })
    );

  }

  private getSessionIdFromParams(): string {
    const idParamName = 'id';
    let trainingSessionId: string;

    if (this.planSessionFragmentQueryParams) {
      trainingSessionId = this.planSessionFragmentQueryParams[PlanSessionFragmentKeys.CANONICAL_ID];
      return trainingSessionId;
    }

    if (this.personalSessionFragmentQueryParams) {
      trainingSessionId = this.personalSessionFragmentQueryParams[PersonalSessionFragmentKeys.CANONICAL_ID];
      return trainingSessionId;
    }

    trainingSessionId = this.route.snapshot.params[idParamName];
    return trainingSessionId;
  }

  private getTrainingSessionData() {
    
    const trainingSessionId = this.getSessionIdFromParams();
    this.trainingSessionData$ = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(trainingSessionId))
        .pipe(
          withLatestFrom(this.fetchTrainingSessionProcessing$),
          map(([trainingSession, fetchProcessing]) => {
            if (!trainingSession && !fetchProcessing) {
              console.log(`Session ${trainingSessionId} not in store, fetching from database`);
              this.store$.dispatch(TrainingSessionStoreActions.fetchSingleTrainingSessionRequested({sessionId: trainingSessionId}));
            }
            return trainingSession;
          })
        )
  }

  // Update training status if user interacts with video widget directly
  private monitorVideoState() {
    this.videoStateSubscription = this.videoComponent.ytVideoPlayerApi.stateChange
      .pipe(distinctUntilChanged())
      .subscribe(event => {
        const currentState = event.data;

        switch (currentState) {
          case YT.PlayerState.PAUSED: {
            if (!this.sessionPaused) {
              this.onPauseTrainingSession();
            }
            break;
          }
          
          case YT.PlayerState.ENDED: {
            if (!this.sessionCompleted) {
              this.onCompleteTrainingSession();
            }
            break;
          }

          case YT.PlayerState.PLAYING: {
            if (this.sessionPaused) {
              this.onResumeTrainingSession();
            }
            break;
          }
        }

      })
  }

  onBeginTrainingSession() {
    this.videoInitialized = true;
    this.detailsComponent.expansionPanel.close();
    this.videoComponent.ytVideoPlayerApi.playVideo();
    this.sessionStartTime = Timestamp.now().toMillis();
    this.monitorVideoState();
  }

  onPauseTrainingSession() {
    console.log('Pausing training session');
    this.videoComponent.ytVideoPlayerApi.pauseVideo();
    this.sessionEndTime = Timestamp.now().toMillis();
    this.sessionDuration = this.sessionDuration ? this.sessionEndTime! - this.sessionStartTime! + this.sessionDuration : this.sessionEndTime! - this.sessionStartTime!;
    this.sessionStartTime = null;
    this.sessionEndTime = null;
    this.sessionPaused = true;
  }

  onResumeTrainingSession() {
    console.log('Resuming training session');
    this.videoComponent.ytVideoPlayerApi.playVideo();
    this.sessionStartTime = Timestamp.now().toMillis();
    this.sessionPaused = false;
  }

  onCompleteTrainingSession() {
    if (!this.sessionPaused) {
      this.onPauseTrainingSession();
    }
    
    this.trainingSessionData$
      .pipe(
        take(1),
        withLatestFrom(this.userData$)
        )
      .subscribe(([trainingSessionData, userData]) => {

        const sessionCompletionData: TrainingSessionCompletionData = {
          trainingSession: trainingSessionData!,
          sessionDuration: this.sessionDuration!,
          userId: userData!.id,
          personalSessionFragmentId: this.personalSessionFragmentQueryParams?.id
        }

        const dialogConfig = new MatDialogConfig();
      
        dialogConfig.autoFocus = false;
        dialogConfig.width = '90%';
        dialogConfig.maxWidth = '600px';
    
        dialogConfig.data = sessionCompletionData;
        
        const dialogRef = this.dialog.open(TrainingSessionCompleteDialogueComponent, dialogConfig);
    
        dialogRef.afterClosed().subscribe(submitted => {
          if (submitted) {
            this.videoComponent.ytVideoPlayerApi.stopVideo();
            this.videoInitialized = false;
            this.sessionCompleted = true;
            this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
          }
      });

    })
  }

  onCancelTrainingSession() {
    this.onPauseTrainingSession();

    const dialogConfig = new MatDialogConfig();
    const actionConfData: ActionConfData = {
      title: this.CANCEL_TRAINING_CONF_TITLE,
      body: this.CANCEL_TRAINING_CONF_BODY,
    };

    dialogConfig.data = actionConfData;
    
    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.sessionStartTime = null;
        this.sessionEndTime = null;
        this.sessionDuration = null;
        this.videoComponent.ytVideoPlayerApi.stopVideo();
        this.videoInitialized = false;

      } else {
        this.onResumeTrainingSession();
      }
    });
  }

  onScheduleLater() {
    // TODO: Implement a date/time modal and add to user training calendar
  }

  onEditTrainingSession(sessionId: string) {
    this.router.navigate([PublicAppRoutes.TRAINING_SESSION_EDIT, sessionId]);
  }

  private monitorAllPlanSessionFragments(trainingPlanId: string) {
    this.planSessionFragmentData$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsInStore)
      .pipe(
        withLatestFrom(
          this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsProcessing),
          this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsError),
          this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsFetched),
        ),
        map(([planSessionFragments, loadingPlanSessionFragments, loadError, allPlanSessionFragmentsFetched]) => {
          console.log('planSessionFragment subscription fired with this value', planSessionFragments);
          if (loadError) {
            console.log('Error loading planSessionFragments in component', loadError);
            this.planSessionFragmentsLoaded = false;
          }
  
          // Check if sessions are loaded, if not fetch from server
          if (!loadingPlanSessionFragments && !this.planSessionFragmentsLoaded && !allPlanSessionFragmentsFetched) {
            this.store$.dispatch(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsRequested({trainingPlanId}));
            this.planSessionFragmentsLoaded = true;
          }
          return planSessionFragments.filter(fragment => fragment.trainingPlanId === trainingPlanId);
        }),
      )
  }

  private monitorSingleTrainingPlan(trainingPlanId: string) {
    this.trainingPlanData$ = this.store$.select(TrainingPlanStoreSelectors.selectTrainingPlanById(trainingPlanId))
      .pipe(
        withLatestFrom(
          this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanProcessing),
          this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanError),
        ),
        map(([trainingPlan, loadingTrainingPlans, loadError]) => {
          console.log('trainingPlan subscription fired with this value', trainingPlan);
          if (loadError) {
            console.log('Error loading trainingPlan in component', loadError);
            this.trainingPlanLoaded = false;
          }
  
          // Check if sessions are loaded, if not fetch from server
          if (!loadingTrainingPlans && !this.trainingPlanLoaded) {
            this.store$.dispatch(TrainingPlanStoreActions.fetchSingleTrainingPlanRequested({trainingPlanId}));
            this.trainingPlanLoaded = true;
          }
          
          return trainingPlan;
        })
      )
  }

  // Gather planSessionFragment collection and trainingPlan and then use that create a planSessionFragment
  onAddTrainingSessionToPlan(trainingSessionData: TrainingSession) {
    const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_ID) as string;

    this.monitorAllPlanSessionFragments(trainingPlanId);

    this.monitorSingleTrainingPlan(trainingPlanId);

    const trainingSessionToModify: any = {...trainingSessionData};

    delete trainingSessionToModify.id;

    const trainingSessionNoId = trainingSessionToModify as TrainingSessionNoIdOrTimestamps;

    this.addTrainingSessionSubscription = combineLatest([this.planSessionFragmentData$, this.trainingPlanData$])
      .subscribe(([planSessionFragments, trainingPlan]) => {
        console.log('addTrainingSessionSubscription fired with these values', planSessionFragments, trainingPlan);
        if (planSessionFragments && trainingPlan && !this.createPlanSessionFragmentSubmitted) {
          const indexOfFinalItem = planSessionFragments.length - 1;
          const planSessionFragmentNoId: PlanSessionFragmentNoIdOrTimestamp = {
            ...trainingSessionNoId,
            [PlanSessionFragmentKeys.CANONICAL_ID]: trainingSessionData.id,
            [TrainingSessionKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.PLAN_FRAGMENT,
            [PlanSessionFragmentKeys.TRAINING_PLAN_ID]: trainingPlanId,
            [PlanSessionFragmentKeys.TRAINING_PLAN_INDEX]: indexOfFinalItem + 1,
            [PlanSessionFragmentKeys.TRAINING_PLAN_OWNER_ID]: trainingPlan.creatorId
          }

          this.store$.dispatch(PlanSessionFragmentStoreActions.createPlanSessionFragmentRequested({trainingPlanId, planSessionFragmentNoId}));
          if (this.addTrainingSessionSubscription) {
            this.addTrainingSessionSubscription.unsubscribe();
          }
          this.createPlanSessionFragmentSubmitted = true;
          this.postAddTrainingSessionToPlanActions();
        }
      })
  }

  private postAddTrainingSessionToPlanActions() {
    this.createPlanSessionFragmentSubscription = this.createPlanSessionFragmentProcessing$
      .pipe(
        withLatestFrom(
          this.createPlanSessionFragmentError$,
        ),
      )
      .subscribe(([creatingPlanSessionFragment, creationError]) => {
        if (creationError) {
          console.log('Error creating planSessionFragment in database, terminating function');
          this.createPlanSessionFragmentSubscription.unsubscribe();
          this.createPlanSessionFragmentSubmitted = false;
          return;
        }
        
        if (creatingPlanSessionFragment) {
          this.createPlanSessionFragmentSubmitted = true;
        }

        if (!creatingPlanSessionFragment && this.createPlanSessionFragmentSubmitted) {
          console.log('planSessionFragment creation successful.');
          this.uiService.showSnackBar(`Training Session Added to Plan!`, 5000);
          if (this.createPlanSessionFragmentSubscription) {
            this.createPlanSessionFragmentSubscription.unsubscribe();
          }
          this.onNavigateToTrainingSessionSelection();
        }
      })
  }

  onNavigateToTrainingSessionSelection() {
    const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_ID) as string;
    const queryParams: AddTrainingPlanUrlParams = {
      [AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: true,
      [AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_ID]: trainingPlanId
    }
    const navigationExtras: NavigationExtras = {queryParams};
    this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
  }

  // @HostListener allows us to also CanDeactivate Guard against browser refresh, close, etc.
  @HostListener('window:beforeunload') canDeactivate(): Observable<CanDeactivateData> | CanDeactivateData {
    
    // Check if there is a session in progress, if so, warn user before deactivating
    const trainingSessionInProgress = (!!this.sessionStartTime || !!this.sessionDuration) && !this.sessionCompleted;

    const warningMessage: CanDeactivateData = {
      deactivationPermitted: !trainingSessionInProgress,
      warningMessage: {
        title: this.CANCEL_TRAINING_CONF_TITLE,
        body: this.CANCEL_TRAINING_CONF_BODY
      }
    }
    
   return warningMessage;
  }

  ngOnDestroy(): void {
    if (this.videoStateSubscription) {
      this.videoStateSubscription.unsubscribe();
    }

    if (this.createPlanSessionFragmentSubscription) {
      this.createPlanSessionFragmentSubscription.unsubscribe();
    }

    if (this.addTrainingSessionSubscription) {
      this.addTrainingSessionSubscription.unsubscribe();
    }
  }
}
