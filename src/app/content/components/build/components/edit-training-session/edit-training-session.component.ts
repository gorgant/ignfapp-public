import { Component, HostListener, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/internal/Subscription';
import { TrainingSessionVideoPlatform, TrainingSessionNoIdOrTimestamps, TrainingSessionKeys, TrainingSession, TrainingSessionDatabaseCategoryTypes, ViewTrainingSessionsUlrParams, ViewTrainingSessionsUrlParamsKeys } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { TrainingSessionStoreActions, TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { combineLatest, Observable, throwError } from 'rxjs';
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
import { CanDeactivateData } from 'shared-models/utils/can-deactivate-data.model';

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
  DISCARD_EDITS_TITLE_VALUE = GlobalFieldValues.DISCARD_EDITS_TITLE;
  DISCARD_EDITS_BODY_VALUE = GlobalFieldValues.DISCARD_EDITS_BODY;
  DURATION_BLURB = GlobalFieldValues.DURATION;
  EDIT_SESSION_TITLE_VALUE = GlobalFieldValues.EDIT_SESSION;
  EDIT_SESSION_BUTTON_VALUE = GlobalFieldValues.EDIT_SESSION;
  FETCH_VIDEO_DATA_BUTTON_VALUE = GlobalFieldValues.FETCH_VIDEO_DATA;
  INPUT_YOUTUBE_VIDEO_URL_STEP_LABEL = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_TITLE;
  INPUT_SESSION_DATA_STEP_LABEL = GlobalFieldValues.INPUT_SESSION_DATA;
  SUBMIT_BUTTON_VALUE = GlobalFieldValues.SUBMIT;
  TITLE_BLURB = GlobalFieldValues.TITLE;

  private userData$!: Observable<PublicUser>;

  private createTrainingSessionProcessing$!: Observable<boolean>;
  private createTrainingSessionSubscription!: Subscription;
  private createTrainingSessionError$!: Observable<{} | null>;
  private createTrainingSessionSubmitted = signal(false);

  private updateTrainingSessionProcessing$!: Observable<boolean>;
  private updateTrainingSessionSubscription!: Subscription;
  private updateTrainingSessionError$!: Observable<{} | null>;
  private updateTrainingSessionSubmitted = signal(false);

  $currentTrainingSession = signal(undefined as TrainingSession | undefined);
  private $currentTrainingSessionId = signal(undefined as string | undefined);
  private fetchTrainingSessionProcessing$!: Observable<boolean>;
  private fetchTrainingSessionError$!: Observable<{} | null>;
  private $singleTrainingSessionRequested = signal(false);
  private currentTrainingSessionSubscription!: Subscription;

  serverRequestProcessing$!: Observable<boolean>;

  @ViewChild('stepOne') private stepOne!: EditTrainingSessionStepOneComponent;
  @ViewChild('stepTwo') private stepTwo!: EditTrainingSessionStepTwoComponent;

  $isNewSession = signal(false);

  getYoutubeVideoDataProcessing$!: Observable<boolean>;
  youtubeVideoData$!: Observable<YoutubeVideoDataCompact | null>;

  private store$ = inject(Store);
  private route = inject(ActivatedRoute);
  private uiService = inject(UiService);
  private router = inject(Router);
  

  constructor() { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.setStepperOrientation();
    this.configureTrainingSessionInterface();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;

    this.getYoutubeVideoDataProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchYoutubeVideoDataProcessing);
    this.youtubeVideoData$ = this.store$.select(TrainingSessionStoreSelectors.selectYoutubeVideoData);

    this.createTrainingSessionProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectCreateTrainingSessionProcessing);
    this.createTrainingSessionError$ = this.store$.select(TrainingSessionStoreSelectors.selectCreateTrainingSessionError);

    this.updateTrainingSessionProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectUpdateTrainingSessionProcessing);
    this.updateTrainingSessionError$ = this.store$.select(TrainingSessionStoreSelectors.selectUpdateTrainingSessionError);

    this.fetchTrainingSessionProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchSingleTrainingSessionProcessing);
    this.fetchTrainingSessionError$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchSingleTrainingSessionError);

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
    this.uiService.$screenIsMobile() ? this.stepperOrientation = 'vertical' : this.stepperOrientation = 'horizontal';
  }

  private configureTrainingSessionInterface(): void {
    this.setTrainingSessionId();
    const trainingSessionId = this.$currentTrainingSessionId();
    console.log('Is new trainingSession', !this.$currentTrainingSessionId());
    trainingSessionId ? this.setCurrentTrainingSessionData() : this.$isNewSession.set(true);
  }

  private setTrainingSessionId(): void {
    const idParamName = TrainingSessionKeys.ID;
    const sessionId = this.route.snapshot.params[idParamName] as string | undefined;
    if (sessionId) {
      this.$currentTrainingSessionId.set(sessionId);
    }
  }

  private setCurrentTrainingSessionData() {
    const trainingSessionId = this.$currentTrainingSessionId() as string;
    console.log('Session id found in url params', trainingSessionId);
    this.currentTrainingSessionSubscription = this.fetchTrainingSessionError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.$singleTrainingSessionRequested.set(false);
            this.navigateUserToBrowseTrainingSessions();
          }
          const singleTrainingSession$ = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(trainingSessionId)); 
          return combineLatest([singleTrainingSession$, this.fetchTrainingSessionProcessing$, this.fetchTrainingSessionError$]);
        }),
        filter(([trainingSession, fetchProcessing, processingError]) => !processingError),
        map(([trainingSession, fetchProcessing, processingError]) => {
          if (!trainingSession && !fetchProcessing && !this.$singleTrainingSessionRequested()) {
            console.log(`Session ${trainingSessionId} not in store, fetching from database`);
            this.store$.dispatch(TrainingSessionStoreActions.fetchSingleTrainingSessionRequested({sessionId: trainingSessionId}));
            this.$singleTrainingSessionRequested.set(true);
          }
          return trainingSession;
        }),
        filter(trainingSession => !!trainingSession),
        tap(trainingSession => {
          this.$currentTrainingSession.set(trainingSession);
          this.store$.dispatch(TrainingSessionStoreActions.setYoutubeVideoData({youtubeVideoData: trainingSession!.videoData}));
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  onSubmitTrainingSessionForm(stepTwoData: EditTrainingSessionStepTwoComponent): void {
    console.log('Submit training session form detected');
    this.$isNewSession() ? this.createNewSession(stepTwoData) : this.updateExistingSession(stepTwoData);
  }

  private createNewSession(stepTwoData: EditTrainingSessionStepTwoComponent) {
    this.createTrainingSessionSubscription = this.createTrainingSessionError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.createTrainingSessionSubmitted.set(false);
          }
          return combineLatest([this.userData$, this.youtubeVideoData$, this.createTrainingSessionError$]);
        }),
        filter(([userData, videoData, processingError]) => !processingError && !!videoData),
        switchMap(([userData, videoData, processingError]) => {
          if (!this.createTrainingSessionSubmitted()) {
            this.createTrainingSessionSubmitted.set(true); // This must come before the update code because in the time it takes to complete the below sort function this thing fires multiple times, causing weird behavior
            const trainingSessionNoId: TrainingSessionNoIdOrTimestamps = {
              [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: (stepTwoData.activityCategoryList.value).sort((a,b) => a.localeCompare(b)),
              complexityAverage: stepTwoData.complexityDefault.value,
              [TrainingSessionKeys.COMPLEXITY_DEFAULT]: stepTwoData.complexityDefault.value,
              complexityRatingCount: 1,
              creatorId: userData.id,
              databaseCategory: TrainingSessionDatabaseCategoryTypes.CANONICAL,
              [TrainingSessionKeys.EQUIPMENT]: stepTwoData.equipment.value,
              intensityAverage: stepTwoData.intensityDefault.value,
              [TrainingSessionKeys.INTENSITY_DEFAULT]: stepTwoData.intensityDefault.value,
              intensityRatingCount: 1,
              [TrainingSessionKeys.MUSCLE_GROUP]: stepTwoData.muscleGroup.value,
              [TrainingSessionKeys.VIDEO_PLATFORM]: TrainingSessionVideoPlatform.YOUTUBE,
              videoData: videoData!
            };
            console.log('Training Session Data', trainingSessionNoId);
            this.store$.dispatch(TrainingSessionStoreActions.createTrainingSessionRequested({trainingSessionNoId}));
            
          }
          return this.createTrainingSessionProcessing$;
        }),
        filter( creationProcessing => !creationProcessing && this.createTrainingSessionSubmitted()),
        tap(creationProcessing => {
          console.log('Training session creation successful.');
          this.uiService.showSnackBar(`Training session created!`, 5000);
          this.store$.dispatch(TrainingSessionStoreActions.purgeYoutubeVideoData());
          this.navigateUserToBrowseTrainingSessions();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private updateExistingSession(stepTwoData: EditTrainingSessionStepTwoComponent) {
    const sessionId = this.$currentTrainingSessionId() as string;
    const currentTrainingSessionData$ = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(sessionId)) as Observable<TrainingSession>;

    this.updateTrainingSessionSubscription = this.updateTrainingSessionError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.updateTrainingSessionSubmitted.set(false);
          }
          return combineLatest([currentTrainingSessionData$, this.youtubeVideoData$, this.updateTrainingSessionError$]);
        }),
        filter(([currentTrainingSessionData, videoData, processingError]) => !processingError && !!videoData),
        switchMap(([currentTrainingSessionData, videoData, processingError]) => {
          console.log('Processing error', processingError);
          if (!this.updateTrainingSessionSubmitted()) {
            this.updateTrainingSessionSubmitted.set(true); // This must come before the update code because in the time it takes to complete the below sort function this thing fires multiple times, causing weird behavior
            const updatedTrainingSession: Update<TrainingSession> = {
              id: currentTrainingSessionData.id,
              changes: {
                [TrainingSessionKeys.COMPLEXITY_DEFAULT]: stepTwoData.complexityDefault.value,
                [TrainingSessionKeys.EQUIPMENT]: stepTwoData.equipment.value,
                [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: ([...stepTwoData.activityCategoryList.value]).sort((a,b) => a.localeCompare(b)),
                [TrainingSessionKeys.MUSCLE_GROUP]: (stepTwoData.muscleGroup.value),
                [TrainingSessionKeys.INTENSITY_DEFAULT]: stepTwoData.intensityDefault.value,
              }            
            };
            console.log('Training Session Updates', updatedTrainingSession);
            this.store$.dispatch(TrainingSessionStoreActions.updateTrainingSessionRequested({trainingSessionUpdates: updatedTrainingSession}));
          }
          // return combineLatest([currentTrainingSessionData$, this.updateTrainingSessionProcessing$]);
          return this.updateTrainingSessionProcessing$;
        }),
        // filter(([currentTrainingSessionData, updateProcessing]) => !updateProcessing && this.updateTrainingSessionSubmitted()),
        filter(updateProcessing => !updateProcessing && this.updateTrainingSessionSubmitted()),
        // tap(([currentTrainingSessionData, updateProcessing]) => {
        tap(updateProcessing => {
          console.log('Training session update successful.');
          this.uiService.showSnackBar(`Training session updated!`, 5000);
          this.store$.dispatch(TrainingSessionStoreActions.purgeYoutubeVideoData());
          this.router.navigate([PublicAppRoutes.TRAINING_SESSION, this.$currentTrainingSessionId()]);
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          return throwError(() => new Error(error));
        })
      ).subscribe();

  }

  private navigateUserToBrowseTrainingSessions(): void {
    // Note that on navigation, the CanDeactivate guard will prompt user to confirm action if unsaved changes detected
    const queryParams: ViewTrainingSessionsUlrParams = {
      [ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS]: true, // Ensures the user views training sessions vs plans
    };
    const navigationExtras: NavigationExtras = {queryParams};
    this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
  }

  // @HostListener allows us to also CanDeactivate Guard against browser refresh, close, etc.
  @HostListener('window:beforeunload') canDeactivate(): Observable<CanDeactivateData> | CanDeactivateData {
    // If form untouched, allow user to navigate freely
    const formIsClean = !this.stepOne.youtubeVideoDataForm.touched && 
                        !this.stepOne.youtubeVideoDataForm.dirty && 
                        !this.stepTwo.trainingSessionForm.touched && 
                        !this.stepTwo.trainingSessionForm.dirty;
    const createdOrUpdatedTrainingSession = this.updateTrainingSessionSubmitted() || this.createTrainingSessionSubmitted();

    const canDeactivateData: CanDeactivateData = {
      deactivationPermitted: formIsClean || createdOrUpdatedTrainingSession,
      warningMessage: {
        title: this.DISCARD_EDITS_TITLE_VALUE,
        body: this.DISCARD_EDITS_BODY_VALUE
      }
    }

    return canDeactivateData;
  }

  ngOnDestroy(): void {
    this.currentTrainingSessionSubscription?.unsubscribe();
    this.createTrainingSessionSubscription?.unsubscribe();
    this.updateTrainingSessionSubscription?.unsubscribe();

    // Purge if canceled operation
    if (this.createTrainingSessionSubmitted() || this.updateTrainingSessionSubmitted()) {
      this.store$.dispatch(TrainingSessionStoreActions.purgeYoutubeVideoData());
    }

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
