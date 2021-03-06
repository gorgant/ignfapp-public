import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingSessionFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { YoutubeVideoDataCompact, YoutubeVideoDataKeys } from 'shared-models/youtube/youtube-video-data.model';
import { RootStoreState, TrainingSessionStoreActions, TrainingSessionStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-edit-training-session-step-one',
  templateUrl: './edit-training-session-step-one.component.html',
  styleUrls: ['./edit-training-session-step-one.component.scss']
})
export class EditTrainingSessionStepOneComponent implements OnInit, OnDestroy {

  @Input() editTrainingSessionStepper!: MatStepper;
  youtubeVideoDataForm = new FormGroup({
    [YoutubeVideoDataKeys.VIDEO_URL]: new FormControl('', [Validators.required, Validators.pattern(/^\S*(?:https\:\/\/youtu\.be)\S*$/)]),
    [YoutubeVideoDataKeys.YOUTUBE_VIDEO_DATA_RETREIVED]: new FormControl(false, [Validators.requiredTrue])
  });
  FORM_VALIDATION_MESSAGES = TrainingSessionFormValidationMessages;

  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  INPUT_YOUTUBE_VIDEO_URL_HINT = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_HINT
  INPUT_YOUTUBE_VIDEO_URL_FIELD_VALUE = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_FIELD_VALUE;
  INPUT_YOUTUBE_VIDEO_URL_STEP_LABEL = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_TITLE;

  getYoutubeVideoDataProcessing$!: Observable<boolean>;
  getYoutubeVideoDataSubscription!: Subscription;
  getYoutubeVideoDataError$!: Observable<Error | null>;
  getYoutubeVideoDataSubmitted!: boolean;
  youtubeVideoData$!: Observable<YoutubeVideoDataCompact>;
  videoUrlSubscription!: Subscription;

  fetchTrainingSessionProcessing$!: Observable<boolean>;
  existingTrainingSessionDataSubscription!: Subscription;


  constructor(
    private store$: Store<RootStoreState.AppState>,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.checkForExistingData()
  }

  private monitorProcesses() {
    this.getYoutubeVideoDataProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchYoutubeVideoDataProcessing);
    this.getYoutubeVideoDataError$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchYoutubeVideoDataError);
    this.youtubeVideoData$ = this.store$.select(TrainingSessionStoreSelectors.selectYoutubeVideoData) as Observable<YoutubeVideoDataCompact>;

    this.fetchTrainingSessionProcessing$ = this.store$.select(TrainingSessionStoreSelectors.selectFetchSingleTrainingSessionProcessing);
  }

  private checkForExistingData() {
    // Check if id params are available
    const idParamName = 'id';
    const sessionId = this.route.snapshot.params[idParamName];
    if (sessionId) {
      console.log('Session id found in url params', sessionId);
      
      this.existingTrainingSessionDataSubscription = this.store$.select(TrainingSessionStoreSelectors.selectTrainingSessionById(sessionId))
        .pipe(withLatestFrom(this.fetchTrainingSessionProcessing$))
        .subscribe(([trainingSession, fetchProcessing]) => {
          if (!trainingSession && !fetchProcessing) {
            console.log(`Session ${sessionId} not in store, fetching from database`);
            this.store$.dispatch(TrainingSessionStoreActions.fetchSingleTrainingSessionRequested({sessionId}));
          }
          if (trainingSession) {
            this.videoUrl.setValue(trainingSession.videoData.videoUrl);
            this.store$.dispatch(TrainingSessionStoreActions.setYoutubeVideoData({youtubeVideoData: trainingSession.videoData}));
            this.videoDataRetreived.setValue(true);
            this.editTrainingSessionStepper.next();
          }
        });
    }
  }

  onGetYoutubeVideoData() {
    const url = this.videoUrl.value as string;
    const videoId = url.split('/').pop() as string; // Grab the video ID from the end of the url https://stackoverflow.com/a/8376542/6572208
    this.store$.dispatch(TrainingSessionStoreActions.fetchYoutubeVideoDataRequested({videoId}));
    this.postGetYoutubeVideoDataActions();
  }

  private postGetYoutubeVideoDataActions() {

    this.getYoutubeVideoDataSubscription = this.youtubeVideoData$
      .pipe(
        withLatestFrom(this.getYoutubeVideoDataProcessing$, this.getYoutubeVideoDataError$)
      )
      .subscribe(([videoData, processing, error]) => {
        if (processing) {
          this.getYoutubeVideoDataSubmitted = true;
        }

        // If error, cancel operation
        if (error) {
          console.log('Error fetching video data, resetting form');
          this.getYoutubeVideoDataSubscription.unsubscribe();
          this.getYoutubeVideoDataSubmitted = false;
          this.youtubeVideoDataForm.reset(); // Prevents user from proceeding manually to next step by clicking in stepper
          return;
        }

        // If succeeds, proceed to next step
        if (this.getYoutubeVideoDataSubmitted && !processing) {
          console.log('Video data retreival successful');
          console.log('Image url', videoData.thumbnailUrl);
          this.videoDataRetreived.setValue(true); // Ensures youtube data is retreived before user can proceed
          this.getYoutubeVideoDataSubscription.unsubscribe(); // Clear subscription no longer needed
          this.monitorYoutubeVideoUrlChange(); 
          this.proceedToNextStep();
        }
      })
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
    this.editTrainingSessionStepper.next()
  }

  ngOnDestroy(): void {

    if (this.getYoutubeVideoDataSubscription) {
      this.getYoutubeVideoDataSubscription.unsubscribe();
    }

    if (this.videoUrlSubscription) {
      this.videoUrlSubscription.unsubscribe();
    }

    if (this.existingTrainingSessionDataSubscription) {
      this.existingTrainingSessionDataSubscription.unsubscribe();
    }
    
  }

  // These getters are used for easy access in the HTML template
  get videoDataRetreived() { return this.youtubeVideoDataForm.get(YoutubeVideoDataKeys.YOUTUBE_VIDEO_DATA_RETREIVED) as FormControl<boolean>; }
  get videoUrl() { return this.youtubeVideoDataForm.get(YoutubeVideoDataKeys.VIDEO_URL) as FormControl<string>; }

}
