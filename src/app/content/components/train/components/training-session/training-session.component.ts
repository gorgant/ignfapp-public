import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, take } from 'rxjs';
import { distinctUntilChanged, map, withLatestFrom } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingSession } from 'shared-models/train/training-session.model';
import { RootStoreState, TrainingSessionStoreActions, TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { TrainingSessionCompleteDialogueComponent } from './training-session-complete-dialogue/training-session-complete-dialogue.component';
import { TrainingSessionDetailsComponent } from './training-session-details/training-session-details.component';
import { TrainingSessionVideoComponent } from './training-session-video/training-session-video.component';
import { DateTime } from 'luxon';
import { ComponentCanDeactivate } from 'src/app/core/route-guards/unsaved-changes.guard';
import { CanDeactivateData } from 'shared-models/utils/can-deactivate-data.model';
import { TrainingSessionCompletionData } from 'shared-models/train/training-record.model';
import { ActionConfirmDialogueComponent } from 'src/app/shared/components/action-confirm-dialogue/action-confirm-dialogue.component';
import { ActionConfData } from 'shared-models/forms/action-conf-data.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser } from 'shared-models/user/public-user.model';

@Component({
  selector: 'app-training-session',
  templateUrl: './training-session.component.html',
  styleUrls: ['./training-session.component.scss']
})
export class TrainingSessionComponent implements OnInit, ComponentCanDeactivate, OnDestroy {

  userData$!: Observable<PublicUser | null>;

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

  trainingSessionData$!: Observable<TrainingSession | undefined>;
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

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.getTrainingSessionData();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectUserData);
    this.fetchTrainingSessionProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchSingleTrainingSessionProcessing);
  }

  private getSessionIdFromParams(): string {
    const idParamName = 'id';
    const sessionId = this.route.snapshot.params[idParamName];
    return sessionId;
  }

  private getTrainingSessionData() {
    
    const sessionId = this.getSessionIdFromParams();

    this.trainingSessionData$ = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(sessionId))
        .pipe(
          withLatestFrom(this.fetchTrainingSessionProcessing$),
          map(([trainingSession, fetchProcessing]) => {
            if (!trainingSession && !fetchProcessing) {
              console.log(`Session ${sessionId} not in store, fetching from database`);
              this.store$.dispatch(TrainingSessionStoreActions.fetchSingleTrainingSessionRequested({sessionId}));
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
    this.sessionStartTime = DateTime.now().toMillis();
    this.monitorVideoState();
  }

  onPauseTrainingSession() {
    console.log('Pausing training session');
    this.videoComponent.ytVideoPlayerApi.pauseVideo();
    this.sessionEndTime = DateTime.now().toMillis();
    this.sessionDuration = this.sessionDuration ? this.sessionEndTime! - this.sessionStartTime! + this.sessionDuration : this.sessionEndTime! - this.sessionStartTime!;
    this.sessionStartTime = null;
    this.sessionEndTime = null;
    this.sessionPaused = true;
  }

  onResumeTrainingSession() {
    console.log('Resuming training session');
    this.videoComponent.ytVideoPlayerApi.playVideo();
    this.sessionStartTime = DateTime.now().toMillis();
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
        const sessionCompletionTimestamp = DateTime.now().toMillis();

        const sessionCompletionData: TrainingSessionCompletionData = {
          trainingSession: trainingSessionData!,
          sessionCompletionTimestamp,
          sessionDuration: this.sessionDuration!,
          userId: userData!.id
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
  }
}
