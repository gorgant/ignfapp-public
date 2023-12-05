import { Component, HostListener, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, take, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { CanonicalTrainingSession, TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, BrowseTrainingSessionsQueryParams, BrowseTrainingSessionsQueryParamsKeys, TrainingSessionVisibilityCategoryDbOption, ViewCanonicalTrainingSessionQueryParamsKeys, ViewCanonicalTrainingSessionQueryParams } from 'shared-models/train/training-session.model';
import { PersonalSessionFragmentStoreActions, PersonalSessionFragmentStoreSelectors, PlanSessionFragmentStoreActions, PlanSessionFragmentStoreSelectors, TrainingSessionStoreActions, TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
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
import { AddTrainingSessionToPlanQueryParams, AddTrainingSessionUrlToPlanParamsKeys, TrainingPlanKeys, TrainingPlanVisibilityCategoryDbOption } from 'shared-models/train/training-plan.model';
import { DeletePlanSessionFragmentQueryParams, DeletePlanSessionFragmentQueryParamsKeys, PlanSessionFragment, PlanSessionFragmentKeys, ViewPlanSessionFragmentQueryParams } from 'shared-models/train/plan-session-fragment.model';
import { Timestamp } from '@angular/fire/firestore';
import { DeletePersonalSessionFragmentUrlParams, DeletePersonalSessionFragmentUrlParamsKeys, PersonalSessionFragment, PersonalSessionFragmentKeys, ViewPersonalSessionFragmentQueryParams } from 'shared-models/train/personal-session-fragment.model';
import { UiService } from 'src/app/core/services/ui.service';
import { TypedAction } from '@ngrx/store/src/models';
import { DialogueBoxDefaultConfig } from 'shared-models/user-interface/dialogue-box-default-config.model';

@Component({
  selector: 'app-training-session',
  templateUrl: './training-session.component.html',
  styleUrls: ['./training-session.component.scss']
})
export class TrainingSessionComponent implements OnInit, ComponentCanDeactivate, OnDestroy {

  userData$!: Observable<PublicUser | null>;

  ADD_TO_MY_QUEUE_BUTTON_VALUE = GlobalFieldValues.ADD_TO_MY_QUEUE;
  ADD_TRAINING_SESSION_TO_PLAN_BUTTON_VALUE = GlobalFieldValues.ADD_TO_PLAN;
  CANCEL_TRAINING_BUTTON_VALUE = GlobalFieldValues.CANCEL_TRAINING;
  CANCEL_TRAINING_CONF_BODY = GlobalFieldValues.CANCEL_TRAINING_CONF_BODY;
  CANCEL_TRAINING_CONF_TITLE = GlobalFieldValues.CANCEL_TRAINING;
  COMPLETE_TRAINING_BUTTON_VALUE = GlobalFieldValues.COMPLETE_TRAINING;
  DELETE_TRAINING_SESSION_BUTTON_VALUE = GlobalFieldValues.DELETE_TRAINING_SESSION;
  DELETE_TRAINING_SESSION_CONF_BODY = GlobalFieldValues.DELETE_TRAINING_SESSION_CONF_BODY;
  DELETE_TRAINING_SESSION_CONF_TITLE = GlobalFieldValues.DELETE_TRAINING_SESSION_CONF_TITLE;
  EDIT_TRAINING_SESSION_BUTTON_VALUE = GlobalFieldValues.EDIT_SESSION;
  GO_BACK_BUTTON_VALUE = GlobalFieldValues.GO_BACK;
  PAUSE_TRAINING_BUTTON_VALUE = GlobalFieldValues.PAUSE_TRAINING;
  REMOVE_FROM_PERSONAL_QUEUE_BUTTON_VALUE = GlobalFieldValues.REMOVE_FROM_PERSONAL_QUEUE;
  REMOVE_FROM_TRAINING_PLAN_BUTTON_VALUE = GlobalFieldValues.REMOVE_FROM_TRAINING_PLAN;
  RESUME_TRAINING_BUTTON_VALUE = GlobalFieldValues.RESUME_TRAINING;
  START_NOW_BUTTON_VALUE = GlobalFieldValues.START_NOW;

  private $localTrainingPlanId = signal(undefined as string | undefined);
  private $localPlanSessionFragmentId = signal(undefined as string | undefined);
  private $localPersonalSessionFragmentId = signal(undefined as string | undefined);
  private $trainingSessionFetchDataConfigured = signal(false);

  $localCanonicalTrainingSession = signal(undefined as CanonicalTrainingSession | undefined);
  $localPlanSessionFragment = signal(undefined as PlanSessionFragment | undefined);
  $localPersonalSessionFragment = signal(undefined as PersonalSessionFragment | undefined);
  $combinedLocalTrainingSessionData = computed(() => {
    return this.$localCanonicalTrainingSession() || this.$localPlanSessionFragment() || this.$localPersonalSessionFragment();
  });
  private $canonicalTrainingSessionId = signal(undefined as string | undefined);
  private fetchTrainingSessionProcessing$!: Observable<boolean>;
  private fetchTrainingSessionError$!: Observable<{} | null>;
  private $fetchSingleTrainingSessionSubmitted = signal(false);
  private localTrainingSessionSubscription!: Subscription;

  private deleteTrainingSessionSubscription!: Subscription;
  private deleteTrainingSessionProcessing$!: Observable<boolean>;
  private deleteTrainingSessionError$!: Observable<{} | null>;
  private $deleteTrainingSessionSubmitted = signal(false);
  $deleteTrainingSessionCycleInit = signal(false);
  private $deleteTrainingSessionCycleComplete = signal(false);

  videoInitialized = signal(false);

  @ViewChild('videoComponent') private videoComponent!: TrainingSessionVideoComponent;
  @ViewChild('detailsComponent') private detailsComponent!: TrainingSessionDetailsComponent;

  private sessionDuration = signal(undefined as number | undefined);
  private sessionStartTime = signal(undefined as number | undefined);
  private sessionEndTime = signal(undefined as number | undefined);
  sessionPaused = signal(false);
  private sessionCompleted = signal(false);
  private videoStateSubscription!: Subscription;

  $trainingPlanBuilderRequest = signal(false);
  readonly DATABASE_CATEGORY_TYPES = TrainingSessionDatabaseCategoryTypes;
  $databaseCategoryType = signal(undefined as TrainingSessionDatabaseCategoryTypes | undefined);

  private $planSessionFragmentQueryParams = signal(undefined as ViewPlanSessionFragmentQueryParams | undefined);
  private $personalSessionFragmentQueryParams = signal(undefined as ViewPersonalSessionFragmentQueryParams | undefined);

  private $trainingPlanVisibilityCategory = signal(undefined as TrainingPlanVisibilityCategoryDbOption | undefined);
  private $trainingSessionVisibilityCategory = signal(undefined as TrainingSessionVisibilityCategoryDbOption | undefined);

  private uiService = inject(UiService);
  private store$ = inject(Store);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  private fetchPlanSessionFragmentProcessing$!: Observable<boolean>;
  private fetchPlanSessionFragmentError$!: Observable<{} | null>;
  private fetchPersonalSessionFragmentProcessing$!: Observable<boolean>;
  private fetchPersonalSessionFragmentError$!: Observable<{} | null>;

  combinedFetchTrainingSessionDataProcessing$!: Observable<boolean>;
  private combinedFetchTrainingSessionDataError$!: Observable<{} | null>;
  
  constructor() { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.checkForPlanBuilderRequest();
    this.setTrainingSessionData();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData);
    
    this.fetchTrainingSessionProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchSingleTrainingSessionProcessing);
    this.fetchTrainingSessionError$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchSingleTrainingSessionError);
    
    this.fetchPlanSessionFragmentProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchSinglePlanSessionFragmentProcessing);
    this.fetchPlanSessionFragmentError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchSinglePlanSessionFragmentError);
    
    this.fetchPersonalSessionFragmentProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchSinglePersonalSessionFragmentProcessing);
    this.fetchPersonalSessionFragmentError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchSinglePersonalSessionFragmentError);

    this.deleteTrainingSessionProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectDeleteTrainingSessionProcessing);
    this.deleteTrainingSessionError$ = this.store$.select(TrainingSessionStoreSelectors.selectDeleteTrainingSessionError);

    this.combinedFetchTrainingSessionDataProcessing$ = combineLatest(
      [
        this.fetchTrainingSessionProcessing$,
        this.fetchPlanSessionFragmentProcessing$,
        this.fetchPersonalSessionFragmentProcessing$
      ]
    ).pipe(
        map(([fetchTrainingSessionProcessing, fetchPlanSessionFragmentProcessing, fetchPersonalSessionFragmentProcessing]) => {
          if (fetchTrainingSessionProcessing || fetchPlanSessionFragmentProcessing || fetchPersonalSessionFragmentProcessing) {
            return true
          }
          return false
        })
    );

    this.combinedFetchTrainingSessionDataError$ = combineLatest(
      [
        this.fetchTrainingSessionError$,
        this.fetchPlanSessionFragmentError$,
        this.fetchPersonalSessionFragmentError$
      ]
    ).pipe(
        map(([fetchTrainingSessionError, fetchPlanSessionFragmentError, fetchPersonalSessionFragmentError]) => {
          if (fetchTrainingSessionError || fetchPlanSessionFragmentError || fetchPersonalSessionFragmentError) {
            return fetchTrainingSessionError || fetchPlanSessionFragmentError || fetchPersonalSessionFragmentError
          }
          return null
        })
    );

  }

  private checkForPlanBuilderRequest() {
    const builderRequestParam = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_BUILDER_REQUEST);
    if (builderRequestParam && JSON.parse(builderRequestParam)) {
      console.log('Plan builder request detected');
      this.$trainingPlanBuilderRequest.set(true);
    }
  }

  // Pulls data from params if source is a planSessionFragment or personalSessionFragment
  private setDatabaseCategoryType() {
    const databaseCategoryType = this.route.snapshot.queryParamMap.get(TrainingSessionKeys.DATABASE_CATEGORY) as TrainingSessionDatabaseCategoryTypes | undefined;
    this.$databaseCategoryType.set(databaseCategoryType);
  }

  private setFragmentQueryPrams() {
    this.setDatabaseCategoryType();
    switch (this.$databaseCategoryType()) {
      case TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT:
        console.log('planSessionFragment detected');
        this.$planSessionFragmentQueryParams.set(this.route.snapshot.queryParams as ViewPlanSessionFragmentQueryParams);
        break;
      case TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT:
        console.log('personalSessionFragment detected');
        this.$personalSessionFragmentQueryParams.set(this.route.snapshot.queryParams as ViewPersonalSessionFragmentQueryParams);
        break;
      case TrainingSessionDatabaseCategoryTypes.CANONICAL:
        console.log('canonical trainingSession detected');
        break;
      default:
        console.log('No database category detected');
        break;
    }
  }

  
  private setTrainingSessionId(): void {
    switch (this.$databaseCategoryType()) {
      case TrainingSessionDatabaseCategoryTypes.CANONICAL:
        const trainingSessionId = this.route.snapshot.params[TrainingSessionKeys.ID];
        this.$canonicalTrainingSessionId.set(trainingSessionId);
        break;
      case TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT:
        const planSessionFragmentCanonicalId = this.$planSessionFragmentQueryParams()![PlanSessionFragmentKeys.CANONICAL_ID];
        this.$canonicalTrainingSessionId.set(planSessionFragmentCanonicalId);
        const trainingPlanId = this.$planSessionFragmentQueryParams()![PlanSessionFragmentKeys.TRAINING_PLAN_ID];
        this.$localTrainingPlanId.set(trainingPlanId);
        const planSessionFragmentId = this.route.snapshot.params[TrainingSessionKeys.ID];
        this.$localPlanSessionFragmentId.set(planSessionFragmentId);
        break;
      case TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT:
        const personalSessionFragmentCanonicalId = this.$personalSessionFragmentQueryParams()![PersonalSessionFragmentKeys.CANONICAL_ID];
        this.$canonicalTrainingSessionId.set(personalSessionFragmentCanonicalId);
        const personalSessionFragmentId = this.route.snapshot.params[TrainingSessionKeys.ID];
        this.$localPersonalSessionFragmentId.set(personalSessionFragmentId);
        break;
      default:
        const deafultTrainingSessionId = this.route.snapshot.params[TrainingSessionKeys.ID];
        this.$canonicalTrainingSessionId.set(deafultTrainingSessionId);
    }
  }


  private setTrainingSessionVisibilityCategory(): void {
    const trainingPlanVisibilityCategory = this.route.snapshot.queryParamMap.get(TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY) as TrainingPlanVisibilityCategoryDbOption | undefined;
    this.$trainingPlanVisibilityCategory.set(trainingPlanVisibilityCategory);
    
    const trainingSessionVisibilityCategory = this.route.snapshot.queryParamMap.get(TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY) as TrainingSessionVisibilityCategoryDbOption | undefined;
    this.$trainingSessionVisibilityCategory.set(trainingSessionVisibilityCategory);

  }

  private setTrainingSessionData() {
    this.setFragmentQueryPrams();
    this.setTrainingSessionVisibilityCategory();
    this.setTrainingSessionId();

    let singleTrainingSession$: Observable<CanonicalTrainingSession | PlanSessionFragment | PersonalSessionFragment | undefined>;
    let trainingSessionStoreFetchQuery: {} & TypedAction<any>;

    this.localTrainingSessionSubscription = this.combinedFetchTrainingSessionDataError$
      .pipe(
        withLatestFrom(this.userData$),
        switchMap(([processingError, userData]) => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetSetTrainingSessionComponentState();
            this.onNavigateToBrowseTrainingSessions();
          }
          // Build the storeFetchQuery based on the databaseCategoryType
          if (!this.$trainingSessionFetchDataConfigured()) {
            [singleTrainingSession$, trainingSessionStoreFetchQuery] = this.configureTrainingSessionFetchData(userData!);
          }
          return singleTrainingSession$;
        }),
        withLatestFrom(this.combinedFetchTrainingSessionDataError$),
        filter(([trainingSession, processingError]) => !processingError && !this.$deleteTrainingSessionSubmitted()),
        map(([trainingSession, processingError]) => {
          if (!trainingSession && !this.$fetchSingleTrainingSessionSubmitted()) {
            console.log(`Session ${this.$canonicalTrainingSessionId()} not in store, fetching from database`);
            this.$fetchSingleTrainingSessionSubmitted.set(true);
            this.store$.dispatch(trainingSessionStoreFetchQuery);
          }
          return trainingSession;
        }),
        filter(trainingSession => !!trainingSession),
        tap(trainingSession => {
          switch (this.$databaseCategoryType()) {
            case TrainingSessionDatabaseCategoryTypes.CANONICAL:
              this.$localCanonicalTrainingSession.set(trainingSession as CanonicalTrainingSession);
              break;
            case TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT:
              this.$localPlanSessionFragment.set(trainingSession as PlanSessionFragment);
              break;
            case TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT:
              this.$localPersonalSessionFragment.set(trainingSession as PersonalSessionFragment);
              break;
          }
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 10000);
          this.resetSetTrainingSessionComponentState();
          this.onNavigateToBrowseTrainingSessions();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetSetTrainingSessionComponentState() {
    this.localTrainingSessionSubscription?.unsubscribe();
    this.$fetchSingleTrainingSessionSubmitted.set(false);
    this.store$.dispatch(TrainingSessionStoreActions.purgeTrainingSessionErrors());
    this.store$.dispatch(PlanSessionFragmentStoreActions.purgePlanSessionFragmentErrors());
    this.store$.dispatch(PersonalSessionFragmentStoreActions.purgePersonalSessionFragmentErrors());
  }

  // This will fetch the data from the matching databaseCategoryType, ensuring, for example, that a personalSessionFragment whose canonical trainingPlan was deleted will still load properly
  private configureTrainingSessionFetchData(userData: PublicUser): [Observable<CanonicalTrainingSession | PlanSessionFragment | PersonalSessionFragment | undefined>, {} & TypedAction<any>] {
    this.$trainingSessionFetchDataConfigured.set(true);
    
    let singleTrainingSession$: Observable<CanonicalTrainingSession | PlanSessionFragment | PersonalSessionFragment | undefined>;
    let trainingSessionStoreFetchQuery;

    switch (this.$databaseCategoryType()) {
      case TrainingSessionDatabaseCategoryTypes.CANONICAL:
        singleTrainingSession$ = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(this.$canonicalTrainingSessionId()!)); 
        trainingSessionStoreFetchQuery = TrainingSessionStoreActions.fetchSingleTrainingSessionRequested({sessionId: this.$canonicalTrainingSessionId()!, userId: userData.id, visibilityCategory: this.$trainingSessionVisibilityCategory()!});
        console.log('Building canonical trainingSession storeFetchQuery');
        break;
      case TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT:
        singleTrainingSession$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectPlanSessionFragmentById(this.$localPlanSessionFragmentId()!)); 
        trainingSessionStoreFetchQuery = PlanSessionFragmentStoreActions.fetchSinglePlanSessionFragmentRequested({
          trainingPlanId: this.$localTrainingPlanId()!,
          planSessionFragmentId: this.$localPlanSessionFragmentId()!,
          userId: userData.id,
          visibilityCategory: this.$trainingPlanVisibilityCategory()!
        });
        console.log('Building planSessionFragment storeFetchQuery');
        break;
      case TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT:
        singleTrainingSession$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectPersonalSessionFragmentById(this.$localPersonalSessionFragmentId()!));
        trainingSessionStoreFetchQuery = PersonalSessionFragmentStoreActions.fetchSinglePersonalSessionFragmentRequested({
          userId: userData.id,
          personalSessionFragmentId: this.$localPersonalSessionFragmentId()!
        });
        console.log('Building personalSessionFragment storeFetchQuery');
        break;
      default:
        singleTrainingSession$ = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(this.$canonicalTrainingSessionId()!)); 
        trainingSessionStoreFetchQuery = TrainingSessionStoreActions.fetchSingleTrainingSessionRequested({sessionId: this.$canonicalTrainingSessionId()!, userId: userData.id, visibilityCategory: this.$trainingSessionVisibilityCategory()!});
        console.log('Building canonical trainingSession storeFetchQuery');
    }

    return [singleTrainingSession$, trainingSessionStoreFetchQuery];
  }

  // Update training status if user interacts with video widget directly
  private monitorVideoState(userData: PublicUser) {
    this.videoStateSubscription = this.videoComponent.ytVideoPlayerApi.stateChange
      .pipe(
        distinctUntilChanged(),
        tap(event => {
          const currentState = event.data;

          switch (currentState) {
            case YT.PlayerState.PAUSED: {
              if (!this.sessionPaused()) {
                this.onPauseTrainingSession();
              }
              break;
            }
            
            case YT.PlayerState.ENDED: {
              if (!this.sessionCompleted()) {
                this.onCompleteTrainingSession(userData);
              }
              break;
            }
  
            case YT.PlayerState.PLAYING: {
              if (this.sessionPaused()) {
                this.onResumeTrainingSession();
              }
              break;
            }
          }
        })
      ).subscribe();
  }

  onBeginTrainingSession(userData: PublicUser) {
    this.videoInitialized.set(true);
    this.detailsComponent.expansionPanel.close();
    this.videoComponent.ytVideoPlayerApi.playVideo();
    this.sessionStartTime.set(Timestamp.now().toMillis());
    this.monitorVideoState(userData);
  }

  onPauseTrainingSession() {
    console.log('Pausing training session');
    this.videoComponent.ytVideoPlayerApi.pauseVideo();
    this.sessionEndTime.set(Timestamp.now().toMillis());
    this.sessionDuration.update(existingDuration => {
      if (existingDuration) {
        return this.sessionEndTime()! - this.sessionStartTime()! + existingDuration;
      }
      return this.sessionEndTime()! - this.sessionStartTime()!;
    });
    this.sessionStartTime.set(undefined);
    this.sessionEndTime.set(undefined);
    this.sessionPaused.set(true);
  }

  onResumeTrainingSession() {
    console.log('Resuming training session');
    this.videoComponent.ytVideoPlayerApi.playVideo();
    this.sessionStartTime.set(Timestamp.now().toMillis());
    this.sessionPaused.set(false);
  }

  onCompleteTrainingSession(userData: PublicUser) {
    if (!this.sessionPaused()) {
      this.onPauseTrainingSession();
    }

    const trainingSession = this.$combinedLocalTrainingSessionData();
    const sessionCompletionData: TrainingSessionCompletionData = {
      trainingSession: trainingSession!,
      sessionDuration: this.sessionDuration()!,
      userId: userData!.id,
    }

    const dialogConfig = {...DialogueBoxDefaultConfig};   
    dialogConfig.data = sessionCompletionData;
    
    const dialogRef = this.dialog.open(TrainingSessionCompleteDialogueComponent, dialogConfig);

    const userSubmissionObserver = dialogRef.afterClosed() as Observable<boolean>;
    userSubmissionObserver
      .pipe(
        take(1),
        tap(userConfirmedSubmission => {
          if (userConfirmedSubmission) {
            this.videoComponent.ytVideoPlayerApi.stopVideo();
            this.videoInitialized.set(false);
            this.sessionCompleted.set(true);
            this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
          }
        })
      ).subscribe();

    // This is used to pre-emptively unsubscribe from the localTrainingSessionSubscription so that a fetch error isn't triggered once deleted
    const deletePersonalSessionFragmentObserver = dialogRef.componentInstance.deletePersonalSessionFragmentInitiated.asObservable();
    deletePersonalSessionFragmentObserver
      .pipe(
        take(1),
        tap(deletePersonalSessionFragmentDetected => {
          if (deletePersonalSessionFragmentDetected) {
            this.localTrainingSessionSubscription?.unsubscribe();
          }
        })
      ).subscribe();
  }

  onCancelTrainingSession() {
    this.onPauseTrainingSession();

    const dialogConfig = {...DialogueBoxDefaultConfig};
    const actionConfData: ActionConfData = {
      title: this.CANCEL_TRAINING_CONF_TITLE,
      body: this.CANCEL_TRAINING_CONF_BODY,
    };

    dialogConfig.data = actionConfData;
    
    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);

    dialogRef.afterClosed()
      .pipe(
        take(1),
        tap(confirmed => {
          if (confirmed) {
            this.sessionStartTime.set(undefined);
            this.sessionEndTime.set(undefined);
            this.sessionDuration.set(undefined);
            this.videoComponent.ytVideoPlayerApi.stopVideo();
            this.videoInitialized.set(false);
    
          } else {
            this.onResumeTrainingSession();
          }
        })
      ).subscribe();
  }

  onEditTrainingSession() {
    const queryParams: ViewCanonicalTrainingSessionQueryParams = {
      [ViewCanonicalTrainingSessionQueryParamsKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.CANONICAL,
      [ViewCanonicalTrainingSessionQueryParamsKeys.TRAINING_SESSION_VISIBILITY_CATEGORY]: this.$localCanonicalTrainingSession()![TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY],
    };
    const navigationExtras: NavigationExtras = {queryParams};
    this.router.navigate([PublicAppRoutes.BUILD_EDIT_TRAINING_SESSION, this.$canonicalTrainingSessionId()], navigationExtras);
  }

  onDeleteTrainingSession() {
    
    // Only proceed with the delete in this component if it is a canonical trainingSession, otherwise route to the appropriate component to execute
    switch (this.$databaseCategoryType()) {
      case TrainingSessionDatabaseCategoryTypes.CANONICAL:
        console.log('canonical trainingSession detected, proceeding with delete');
        break;
      case TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT:
        console.log('planSessionFragment detected, routing to editingTrainingPlan component to delete');
        const deletePlanSessionQueryParams: DeletePlanSessionFragmentQueryParams = {
          [DeletePlanSessionFragmentQueryParamsKeys.DELETE_PLAN_SESSION_FRAGMENT_ID]: this.$localPlanSessionFragmentId()!,
          [DeletePlanSessionFragmentQueryParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: this.$localPlanSessionFragment()![PlanSessionFragmentKeys.TRAINING_PLAN_VISIBILITY_CATEGORY],
        };
        const deletePlanSessionNavigationExtras: NavigationExtras = {queryParams: deletePlanSessionQueryParams};
        this.router.navigate([PublicAppRoutes.BUILD_EDIT_TRAINING_PLAN, this.$localTrainingPlanId()], deletePlanSessionNavigationExtras);
        return;
      case TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT:
        console.log('personalSessionFragment detected, routing to editPersonalQueue component to delete');
        const deletePersonalSessionQueryParams: DeletePersonalSessionFragmentUrlParams = {
          [DeletePersonalSessionFragmentUrlParamsKeys.DELETE_PERSONAL_SESSION_FRAGMENT_ID]: this.$localPersonalSessionFragmentId()!
        };
        const deletePersonalSessionNavigationExtras: NavigationExtras = {queryParams: deletePersonalSessionQueryParams};
        this.router.navigate([PublicAppRoutes.TRAIN_EDIT_PERSONAL_QUEUE], deletePersonalSessionNavigationExtras);
        return;
      default:
        console.log('canonical trainingSession detected, proceeding with delete');
    }

    const dialogConfig = {...DialogueBoxDefaultConfig};
    const actionConfData: ActionConfData = {
      title: this.DELETE_TRAINING_SESSION_CONF_TITLE,
      body: this.DELETE_TRAINING_SESSION_CONF_BODY,
    };

    dialogConfig.data = actionConfData;
    
    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);
    const userConfirmedDelete$ = dialogRef.afterClosed() as Observable<boolean>;

    this.deleteTrainingSessionSubscription = this.deleteTrainingSessionError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetDeleteTrainingSessionComponentState();
          }
          return userConfirmedDelete$;
        }),
        withLatestFrom(this.deleteTrainingSessionError$, this.userData$),
        filter(([userConfirmedDelete, deleteError, userData]) => !deleteError && userConfirmedDelete),
        switchMap(([userConfirmedDelete, deletionError, userData]) => {
          if (!this.$deleteTrainingSessionSubmitted()) {
            this.$deleteTrainingSessionSubmitted.set(true);
            this.store$.dispatch(TrainingSessionStoreActions.deleteTrainingSessionRequested({
              trainingSession: this.$localCanonicalTrainingSession()!,
              userId: userData!.id
            }));
          }
          return this.deleteTrainingSessionProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(deleteProcessing => {
          if (deleteProcessing) {
            this.$deleteTrainingSessionCycleInit.set(true);
          }
          if (!deleteProcessing && this.$deleteTrainingSessionCycleInit()) {
            console.log('deletePlanSessionFragment successful, proceeding with pipe.');
            this.$deleteTrainingSessionCycleComplete.set(true);
            this.$deleteTrainingSessionCycleInit.set(false);
          }
        }),
        filter(deleteProcessing => !deleteProcessing && this.$deleteTrainingSessionCycleComplete()),
        tap(deletionProcessing => {
          this.uiService.showSnackBar(`Training Session deleted.`, 10000);
          this.onNavigateToBrowseTrainingSessions();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetDeleteTrainingSessionComponentState();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetDeleteTrainingSessionComponentState() {
    this.deleteTrainingSessionSubscription?.unsubscribe();
    this.$deleteTrainingSessionSubmitted.set(false);
    this.$deleteTrainingSessionCycleInit.set(false)
    this.$deleteTrainingSessionCycleComplete.set(false);
    this.store$.dispatch(TrainingSessionStoreActions.purgeTrainingSessionErrors());
  }

  onNavigateToBrowseTrainingSessions() {
    if (this.$trainingPlanBuilderRequest() && this.$localCanonicalTrainingSession()) {
      console.log('trainingPlanBuilderRequest detected, constructing trainingPlanBuilder Browse url');
      const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_ID) as string;
      const visibilityCategory = this.route.snapshot.queryParamMap.get(TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY) as TrainingPlanVisibilityCategoryDbOption | undefined;
      const queryParams: AddTrainingSessionToPlanQueryParams = {
        [AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: true,
        [AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_ID]: trainingPlanId,
        [AddTrainingSessionUrlToPlanParamsKeys.VIEW_TRAINING_SESSIONS]: true,
        [AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: visibilityCategory!
      };
      const navigationExtras: NavigationExtras = {queryParams};
      this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
    } else {
      console.log('no trainingPlanBuilderRequest detected, constructing standard Browse url');
      const queryParams: BrowseTrainingSessionsQueryParams = {
        [BrowseTrainingSessionsQueryParamsKeys.VIEW_TRAINING_SESSIONS]: true
      };
      const navigationExtras: NavigationExtras = {queryParams};
      this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
    }
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
    this.localTrainingSessionSubscription?.unsubscribe();
    this.videoStateSubscription?.unsubscribe();
    this.deleteTrainingSessionSubscription?.unsubscribe();

    this.combinedFetchTrainingSessionDataError$
      .pipe(
        take(1),
        tap(fetchError => {
          if (fetchError) {
            this.store$.dispatch(TrainingSessionStoreActions.purgeTrainingSessionErrors());
            this.store$.dispatch(PlanSessionFragmentStoreActions.purgePlanSessionFragmentErrors());
            this.store$.dispatch(PersonalSessionFragmentStoreActions.purgePersonalSessionFragmentErrors());
          }
        })
      ).subscribe();
  }
}
