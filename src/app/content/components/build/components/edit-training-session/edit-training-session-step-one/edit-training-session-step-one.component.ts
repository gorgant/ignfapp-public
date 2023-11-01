import { Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, throwError } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingSessionFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { TrainingSession } from 'shared-models/train/training-session.model';
import { YoutubeVideoDataCompact, YoutubeVideoDataKeys } from 'shared-models/youtube/youtube-video-data.model';
import { UiService } from 'src/app/core/services/ui.service';
import { TrainingSessionStoreActions, TrainingSessionStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-edit-training-session-step-one',
  templateUrl: './edit-training-session-step-one.component.html',
  styleUrls: ['./edit-training-session-step-one.component.scss']
})
export class EditTrainingSessionStepOneComponent implements OnInit, OnDestroy {

  @Input() editTrainingSessionStepper!: MatStepper;
  @Input() $currentTrainingSession = signal(undefined as TrainingSession | undefined);

  FORM_VALIDATION_MESSAGES = TrainingSessionFormValidationMessages;

  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  INPUT_YOUTUBE_VIDEO_URL_HINT = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_HINT
  INPUT_YOUTUBE_VIDEO_URL_FIELD_VALUE = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_FIELD_VALUE;
  INPUT_YOUTUBE_VIDEO_URL_STEP_LABEL = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_TITLE;

  private getYoutubeVideoDataProcessing$!: Observable<boolean>;
  private getYoutubeVideoDataSubscription!: Subscription;
  private getYoutubeVideoDataError$!: Observable<Error | null>;
  private getYoutubeVideoDataSubmitted = signal(false);
  private youtubeVideoData$!: Observable<YoutubeVideoDataCompact>;
  private videoUrlSubscription!: Subscription;

  private existingTrainingSessionDataSubscription!: Subscription;

  private fb = inject(FormBuilder);
  private store$ = inject(Store);
  private uiService = inject(UiService);

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
    this.getYoutubeVideoDataProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchYoutubeVideoDataProcessing);
    this.getYoutubeVideoDataError$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchYoutubeVideoDataError);
    this.youtubeVideoData$ = this.store$.select(TrainingSessionStoreSelectors.selectYoutubeVideoData) as Observable<YoutubeVideoDataCompact>;
  }

  // Note this observable is handled in the parent component
  private checkForExistingData() {
    const trainingSessionData = this.$currentTrainingSession();
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
    let videoId = url.split('/').pop() as string; // Grab the video ID from the end of the url https://stackoverflow.com/a/8376542/6572208
    // Parse out video ID if there's a query param
    if (videoId.includes('?')) {
      videoId = videoId.split('?')[0];
    }
    this.store$.dispatch(TrainingSessionStoreActions.purgeYoutubeVideoData()); // Clear out any errors if they exist before proceeding
    
    this.getYoutubeVideoDataSubscription = this.getYoutubeVideoDataError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.getYoutubeVideoDataSubmitted.set(false);
            this.youtubeVideoDataForm.reset(); // Prevents user from proceeding manually to next step by clicking in stepper
            this.getYoutubeVideoDataSubscription?.unsubscribe();
          }
          return combineLatest([this.getYoutubeVideoDataProcessing$, this.getYoutubeVideoDataError$]);
        }),
        filter(([videoDataProcessing, processingError]) => !processingError),
        switchMap(([videoDataProcessing, processingError]) => {
          if (!videoDataProcessing && !this.getYoutubeVideoDataSubmitted()) {
            this.store$.dispatch(TrainingSessionStoreActions.fetchYoutubeVideoDataRequested({videoId}));
            this.getYoutubeVideoDataSubmitted.set(true);
          }
          return this.youtubeVideoData$;
        }),
        filter(videoData => !!videoData),
        tap(videoData => {
          console.log('Video data retreival successful', videoData);
          this.videoDataRetreived.setValue(true); // Ensures youtube data is retreived before user can proceed
          this.getYoutubeVideoDataSubscription?.unsubscribe(); // Clear subscription no longer needed
          this.monitorYoutubeVideoUrlChange(); // Prevents user from proceeding if url edits are made after previous query
          this.proceedToNextStep();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private monitorYoutubeVideoUrlChange() {
    this.videoUrlSubscription = this.videoUrl.statusChanges
      .subscribe(change => {
        // Ensures new youtube data is retreived if user makes additional edits
        if (this.videoDataRetreived.value) {
          this.videoDataRetreived.setValue(false);
        }
      })
  }

  private proceedToNextStep() {
    console.log('Proceeding to next step');
    this.editTrainingSessionStepper.next();
  }

  ngOnDestroy(): void {
    this.getYoutubeVideoDataSubscription?.unsubscribe();
    this.videoUrlSubscription?.unsubscribe();
    this.existingTrainingSessionDataSubscription?.unsubscribe();
  }

  // These getters are used for easy access in the HTML template
  get videoDataRetreived() { return this.youtubeVideoDataForm.get(YoutubeVideoDataKeys.YOUTUBE_VIDEO_DATA_RETREIVED) as FormControl<boolean>; }
  get videoUrl() { return this.youtubeVideoDataForm.get(YoutubeVideoDataKeys.VIDEO_URL) as FormControl<string>; }

}
