import { Component, HostListener, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, take, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingSession, TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, ViewTrainingSessionsUlrParams, ViewTrainingSessionsUrlParamsKeys } from 'shared-models/train/training-session.model';
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
import { AddTrainingSessionUrlParams, AddTrainingSessionUrlParamsKeys } from 'shared-models/train/training-plan.model';
import { DeletePlanSessionFragmentUrlParams, DeletePlanSessionFragmentUrlParamsKeys, PlanSessionFragment, PlanSessionFragmentKeys, ViewPlanSessionFragmentUrlParams } from 'shared-models/train/plan-session-fragment.model';
import { Timestamp } from '@angular/fire/firestore';
import { DeletePersonalSessionFragmentUrlParams, DeletePersonalSessionFragmentUrlParamsKeys, PersonalSessionFragment, PersonalSessionFragmentKeys, ViewPersonalSessionFragmentUrlParams } from 'shared-models/train/personal-session-fragment.model';
import { UiService } from 'src/app/core/services/ui.service';
import { TypedAction } from '@ngrx/store/src/models';

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

  $localTrainingSession = signal(undefined as TrainingSession | PlanSessionFragment | PersonalSessionFragment | undefined);
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
  private $planSessionFragmentQueryParams = signal(undefined as ViewPlanSessionFragmentUrlParams | undefined);
  private $personalSessionFragmentQueryParams = signal(undefined as ViewPersonalSessionFragmentUrlParams | undefined);

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
    this.getTrainingSessionData();
  }

  private checkForPlanBuilderRequest() {
    const builderRequestParam = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST);
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
        this.$planSessionFragmentQueryParams.set(this.route.snapshot.queryParams as ViewPlanSessionFragmentUrlParams);
        break;
      case TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT:
        console.log('personalSessionFragment detected');
        this.$personalSessionFragmentQueryParams.set(this.route.snapshot.queryParams as ViewPersonalSessionFragmentUrlParams);
        break;
      case TrainingSessionDatabaseCategoryTypes.CANONICAL:
        console.log('canonical trainingSession detected');
        break;
      default:
        console.log('No database category detected');
        break;
    }
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

  private getTrainingSessionData() {
    this.setFragmentQueryPrams();
    this.setTrainingSessionId();

    let singleTrainingSession$: Observable<TrainingSession | PlanSessionFragment | PersonalSessionFragment | undefined>;
    let trainingSessionStoreFetchQuery: {} & TypedAction<any>;

    this.localTrainingSessionSubscription = this.combinedFetchTrainingSessionDataError$
      .pipe(
        withLatestFrom(this.userData$),
        switchMap(([processingError, userData]) => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.onNavigateToBrowseWithTrainingSessionSelection();
          }
          // Build the storeFetchQuery based on the databaseCategoryType
          if (!this.$trainingSessionFetchDataConfigured()) {
            [singleTrainingSession$, trainingSessionStoreFetchQuery] = this.configureTrainingSessionFetchData(userData!.id);
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
          this.$localTrainingSession.set(trainingSession);
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.onNavigateToBrowseWithTrainingSessionSelection();
          return throwError(() => new Error(error));
        })
      ).subscribe();

  }

  // This will fetch the data from the matching databaseCategoryType, ensuring, for example, that a personalSessionFragment whose canonical trainingPlan was deleted will still load properly
  private configureTrainingSessionFetchData(userId: string): [Observable<TrainingSession | PlanSessionFragment | PersonalSessionFragment | undefined>, {} & TypedAction<any>] {
    this.$trainingSessionFetchDataConfigured.set(true);
    
    let singleTrainingSession$: Observable<TrainingSession | undefined>;
    let trainingSessionStoreFetchQuery;

    switch (this.$databaseCategoryType()) {
      case TrainingSessionDatabaseCategoryTypes.CANONICAL:
        singleTrainingSession$ = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(this.$canonicalTrainingSessionId()!)); 
        trainingSessionStoreFetchQuery = TrainingSessionStoreActions.fetchSingleTrainingSessionRequested({sessionId: this.$canonicalTrainingSessionId()!});
        console.log('Building canonical trainingSession storeFetchQuery');
        break;
      case TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT:
        singleTrainingSession$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectPlanSessionFragmentById(this.$localPlanSessionFragmentId()!)); 
        trainingSessionStoreFetchQuery = PlanSessionFragmentStoreActions.fetchSinglePlanSessionFragmentRequested({
          trainingPlanId: this.$localTrainingPlanId()!,
          planSessionFragmentId: this.$localPlanSessionFragmentId()!
        });
        console.log('Building planSessionFragment storeFetchQuery');
        break;
      case TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT:
        singleTrainingSession$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectPersonalSessionFragmentById(this.$localPersonalSessionFragmentId()!));
        trainingSessionStoreFetchQuery = PersonalSessionFragmentStoreActions.fetchSinglePersonalSessionFragmentRequested({
          userId,
          personalSessionFragmentId: this.$localPersonalSessionFragmentId()!
        });
        console.log('Building personalSessionFragment storeFetchQuery');
        break;
      default:
        singleTrainingSession$ = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(this.$canonicalTrainingSessionId()!)); 
        trainingSessionStoreFetchQuery = TrainingSessionStoreActions.fetchSingleTrainingSessionRequested({sessionId: this.$canonicalTrainingSessionId()!});
        console.log('Building canonical trainingSession storeFetchQuery');
    }

    return [singleTrainingSession$, trainingSessionStoreFetchQuery];
  }

  // Update training status if user interacts with video widget directly
  private monitorVideoState() {
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
                this.onCompleteTrainingSession();
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
      )
      .subscribe();
  }

  onBeginTrainingSession() {
    this.videoInitialized.set(true);
    this.detailsComponent.expansionPanel.close();
    this.videoComponent.ytVideoPlayerApi.playVideo();
    this.sessionStartTime.set(Timestamp.now().toMillis());
    this.monitorVideoState();
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

  onCompleteTrainingSession() {
    if (!this.sessionPaused()) {
      this.onPauseTrainingSession();
    }

    this.userData$
      .pipe(
        take(1),
        switchMap(userData => {
          const sessionCompletionData: TrainingSessionCompletionData = {
            trainingSession: this.$localTrainingSession()!,
            sessionDuration: this.sessionDuration()!,
            userId: userData!.id,
            personalSessionFragmentId: this.$personalSessionFragmentQueryParams() ? this.$personalSessionFragmentQueryParams()![TrainingSessionKeys.ID] : undefined
          }
  
          const dialogConfig = new MatDialogConfig();
        
          dialogConfig.autoFocus = false;
          dialogConfig.width = '90%';
          dialogConfig.maxWidth = '600px';
      
          dialogConfig.data = sessionCompletionData;
          
          const dialogRef = this.dialog.open(TrainingSessionCompleteDialogueComponent, dialogConfig);
          const userSubmissionObserver = dialogRef.afterClosed() as Observable<boolean>;          
          return userSubmissionObserver;
        }),
        tap(userConfirmedSubmission => {
          if (userConfirmedSubmission) {
            this.videoComponent.ytVideoPlayerApi.stopVideo();
            this.videoInitialized.set(false);
            this.sessionCompleted.set(true);
            this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
          }
        })
      ).subscribe();
    
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
    this.router.navigate([PublicAppRoutes.BUILD_EDIT_TRAINING_SESSION, this.$canonicalTrainingSessionId()]);
  }

  onDeleteTrainingSession() {
    
    switch (this.$databaseCategoryType()) {
      case TrainingSessionDatabaseCategoryTypes.CANONICAL:
        console.log('canonical trainingSession detected, proceeding with delete');
        break;
      case TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT:
        console.log('planSessionFragment detected, routing to editingTrainingPlan component to delete');
        const deletePlanSessionQueryParams: DeletePlanSessionFragmentUrlParams = {
          [DeletePlanSessionFragmentUrlParamsKeys.DELETE_PLAN_SESSION_FRAGMENT_ID]: this.$localPlanSessionFragmentId()!
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

    const dialogConfig = new MatDialogConfig();
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
            this.deleteTrainingSessionSubscription?.unsubscribe();
            this.resetDeleteTrainingComponentState();
          }
          return userConfirmedDelete$;
        }),
        withLatestFrom(this.deleteTrainingSessionError$),
        filter(([userConfirmedDelete, deletionError]) => !deletionError && userConfirmedDelete),
        switchMap(([userConfirmedDelete, deletionError]) => {
          if (!this.$deleteTrainingSessionSubmitted()) {
            this.$deleteTrainingSessionSubmitted.set(true);
            this.store$.dispatch(TrainingSessionStoreActions.deleteTrainingSessionRequested({sessionId: this.$canonicalTrainingSessionId()!}));
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
          }
        }),
        filter(deleteProcessing => !deleteProcessing && this.$deleteTrainingSessionCycleComplete()),
        tap(deletionProcessing => {
          this.uiService.showSnackBar(`Training Session deleted.`, 10000);
          this.onNavigateToBrowseWithTrainingSessionSelection();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.deleteTrainingSessionSubscription?.unsubscribe();
          this.resetDeleteTrainingComponentState();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetDeleteTrainingComponentState() {
    this.$deleteTrainingSessionSubmitted.set(false);
    this.$deleteTrainingSessionCycleInit.set(false)
    this.$deleteTrainingSessionCycleComplete.set(false);
  }

  onNavigateToBrowseWithTrainingSessionSelection() {
    if (this.$trainingPlanBuilderRequest()) {
      const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_ID) as string;
      const queryParams: AddTrainingSessionUrlParams = {
        [AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: true,
        [AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_ID]: trainingPlanId,
        [ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS]: true
      };
      const navigationExtras: NavigationExtras = {queryParams};
      this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
    } else {
      const queryParams: ViewTrainingSessionsUlrParams = {
        [ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS]: true
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

    this.fetchTrainingSessionError$
      .pipe(
        take(1),
        tap(fetchError => {
          if (fetchError) {
            this.store$.dispatch(TrainingSessionStoreActions.purgeTrainingSessionData());
          }
        })
      )
      .subscribe();
  }
}
