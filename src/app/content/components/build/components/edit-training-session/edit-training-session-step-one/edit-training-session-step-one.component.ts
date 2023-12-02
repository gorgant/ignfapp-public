import { Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Store } from '@ngrx/store';
import { Observable, Subscription, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingSessionFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { SocialUrlPrefixes } from 'shared-models/meta/social-urls.model';
import { CanonicalTrainingSession } from 'shared-models/train/training-session.model';
import { YoutubeVideoDataCompact, YoutubeVideoDataKeys } from 'shared-models/youtube/youtube-video-data.model';
import { HelperService } from 'src/app/core/services/helpers.service';
import { UiService } from 'src/app/core/services/ui.service';
import { TrainingSessionStoreActions, TrainingSessionStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-edit-training-session-step-one',
  templateUrl: './edit-training-session-step-one.component.html',
  styleUrls: ['./edit-training-session-step-one.component.scss']
})
export class EditTrainingSessionStepOneComponent implements OnInit, OnDestroy {

  @Input() editTrainingSessionStepper!: MatStepper;
  @Input() $localTrainingSession = signal(undefined as CanonicalTrainingSession | undefined);

  FORM_VALIDATION_MESSAGES = TrainingSessionFormValidationMessages;

  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  INPUT_YOUTUBE_VIDEO_URL_HINT = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_HINT
  INPUT_YOUTUBE_VIDEO_URL_FIELD_VALUE = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_FIELD_VALUE;
  INPUT_YOUTUBE_VIDEO_URL_STEP_LABEL = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_TITLE;

  private fetchYoutubeVideoDataProcessing$!: Observable<boolean>;
  private fetchYoutubeVideoDataSubscription!: Subscription;
  private fetchYoutubeVideoDataError$!: Observable<Error | null>;
  private fetchYoutubeVideoDataSubmitted = signal(false);
  private youtubeVideoData$!: Observable<YoutubeVideoDataCompact>;
  private videoUrlSubscription!: Subscription;

  private existingTrainingSessionDataSubscription!: Subscription;

  private fb = inject(FormBuilder);
  private store$ = inject(Store);
  private uiService = inject(UiService);
  private helperService = inject(HelperService);

  youtubeVideoDataForm = this.fb.group({
    [YoutubeVideoDataKeys.VIDEO_URL]: ['', [Validators.required, Validators.pattern(/^((https:\/\/www\.youtube\.com)|(https:\/\/youtu\.be))/)]],
    [YoutubeVideoDataKeys.YOUTUBE_VIDEO_DATA_RETREIVED]: [false, [Validators.requiredTrue]]
  });

  constructor() { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.checkForExistingData()
  }

  private monitorProcesses() {
    this.fetchYoutubeVideoDataProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchYoutubeVideoDataProcessing);
    this.fetchYoutubeVideoDataError$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchYoutubeVideoDataError);
    this.youtubeVideoData$ = this.store$.select(TrainingSessionStoreSelectors.selectYoutubeVideoData) as Observable<YoutubeVideoDataCompact>;
  }

  get videoUrlErrorMessage() {
    let errorMessage = '';
    if (this.videoUrl.hasError('required')) {
      return errorMessage = 'You must enter a value';
    }
    if (this.videoUrl.hasError('pattern')) {
      return errorMessage = `Video url must begin with '${SocialUrlPrefixes.YOUTUBE_VIDEO}' or '${SocialUrlPrefixes.YOUTUBE_VIDEO_LONG}'`;
    }
    return errorMessage;
  }

  // Note this observable is handled in the parent component
  private checkForExistingData() {
    const trainingSessionData = this.$localTrainingSession();
    console.log('Found this trainingSessionData in step one', trainingSessionData);
    if (trainingSessionData) {
      this.videoUrl.setValue(trainingSessionData.videoData.videoUrl);
      this.videoUrl.disable();
      this.videoDataRetreived.setValue(true);
      this.proceedToNextStep();
    }
  }

  onGetYoutubeVideoData() {
    const url = this.videoUrl.value as string;

    const videoId = this.helperService.extractYoutubeVideoIdFromUrl(url);

    if (!videoId) {
      this.uiService.showSnackBar('Invalid YouTube URL. Please try again.', 10000);
      return;
    }

    this.store$.dispatch(TrainingSessionStoreActions.purgeYoutubeVideoData()); // Clear out any errors if they exist before proceeding
    
    this.fetchYoutubeVideoDataSubscription = this.fetchYoutubeVideoDataError$
      .pipe(
        map(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetComponentState();
          }
          return processingError;
        }),
        filter(processingError => !processingError),
        switchMap(processingError => {
          if (!this.fetchYoutubeVideoDataSubmitted()) {
            this.store$.dispatch(TrainingSessionStoreActions.fetchYoutubeVideoDataRequested({videoId}));
            this.fetchYoutubeVideoDataSubmitted.set(true);
          }
          return this.youtubeVideoData$;
        }),
        filter(videoData => !!videoData),
        tap(videoData => {
          console.log('Video data retreival successful', videoData);
          this.videoDataRetreived.setValue(true); // Ensures youtube data is retreived before user can proceed
          this.fetchYoutubeVideoDataSubscription?.unsubscribe(); // Clear subscription no longer needed
          this.monitorYoutubeVideoUrlChange(); // Prevents user from proceeding if url edits are made after previous query
          this.proceedToNextStep();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetComponentState();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetComponentState() {
    this.fetchYoutubeVideoDataSubscription?.unsubscribe();
    this.fetchYoutubeVideoDataSubmitted.set(false);
    this.youtubeVideoDataForm.reset(); // Prevents user from proceeding manually to next step by clicking in stepper
    this.store$.dispatch(TrainingSessionStoreActions.purgeTrainingSessionErrors());
  }

  private monitorYoutubeVideoUrlChange() {
    this.videoUrlSubscription = this.videoUrl.statusChanges
      .pipe(
        tap(change => {
          // Ensures new youtube data is retreived if user makes additional edits
          if (this.videoDataRetreived.value) {
            this.videoDataRetreived.setValue(false);
          }
        })
      ).subscribe();
  }

  private proceedToNextStep() {
    console.log('Proceeding to next step');
    this.editTrainingSessionStepper.next();
  }

  ngOnDestroy(): void {
    this.fetchYoutubeVideoDataSubscription?.unsubscribe();
    this.videoUrlSubscription?.unsubscribe();
    this.existingTrainingSessionDataSubscription?.unsubscribe();
  }

  // These getters are used for easy access in the HTML template
  get videoDataRetreived() { return this.youtubeVideoDataForm.get(YoutubeVideoDataKeys.YOUTUBE_VIDEO_DATA_RETREIVED) as FormControl<boolean>; }
  get videoUrl() { return this.youtubeVideoDataForm.get(YoutubeVideoDataKeys.VIDEO_URL) as FormControl<string>; }

}
