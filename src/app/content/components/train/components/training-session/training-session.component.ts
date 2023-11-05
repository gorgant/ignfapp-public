import { Component, HostListener, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, take, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingSession, TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, ViewTrainingSessionsUlrParams, ViewTrainingSessionsUrlParamsKeys } from 'shared-models/train/training-session.model';
import { TrainingSessionStoreActions, TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
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
import { AddTrainingSessionUrlParams, AddTrainingPlanUrlParamsKeys } from 'shared-models/train/training-plan.model';
import { PlanSessionFragmentKeys, ViewPlanSessionFragmentUrlParams } from 'shared-models/train/plan-session-fragment.model';
import { Timestamp } from '@angular/fire/firestore';
import { PersonalSessionFragmentKeys, ViewPersonalSessionFragmentUrlParams } from 'shared-models/train/personal-session-fragment.model';
import { UiService } from 'src/app/core/services/ui.service';

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
  RESUME_TRAINING_BUTTON_VALUE = GlobalFieldValues.RESUME_TRAINING;
  START_NOW_BUTTON_VALUE = GlobalFieldValues.START_NOW;

  $currentTrainingSession = signal(undefined as TrainingSession | undefined);
  private $currentTrainingSessionId = signal(undefined as string | undefined);
  private fetchTrainingSessionProcessing$!: Observable<boolean>;
  private fetchTrainingSessionError$!: Observable<{} | null>;
  private $singleTrainingSessionRequested = signal(false);
  private currentTrainingSessionSubscription!: Subscription;

  private deleteTrainingSessionSubscription!: Subscription;
  deleteTrainingSessionProcessing$!: Observable<boolean>;
  private deleteTrainingSessionError$!: Observable<{} | null>;
  private deleteTrainingSessionSubmitted = signal(false);


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
  private $databaseCategoryType = signal(null as TrainingSessionDatabaseCategoryTypes | null);
  private $planSessionFragmentQueryParams = signal(undefined as ViewPlanSessionFragmentUrlParams | undefined);
  private $personalSessionFragmentQueryParams = signal(undefined as ViewPersonalSessionFragmentUrlParams | undefined);

  private uiService = inject(UiService);
  private store$ = inject(Store);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  
  
  constructor() { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.checkForPlanBuilderRequest();
    this.getTrainingSessionData();
  }

  private checkForPlanBuilderRequest() {
    const builderRequestString = this.route.snapshot.queryParamMap.get(AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST);
    if (builderRequestString) {
      const isBuilderRequest = JSON.parse(builderRequestString) as boolean;
      if (isBuilderRequest) {
        console.log('Plan builder request detected');
        this.$trainingPlanBuilderRequest.set(true);
      }
    }
  }

  // Pulls data from params if source is a planSessionFragment or personalSessionFragment
  private setDatabaseCategoryType() {
    const databaseCategoryType = this.route.snapshot.queryParamMap.get(TrainingSessionKeys.DATABASE_CATEGORY) as TrainingSessionDatabaseCategoryTypes | null;
    this.$databaseCategoryType.set(databaseCategoryType);
  }

  private setFragmentQueryPrams() {
    this.setDatabaseCategoryType();
    switch (this.$databaseCategoryType()) {
      case TrainingSessionDatabaseCategoryTypes.PLAN_FRAGMENT:
        console.log('planSessionFragment detected');
        this.$planSessionFragmentQueryParams.set(this.route.snapshot.queryParams as ViewPlanSessionFragmentUrlParams);
        break;
      case TrainingSessionDatabaseCategoryTypes.PERSONAL_FRAGMENT:
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
    this.deleteTrainingSessionProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectDeleteTrainingSessionProcessing);
    this.deleteTrainingSessionError$ = this.store$.select(TrainingSessionStoreSelectors.selectDeleteTrainingSessionError);
  }

  private setTrainingSessionId(): void {
    switch (this.$databaseCategoryType()) {
      case TrainingSessionDatabaseCategoryTypes.PLAN_FRAGMENT:
        const planSessionFragmentId = this.$planSessionFragmentQueryParams()![PlanSessionFragmentKeys.CANONICAL_ID];
        this.$currentTrainingSessionId.set(planSessionFragmentId);
        break;
      case TrainingSessionDatabaseCategoryTypes.PERSONAL_FRAGMENT:
        const personalSessionFragmentId = this.$personalSessionFragmentQueryParams()![PersonalSessionFragmentKeys.CANONICAL_ID];
        this.$currentTrainingSessionId.set(personalSessionFragmentId);
        break;
      case TrainingSessionDatabaseCategoryTypes.CANONICAL:
        const trainingSessionId = this.route.snapshot.params[TrainingSessionKeys.ID];
        this.$currentTrainingSessionId.set(trainingSessionId);
        break;
      default:
        const deafultTrainingSessionId = this.route.snapshot.params[TrainingSessionKeys.ID];
        this.$currentTrainingSessionId.set(deafultTrainingSessionId);
    }
  }

  private getTrainingSessionData() {
    this.setFragmentQueryPrams();
    this.setTrainingSessionId();
    const trainingSessionId = this.$currentTrainingSessionId() as string;
    this.currentTrainingSessionSubscription = this.fetchTrainingSessionError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.$singleTrainingSessionRequested.set(false);
            this.onNavigateToBrowseWithTrainingSessionSelection();
          }
          const singleTrainingSession$ = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(trainingSessionId)); 
          return singleTrainingSession$;
        }),
        withLatestFrom(this.fetchTrainingSessionError$),
        filter(([trainingSession, processingError]) => !processingError),
        map(([trainingSession, processingError]) => {
          if (!trainingSession && !this.$singleTrainingSessionRequested()) {
            console.log(`Session ${trainingSessionId} not in store, fetching from database`);
            this.store$.dispatch(TrainingSessionStoreActions.fetchSingleTrainingSessionRequested({sessionId: trainingSessionId}));
            this.$singleTrainingSessionRequested.set(true);
          }
          return trainingSession;
        }),
        filter(trainingSession => !!trainingSession),
        tap(trainingSession => {
          this.$currentTrainingSession.set(trainingSession);
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.$singleTrainingSessionRequested.set(false);
          return throwError(() => new Error(error));
        })
      ).subscribe();
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
            trainingSession: this.$currentTrainingSession()!,
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

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.sessionStartTime.set(undefined);
        this.sessionEndTime.set(undefined);
        this.sessionDuration.set(undefined);
        this.videoComponent.ytVideoPlayerApi.stopVideo();
        this.videoInitialized.set(false);

      } else {
        this.onResumeTrainingSession();
      }
    });
  }

  onAddToQueue() {
    // TODO: Add to the user personalSessionFragment collection (use similar approach as add-training-session-to-plan-button)
    
  }

  onEditTrainingSession(sessionId: string) {
    this.router.navigate([PublicAppRoutes.TRAINING_SESSION_EDIT, sessionId]);
  }

  onDeleteTrainingSession(sessionId: string) {
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
            this.deleteTrainingSessionSubmitted.set(false);
          }
          return userConfirmedDelete$;
        }),
        withLatestFrom(this.deleteTrainingSessionError$),
        filter(([userConfirmedDelete, deletionError]) => !deletionError),
        switchMap(([userConfirmedDelete, deletionError]) => {
          if (userConfirmedDelete && !this.deleteTrainingSessionSubmitted()) {
            this.deleteTrainingSessionSubmitted.set(true);
            this.store$.dispatch(TrainingSessionStoreActions.deleteTrainingSessionRequested({sessionId}));
          }
          console.log('deletionSubmitted', this.deleteTrainingSessionSubmitted());
          return this.deleteTrainingSessionProcessing$;
        }),
        filter(deletionProcessing => !deletionProcessing && this.deleteTrainingSessionSubmitted()),
        tap(deletionProcessing => {
          console.log('Training session deleted');
          const queryParams: ViewTrainingSessionsUlrParams = {
            [ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS]: true, // Ensures the user views training sessions vs plans
          };
          const navigationExtras: NavigationExtras = {queryParams};
          this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.deleteTrainingSessionSubmitted.set(false);
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  onNavigateToBrowseWithTrainingSessionSelection() {
    const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_ID) as string;
    const queryParams: AddTrainingSessionUrlParams = {
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
    this.currentTrainingSessionSubscription?.unsubscribe();
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
