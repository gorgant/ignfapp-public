import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs/operators';
import { Subscription } from 'rxjs/internal/Subscription';
import { TrainingSessionVideoPlatform, TrainingSessionNoId, TrainingSessionFocusDbOption, TrainingSessionKeys, TrainingSession } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { RootStoreState, TrainingSessionStoreActions, TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { combineLatest, Observable } from 'rxjs';
import { StepperOrientation } from '@angular/material/stepper';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UiService } from 'src/app/core/services/ui.service';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { ComponentCanDeactivate } from 'src/app/core/route-guards/unsaved-changes.guard';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { EditTrainingSessionStepOneComponent } from './edit-training-session-step-one/edit-training-session-step-one.component';
import { EditTrainingSessionStepTwoComponent } from './edit-training-session-step-two/edit-training-session-step-two.component';
import { Update } from '@ngrx/entity';
import { YoutubeVideoDataCompact } from 'shared-models/youtube/youtube-video-data.model';

@Component({
  selector: 'app-edit-training-session',
  templateUrl: './edit-training-session.component.html',
  styleUrls: ['./edit-training-session.component.scss'],
  providers: [ {
    provide: STEPPER_GLOBAL_OPTIONS, useValue: {showError: true} // Required for stepper error to show
  }]
})
export class EditTrainingSessionComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  
  stepperOrientation!: StepperOrientation;
  
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  CHANNEL_BLURB = GlobalFieldValues.CHANNEL;
  CREATE_SESSION_TITLE_VALUE = GlobalFieldValues.CREATE_SESSION;
  CREATE_SESSION_BUTTON_VALUE = GlobalFieldValues.CREATE_SESSION;
  DURATION_BLURB = GlobalFieldValues.DURATION;
  EDIT_SESSION_TITLE_VALUE = GlobalFieldValues.EDIT_SESSION;
  EDIT_SESSION_BUTTON_VALUE = GlobalFieldValues.SUBMIT;
  FETCH_VIDEO_DATA_BUTTON_VALUE = GlobalFieldValues.FETCH_VIDEO_DATA;
  INPUT_YOUTUBE_VIDEO_URL_STEP_LABEL = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_TITLE;
  INPUT_SESSION_DATA_STEP_LABEL = GlobalFieldValues.INPUT_SESSION_DATA;
  TITLE_BLURB = GlobalFieldValues.TITLE;

  userDataSubscription!: Subscription;
  userData$!: Observable<PublicUser>;

  createTrainingSessionProcessing$!: Observable<boolean>;
  createTrainingSessionSubscription!: Subscription;
  createTrainingSessionError$!: Observable<{} | null>;
  createTrainingSessionSubmitted!: boolean;

  updateTrainingSessionProcessing$!: Observable<boolean>;
  updateTrainingSessionSubscription!: Subscription;
  updateTrainingSessionError$!: Observable<{} | null>;
  updateTrainingSessionSubmitted!: boolean;

  serverRequestProcessing$!: Observable<boolean>;

  @ViewChild('stepOne') stepOne!: EditTrainingSessionStepOneComponent;
  @ViewChild('stepTwo') stepTwo!: EditTrainingSessionStepTwoComponent;

  isNewSession = true;

  getYoutubeVideoDataProcessing$!: Observable<boolean>;
  youtubeVideoData$!: Observable<YoutubeVideoDataCompact | null>;

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private uiService: UiService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.setStepperOrientation();
    this.checkIfNewSession();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectUserData) as Observable<PublicUser>;

    this.getYoutubeVideoDataProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchYoutubeVideoDataProcessing);
    this.youtubeVideoData$ = this.store$.select(TrainingSessionStoreSelectors.selectYoutubeVideoData);

    this.createTrainingSessionProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectCreateTrainingSessionProcessing);
    this.createTrainingSessionError$ = this.store$.select(TrainingSessionStoreSelectors.selectCreateTrainingSessionError);

    this.updateTrainingSessionProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectUpdateTrainingSessionProcessing);
    this.updateTrainingSessionError$ = this.store$.select(TrainingSessionStoreSelectors.selectUpdateTrainingSessionError);

    this.serverRequestProcessing$ = combineLatest(
      [
        this.createTrainingSessionProcessing$,
        this.updateTrainingSessionProcessing$
      ]
    ).pipe(
        map(([creatingTrainingSession, updatingTrainingSession]) => {
          if (creatingTrainingSession || updatingTrainingSession) {
            return true
          }
          return false
        })
    );
  }

  private setStepperOrientation(): void {
    this.uiService.screenIsMobile.subscribe(isMobile => {
      if (isMobile) {
        this.stepperOrientation = 'vertical'
      } else {
        this.stepperOrientation = 'horizontal'
      }
    })
  }

  private checkIfNewSession() {
    this.isNewSession = !this.getExistingSessionId();
  }

  private getExistingSessionId(): string | null {
    const idParamName = 'id';
    const sessionId = this.route.snapshot.params[idParamName];
    if (sessionId) {
      return sessionId
    }
    return null;
  }

  onSubmitTrainingSessionForm(stepTwoData: EditTrainingSessionStepTwoComponent): void {

    console.log('Submit training session form detected');

    if (this.isNewSession) {
      this.createNewSession(stepTwoData);
    } else {
      this.updateExistingSession(stepTwoData);
    }
  }

  private createNewSession(stepTwoData: EditTrainingSessionStepTwoComponent) {
    this.userDataSubscription = this.userData$
      .pipe(
        withLatestFrom(
          this.store$.select(TrainingSessionStoreSelectors.selectYoutubeVideoData),
        )
      )
      .subscribe(([userData, videoData]) => {

        console.log('user subscription fired', userData);

        if (!videoData) {
          console.log(`No video data, terminating function`);
          this.userDataSubscription.unsubscribe();
          this.createTrainingSessionSubmitted = false;
          this.updateTrainingSessionSubmitted = false;
          return;
        }

        const trainingSessionNoId: TrainingSessionNoId = {
          complexityAverage: stepTwoData.complexityDefault.value as number,
          [TrainingSessionKeys.COMPLEXITY_DEFAULT]: stepTwoData.complexityDefault.value as number,
          complexityRatingCount: 1,
          creatorId: userData.id,
          [TrainingSessionKeys.EQUIPMENT]: stepTwoData.equipment.value as boolean,
          [TrainingSessionKeys.FOCUS_LIST]: (stepTwoData.focusList.value as TrainingSessionFocusDbOption[]).sort((a,b) => a.localeCompare(b)),
          intensityAverage: stepTwoData.intensityDefault.value as number,
          [TrainingSessionKeys.INTENSITY_DEFAULT]: stepTwoData.intensityDefault.value as number,
          intensityRatingCount: 1,
          [TrainingSessionKeys.VIDEO_PLATFORM]: TrainingSessionVideoPlatform.YOUTUBE,
          videoData
        };
        console.log('Training Session Data', trainingSessionNoId);
        this.store$.dispatch(TrainingSessionStoreActions.createTrainingSessionRequested({trainingSessionNoId}));
        this.postCreateTrainingSessionActions();
      })
  }

  private updateExistingSession(stepTwoData: EditTrainingSessionStepTwoComponent) {
    this.userDataSubscription = this.userData$
      .pipe(
        withLatestFrom(
          this.youtubeVideoData$,
          this.store$.select(TrainingSessionStoreSelectors.selectSessionById(this.getExistingSessionId() as string)) as Observable<TrainingSession>,
        )
      )
      .subscribe(([userData, videoData, existingTrainingData]) => {

        console.log('user subscription fired', userData);

        if (!videoData) {
          console.log(`No video data, terminating function`);
          this.userDataSubscription.unsubscribe();
          this.createTrainingSessionSubmitted = false;
          this.updateTrainingSessionSubmitted = false;
          return;
        }

        const updatedTrainingSession: Update<TrainingSession> = {
          id: existingTrainingData!.id,
          changes: {
            [TrainingSessionKeys.COMPLEXITY_DEFAULT]: stepTwoData.complexityDefault.value as number,
            [TrainingSessionKeys.EQUIPMENT]: stepTwoData.equipment.value as boolean,
            [TrainingSessionKeys.FOCUS_LIST]: (stepTwoData.focusList.value as TrainingSessionFocusDbOption[]).sort((a,b) => a.localeCompare(b)),
            [TrainingSessionKeys.INTENSITY_DEFAULT]: stepTwoData.intensityDefault.value as number,
          }            
        };
        console.log('Training Session Updates', updatedTrainingSession);
        this.store$.dispatch(TrainingSessionStoreActions.updateTrainingSessionRequested({trainingSessionUpdates: updatedTrainingSession}));
        this.postUpdateTrainingSessionActions();
      })
  }

  private postCreateTrainingSessionActions() {
    this.createTrainingSessionSubscription = this.createTrainingSessionProcessing$
      .pipe(
        withLatestFrom(this.createTrainingSessionError$)
      )
      .subscribe(([creatingSession, creationError]) => {
        if (creatingSession) {
          this.createTrainingSessionSubmitted = true;
        }

        if (creationError) {
          console.log('Error creating training session in database, terminating function');
          this.createTrainingSessionSubscription.unsubscribe();
          this.createTrainingSessionSubmitted = false;
          return;
        }

        if (!creatingSession && this.createTrainingSessionSubmitted) {
          console.log('Training session creation successful.');
          this.uiService.showSnackBar(`Training session created!`, 5000);
          this.createTrainingSessionSubscription.unsubscribe();
          this.store$.dispatch(TrainingSessionStoreActions.purgeYoutubeVideoData());
          this.navigateUserToBrowse();
        }
      })
  }

  private postUpdateTrainingSessionActions() {
    this.updateTrainingSessionSubscription = this.updateTrainingSessionProcessing$
      .pipe(
        withLatestFrom(this.updateTrainingSessionError$)
      )
      .subscribe(([updatingSession, updateError]) => {
        if (updatingSession) {
          this.updateTrainingSessionSubmitted = true;
        }

        if (updateError) {
          console.log('Error updating training session in database, terminating function');
          this.updateTrainingSessionSubscription.unsubscribe();
          this.updateTrainingSessionSubmitted = false;
          return;
        }

        if (!updatingSession && this.updateTrainingSessionSubmitted) {
          console.log('Training session update successful.');
          this.uiService.showSnackBar(`Training session updated!`, 5000);
          this.updateTrainingSessionSubscription.unsubscribe();
          this.store$.dispatch(TrainingSessionStoreActions.purgeYoutubeVideoData());
          this.navigateUserToBrowse();
        }
      })

  }

  navigateUserToBrowse(): void {
    // Note that on navigation, the CanDeactivate guard will prompt user to confirm action if changes detected
    this.router.navigate([PublicAppRoutes.BROWSE]);
  }


  // @HostListener allows us to also CanDeactivate Guard against browser refresh, close, etc.
  @HostListener('window:beforeunload') canDeactivate(): Observable<boolean> | boolean {
    // If form untouched, allow user to navigate freely
    const formIsClean = !this.stepOne.youtubeVideoDataForm.touched && 
                        !this.stepOne.youtubeVideoDataForm.dirty && 
                        !this.stepTwo.trainingSessionForm.touched && 
                        !this.stepTwo.trainingSessionForm.dirty;
    const createdOrUpdatedTrainingSession = this.updateTrainingSessionSubmitted || this.createTrainingSessionSubmitted;

    if (formIsClean || createdOrUpdatedTrainingSession) {
      return true;
    }
    // Otherwise, prompt the user to cancel operation
    return false;
  }

  ngOnDestroy(): void {
    
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }

    if (this.createTrainingSessionSubscription) {
      this.createTrainingSessionSubscription.unsubscribe();
    }
    
    if (this.updateTrainingSessionSubscription) {
      this.updateTrainingSessionSubscription.unsubscribe();
    }

  }

}
