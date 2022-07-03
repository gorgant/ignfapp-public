import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs/operators';
import { Subscription } from 'rxjs/internal/Subscription';
import { TrainingSessionVideoPlatform, TrainingSessionNoId, TrainingSessionFocusDbOption, TrainingSessionKeys, TrainingSession } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { RootStoreState, TrainingSessionStoreActions, TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { combineLatest, Observable, of } from 'rxjs';
import { StepperOrientation } from '@angular/material/stepper';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UiService } from 'src/app/core/services/ui.service';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { ComponentCanDeactivate } from 'src/app/core/route-guards/unsaved-changes.guard';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { EditTrainingSessionStepOneComponent } from './edit-training-session-step-one/edit-training-session-step-one.component';
import { EditTrainingSessionStepTwoComponent } from './edit-training-session-step-two/edit-training-session-step-two.component';
import { Update } from '@ngrx/entity';

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

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private uiService: UiService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.setStepperOrientation();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectUserData) as Observable<PublicUser>;

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

  onSubmitTrainingSessionForm(stepOneData: EditTrainingSessionStepOneComponent, stepTwoData: EditTrainingSessionStepTwoComponent): void {

    console.log('Submit training session form detected');

    this.userDataSubscription = this.userData$
      .pipe(
        withLatestFrom(
          stepOneData.youtubeVideoData$,
          stepTwoData.existingTrainingSessionData$,
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

        // If new session, create that session
        if (this.stepOne.isNewSession) {
          const trainingSessionNoId: TrainingSessionNoId = {
            complexityAverage: this.stepOne.isNewSession ? stepTwoData.complexityDefault.value as number : existingTrainingData!.complexityAverage,
            [TrainingSessionKeys.COMPLEXITY_DEFAULT]: stepTwoData.complexityDefault.value as number,
            complexityRatingCount: 1,
            creatorId: userData.id,
            [TrainingSessionKeys.EQUIPMENT]: stepTwoData.equipment?.value as boolean,
            [TrainingSessionKeys.FOCUS_LIST]: (stepTwoData.focusList.value as TrainingSessionFocusDbOption[]).sort((a,b) => a.localeCompare(b)),
            intensityAverage: this.stepOne.isNewSession ? stepTwoData.intensityDefault.value as number : existingTrainingData!.intensityAverage,
            [TrainingSessionKeys.INTENSITY_DEFAULT]: stepTwoData.intensityDefault.value as number,
            intensityRatingCount: 1,
            [TrainingSessionKeys.VIDEO_PLATFORM]: TrainingSessionVideoPlatform.YOUTUBE,
            videoData
          };
          console.log('Training Session Data', trainingSessionNoId);
          this.store$.dispatch(TrainingSessionStoreActions.createTrainingSessionRequested({trainingSessionNoId}));
          this.postCreateTrainingSessionActions();
        } else {
          // Otherwise, update the data changes
          const updatedTrainingSession: Update<TrainingSession> = {
            id: existingTrainingData!.id,
            changes: {
              [TrainingSessionKeys.COMPLEXITY_DEFAULT]: stepTwoData.complexityDefault.value as number,
              [TrainingSessionKeys.EQUIPMENT]: stepTwoData.equipment?.value as boolean,
              [TrainingSessionKeys.FOCUS_LIST]: (stepTwoData.focusList.value as TrainingSessionFocusDbOption[]).sort((a,b) => a.localeCompare(b)),
              [TrainingSessionKeys.INTENSITY_DEFAULT]: stepTwoData.intensityDefault.value as number,
            }            
          };
          console.log('Training Session Updates', updatedTrainingSession);
          this.store$.dispatch(TrainingSessionStoreActions.updateTrainingSessionRequested({trainingSessionUpdates: updatedTrainingSession}));
          this.postUpdateTrainingSessionActions();
        }
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
