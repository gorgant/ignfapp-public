import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, filter, map, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { Subscription } from 'rxjs/internal/Subscription';
import { TrainingSessionVideoPlatform, TrainingSessionKeys, CanonicalTrainingSession, TrainingSessionDatabaseCategoryTypes, BrowseTrainingSessionsQueryParams, BrowseTrainingSessionsQueryParamsKeys, CanonicalTrainingSessionNoIdOrTimestamps, TrainingSessionVisibilityCategoryDbOption, ViewCanonicalTrainingSessionQueryParams, ViewCanonicalTrainingSessionQueryParamsKeys } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { TrainingSessionStoreActions, TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { combineLatest, Observable, throwError } from 'rxjs';
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
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ProcessingSpinnerComponent } from 'src/app/shared/components/processing-spinner/processing-spinner.component';
import { BackButtonDirective } from 'src/app/shared/directives/back-button.directive';
import { DurationIsoToMmSsPipe } from 'src/app/shared/pipes/duration-iso-to-mm-ss.pipe';

@Component({
    selector: 'app-edit-training-session',
    templateUrl: './edit-training-session.component.html',
    styleUrls: ['./edit-training-session.component.scss'],
    providers: [{
            provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } // Required for stepper error to show
        }],
    standalone: true,
    imports: [MatStepperModule, EditTrainingSessionStepOneComponent, MatButtonModule, ProcessingSpinnerComponent, BackButtonDirective, EditTrainingSessionStepTwoComponent, AsyncPipe, DurationIsoToMmSsPipe]
})
export class EditTrainingSessionComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  
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
  private $createTrainingSessionCycleInit = signal(false);
  private $createTrainingSessionCycleComplete = signal(false);
  
  private updateTrainingSessionProcessing$!: Observable<boolean>;
  private updateTrainingSessionSubscription!: Subscription;
  private updateTrainingSessionError$!: Observable<{} | null>;
  private updateTrainingSessionSubmitted = signal(false);
  private $updateTrainingSessionCycleInit = signal(false);
  private $updateTrainingSessionCycleComplete = signal(false);

  $localTrainingSession = signal(undefined as CanonicalTrainingSession | undefined);
  private $currentTrainingSessionId = signal(undefined as string | undefined);
  private fetchTrainingSessionProcessing$!: Observable<boolean>;
  private fetchTrainingSessionError$!: Observable<{} | null>;
  private $fetchSingleTrainingSessionSubmitted = signal(false);
  private currentTrainingSessionSubscription!: Subscription;

  serverRequestProcessing$!: Observable<boolean>;

  // @ViewChild('stepZero') private stepZero!: EditTrainingSessionStepZeroComponent;
  @ViewChild('editTrainingSessionStepper') private editTrainingSessionStepper!: MatStepper;
  @ViewChild('stepOne') private stepOne!: EditTrainingSessionStepOneComponent;
  @ViewChild('stepTwo') private stepTwo!: EditTrainingSessionStepTwoComponent;

  $stepOneComplete = signal(false);

  $isNewSession = signal(false);
  $trainingSessionVisibilityCategory = signal(undefined as TrainingSessionVisibilityCategoryDbOption | undefined);

  getYoutubeVideoDataProcessing$!: Observable<boolean>;
  youtubeVideoData$!: Observable<YoutubeVideoDataCompact | null>;

  private store$ = inject(Store);
  private route = inject(ActivatedRoute);
  private uiService = inject(UiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private combinedComponentErrors$!: Observable<{} | null>;
  

  constructor() { }

  ngOnInit(): void {
    this.monitorProcesses();
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

  // This listens for an event emitted from the Step 1 component
  handleStepOneCompletion(isComplete: boolean) {
    this.$stepOneComplete.set(isComplete);
    this.cdr.detectChanges(); // This prevents a ExpressionChangedAfterItHasBeenCheckedError if loading an existing trainingSession
    if (isComplete) {
      console.log('Step one complete, proceeding to next step');
      const stepOne = this.editTrainingSessionStepper?.steps.get(0); 
      if (stepOne) {
        stepOne.completed = true;
        this.editTrainingSessionStepper.next() // Programatically trigger the stepper to move to the next step
      }
    } else {
      const stepOne = this.editTrainingSessionStepper.steps.get(0); 
      if (stepOne) {
        stepOne.completed = false;
      }
    }
  }

  private configureTrainingSessionInterface(): void {
    this.setTrainingSessionId();
    this.setTrainingSessionVisibilityCategory();
    const visibilityCategory = this.$trainingSessionVisibilityCategory();
    const trainingSessionId = this.$currentTrainingSessionId();
    console.log('Is new trainingSession', (!this.$currentTrainingSessionId() && !this.$trainingSessionVisibilityCategory()));
    (trainingSessionId && visibilityCategory) ? this.setCurrentTrainingSessionData() : this.$isNewSession.set(true);
  }

  private setTrainingSessionId(): void {
    const sessionId = this.route.snapshot.params[TrainingSessionKeys.ID] as string | undefined;
    this.$currentTrainingSessionId.set(sessionId);
  }

  private setTrainingSessionVisibilityCategory(): void {
    const visibilityCategory = this.route.snapshot.queryParamMap.get(TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY) as TrainingSessionVisibilityCategoryDbOption | undefined;
    this.$trainingSessionVisibilityCategory.set(visibilityCategory);
  }

  private setCurrentTrainingSessionData() {
    const trainingSessionId = this.$currentTrainingSessionId() as string;
    console.log('Session id found in url params', trainingSessionId);
    this.currentTrainingSessionSubscription = this.fetchTrainingSessionError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetSetTrainingSessionComponentState();
            this.navigateToBrowseWithTrainingSessionSelection();
          }
          const singleTrainingSession$ = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(trainingSessionId)); 
          return singleTrainingSession$;
        }),
        withLatestFrom(this.fetchTrainingSessionError$, this.userData$),
        filter(([trainingSession, processingError, userData]) => !processingError),
        map(([trainingSession, processingError, userData]) => {
          if (!this.$fetchSingleTrainingSessionSubmitted()) {
            console.log(`Session ${trainingSessionId} not in store, fetching from database`);
            this.store$.dispatch(TrainingSessionStoreActions.fetchSingleTrainingSessionRequested({sessionId: trainingSessionId, userId: userData.id, visibilityCategory: this.$trainingSessionVisibilityCategory()!}));
            this.$fetchSingleTrainingSessionSubmitted.set(true);
          }
          return trainingSession;
        }),
        filter(trainingSession => !!trainingSession),
        tap(trainingSession => {
          this.$localTrainingSession.set(trainingSession);
          this.store$.dispatch(TrainingSessionStoreActions.setYoutubeVideoData({youtubeVideoData: trainingSession!.videoData}));
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetSetTrainingSessionComponentState();
          this.navigateToBrowseWithTrainingSessionSelection();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetSetTrainingSessionComponentState() {
    this.currentTrainingSessionSubscription?.unsubscribe();
    this.$fetchSingleTrainingSessionSubmitted.set(false);
    this.store$.dispatch(TrainingSessionStoreActions.purgeTrainingSessionErrors());
  }

  onSubmitTrainingSessionForm(): void {
    console.log('Submit training session form detected');
    this.$isNewSession() ? this.createNewSession() : this.updateExistingSession();
  }

  private createNewSession() {
    this.createTrainingSessionSubscription = this.createTrainingSessionError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetCreateTrainingSessionComponentState();
          }
          return this.userData$;
        }),
        withLatestFrom(this.youtubeVideoData$, this.createTrainingSessionError$),
        filter(([userData, videoData, processingError]) => !processingError && !!videoData),
        switchMap(([userData, videoData, processingError]) => {
          if (!this.createTrainingSessionSubmitted()) {
            this.createTrainingSessionSubmitted.set(true); // This must come before the update code because in the time it takes to complete the below sort function this thing fires multiple times, causing weird behavior
            const trainingSessionNoId: CanonicalTrainingSessionNoIdOrTimestamps = {
              [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: (this.stepTwo.activityCategoryList.value).sort((a,b) => a.localeCompare(b)),
              [TrainingSessionKeys.COMPLEXITY_AVERAGE]: this.stepTwo.complexityDefault.value,
              [TrainingSessionKeys.COMPLEXITY_DEFAULT]: this.stepTwo.complexityDefault.value,
              [TrainingSessionKeys.COMPLEXITY_RATING_COUNT]: 1,
              [TrainingSessionKeys.CREATOR_ID]: userData.id,
              [TrainingSessionKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.CANONICAL,
              [TrainingSessionKeys.EQUIPMENT]: this.stepTwo.equipment.value,
              [TrainingSessionKeys.INTENSITY_AVERAGE]: this.stepTwo.intensityDefault.value,
              [TrainingSessionKeys.INTENSITY_DEFAULT]: this.stepTwo.intensityDefault.value,
              [TrainingSessionKeys.INTENSITY_RATING_COUNT]: 1,
              [TrainingSessionKeys.KEYWORD_LIST]: this.stepTwo.keywordList.value,
              [TrainingSessionKeys.MUSCLE_GROUP]: this.stepTwo.muscleGroup.value,
              [TrainingSessionKeys.VIDEO_PLATFORM]: TrainingSessionVideoPlatform.YOUTUBE,
              [TrainingSessionKeys.VIDEO_DATA]: videoData!,
              [TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY]: this.stepOne.visibilityCategory.value
            };
            console.log('Training Session Data', trainingSessionNoId);
            this.store$.dispatch(TrainingSessionStoreActions.createTrainingSessionRequested({trainingSessionNoId, userId: userData.id}));
          }
          return this.createTrainingSessionProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(createProcessing => {
          if (createProcessing) {
            this.$createTrainingSessionCycleInit.set(true);
          }
          if (!createProcessing && this.$createTrainingSessionCycleInit()) {
            console.log('createTrainingSession successful, proceeding with pipe.');
            this.$createTrainingSessionCycleInit.set(false);
            this.$createTrainingSessionCycleComplete.set(true);
          }
        }),
        filter(creationProcessing => !creationProcessing && this.$createTrainingSessionCycleComplete()),
        tap(creationProcessing => {
          this.uiService.showSnackBar(`Training session created!`, 5000);
          this.store$.dispatch(TrainingSessionStoreActions.purgeYoutubeVideoData());
          this.navigateToBrowseWithTrainingSessionSelection();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetCreateTrainingSessionComponentState();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetCreateTrainingSessionComponentState() {
    this.createTrainingSessionSubscription?.unsubscribe();
    this.createTrainingSessionSubmitted.set(false);
    this.$createTrainingSessionCycleInit.set(false);
    this.$createTrainingSessionCycleComplete.set(false);
    this.store$.dispatch(TrainingSessionStoreActions.purgeTrainingSessionErrors());
  }

  private updateExistingSession() {
    const sessionId = this.$currentTrainingSessionId() as string;
    const currentTrainingSessionData$ = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(sessionId)) as Observable<CanonicalTrainingSession>;

    this.updateTrainingSessionSubscription = this.updateTrainingSessionError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetUpdateTrainingSessionComponentState();
          }
          return currentTrainingSessionData$;
        }),
        withLatestFrom(this.youtubeVideoData$, this.updateTrainingSessionError$, this.userData$),
        filter(([currentTrainingSessionData, videoData, processingError, userData]) => !processingError && !!videoData),
        switchMap(([currentTrainingSessionData, videoData, processingError, userData]) => {
          if (!this.updateTrainingSessionSubmitted()) {
            this.updateTrainingSessionSubmitted.set(true); // This must come before the update code because in the time it takes to complete the below sort function this thing fires multiple times, causing weird behavior
            const updatedTrainingSession: Update<CanonicalTrainingSession> = {
              id: currentTrainingSessionData.id,
              changes: {
                [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: ([...this.stepTwo.activityCategoryList.value]).sort((a,b) => a.localeCompare(b)),
                [TrainingSessionKeys.COMPLEXITY_DEFAULT]: this.stepTwo.complexityDefault.value,
                [TrainingSessionKeys.EQUIPMENT]: this.stepTwo.equipment.value,
                [TrainingSessionKeys.INTENSITY_DEFAULT]: this.stepTwo.intensityDefault.value,
                [TrainingSessionKeys.KEYWORD_LIST]: this.stepTwo.keywordList.value,
                [TrainingSessionKeys.MUSCLE_GROUP]: (this.stepTwo.muscleGroup.value),
              }            
            };
            console.log('Training Session Updates', updatedTrainingSession);
            this.store$.dispatch(TrainingSessionStoreActions.updateTrainingSessionRequested({
              trainingSessionUpdates: updatedTrainingSession, 
              userId: userData.id, 
              visibilityCategory: this.$trainingSessionVisibilityCategory()!
            }));
          }
          return this.updateTrainingSessionProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(updateProcessing => {
          if (updateProcessing) {
            this.$updateTrainingSessionCycleInit.set(true);
          }
          if (!updateProcessing && this.$updateTrainingSessionCycleInit()) {
            console.log('updateTrainingSession successful, proceeding with pipe.');
            this.$updateTrainingSessionCycleInit.set(false);
            this.$updateTrainingSessionCycleComplete.set(true);
          }
        }),
        filter(updateProcessing => !updateProcessing && this.$updateTrainingSessionCycleComplete()),
        tap(updateProcessing => {
          this.uiService.showSnackBar(`Training session updated!`, 5000);
          this.store$.dispatch(TrainingSessionStoreActions.purgeYoutubeVideoData());
          this.navigateToTrainingSessionWithParams();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetUpdateTrainingSessionComponentState();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetUpdateTrainingSessionComponentState() {
    this.updateTrainingSessionSubscription?.unsubscribe();
    this.updateTrainingSessionSubmitted.set(false);
    this.$updateTrainingSessionCycleInit.set(false);
    this.$updateTrainingSessionCycleComplete.set(false);
    this.store$.dispatch(TrainingSessionStoreActions.purgeTrainingSessionErrors());
  }

  private navigateToTrainingSessionWithParams(): void {
    const canonicalTrainingSessionData = this.$localTrainingSession()!;
    // Note that on navigation, the CanDeactivate guard will prompt user to confirm action if unsaved changes detected
    const queryParams: ViewCanonicalTrainingSessionQueryParams = {
      [ViewCanonicalTrainingSessionQueryParamsKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.CANONICAL,
      [ViewCanonicalTrainingSessionQueryParamsKeys.TRAINING_SESSION_VISIBILITY_CATEGORY]: canonicalTrainingSessionData[TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY],
    };
    const navigationExtras: NavigationExtras = {queryParams};
    this.router.navigate([PublicAppRoutes.TRAIN_TRAINING_SESSION, this.$currentTrainingSessionId()], navigationExtras);
  }

  private navigateToBrowseWithTrainingSessionSelection(): void {
    // Note that on navigation, the CanDeactivate guard will prompt user to confirm action if unsaved changes detected
    console.log('BrowseTrainingSessionsUlrParams property', BrowseTrainingSessionsQueryParamsKeys.VIEW_TRAINING_SESSIONS);
    const queryParams: BrowseTrainingSessionsQueryParams = {
      [BrowseTrainingSessionsQueryParamsKeys.VIEW_TRAINING_SESSIONS]: true, // Ensures the user views training sessions vs plans
    };
    const navigationExtras: NavigationExtras = {queryParams};
    this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
  }

  // @HostListener allows us to also CanDeactivate Guard against browser refresh, close, etc.
  @HostListener('window:beforeunload') canDeactivate(): Observable<CanDeactivateData> | CanDeactivateData {
    // If form untouched, allow user to navigate freely
    const formIsClean = !this.stepOne?.youtubeVideoDataForm?.touched && 
                        !this.stepOne?.youtubeVideoDataForm?.dirty && 
                        !this.stepTwo?.trainingSessionForm?.touched && 
                        !this.stepTwo?.trainingSessionForm?.dirty;
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
    if (!this.createTrainingSessionSubmitted() || !this.updateTrainingSessionSubmitted()) {
      this.store$.dispatch(TrainingSessionStoreActions.purgeYoutubeVideoData());
    }

  }

}
