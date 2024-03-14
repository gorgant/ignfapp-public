import { AfterContentInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Store } from '@ngrx/store';
import { Observable, Subscription, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { SocialUrlPrefixes } from 'shared-models/meta/social-urls.model';
import { CanonicalTrainingSession, TrainingSessionKeys, TrainingSessionVisibilityCategoryDbOption, TrainingSessionVisibilityCategoryObject, TrainingSessionVisibilityTypeList } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { FetchYoutubeVideoData } from 'shared-models/youtube/fetch-youtube-video-data.model';
import { YoutubeVideoDataCompact, YoutubeVideoDataKeys } from 'shared-models/youtube/youtube-video-data.model';
import { HelperService } from 'src/app/core/services/helpers.service';
import { UiService } from 'src/app/core/services/ui.service';
import { TrainingSessionStoreActions, TrainingSessionStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { AsyncPipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-edit-training-session-step-one',
    templateUrl: './edit-training-session-step-one.component.html',
    styleUrls: ['./edit-training-session-step-one.component.scss'],
    standalone: true,
    imports: [ReactiveFormsModule, MatTooltipModule, MatRadioModule, MatFormFieldModule, MatInputModule, AsyncPipe]
})
export class EditTrainingSessionStepOneComponent implements OnInit, AfterContentInit, OnDestroy {

  @Input() editTrainingSessionStepper!: MatStepper;
  @Input() $localTrainingSession = signal(undefined as CanonicalTrainingSession | undefined);
  @Output() stepOneCompleted: EventEmitter<boolean> = new EventEmitter(); // This emits a value to the parent component which then proceeds to the next step

  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  INPUT_YOUTUBE_VIDEO_URL_HINT = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_HINT
  INPUT_YOUTUBE_VIDEO_URL_FIELD_VALUE = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_FIELD_VALUE;
  INPUT_YOUTUBE_VIDEO_URL_STEP_LABEL = GlobalFieldValues.INPUT_YOUTUBE_VIDEO_URL_TITLE;
  VISIBILITY_FIELD_TOOLTIP = GlobalFieldValues.VISIBILITY_TOOLTIP;
  VISIBILITY_FIELD_VALUE = GlobalFieldValues.WHO_CAN_SEE_THIS;

  userData$!: Observable<PublicUser>;

  private fetchYoutubeVideoDataProcessing$!: Observable<boolean>;
  private fetchYoutubeVideoDataSubscription!: Subscription;
  private fetchYoutubeVideoDataError$!: Observable<Error | null>;
  private $fetchYoutubeVideoDataSubmitted = signal(false);
  private youtubeVideoData$!: Observable<YoutubeVideoDataCompact>;
  private videoUrlSubscription!: Subscription;

  private $unfetchedUrlActive = signal(false);

  private existingTrainingSessionDataSubscription!: Subscription;

  readonly visibilityCategoryMasterList: TrainingSessionVisibilityCategoryObject[] = Object.values(TrainingSessionVisibilityTypeList);

  private fb = inject(FormBuilder);
  private store$ = inject(Store);
  private uiService = inject(UiService);
  private helperService = inject(HelperService);
  

  youtubeVideoDataForm = this.fb.group({
    [TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY]: [TrainingSessionVisibilityTypeList[TrainingSessionVisibilityCategoryDbOption.PRIVATE].dbValue as TrainingSessionVisibilityCategoryDbOption, [Validators.required]],
    [YoutubeVideoDataKeys.VIDEO_URL]: ['', [Validators.required, Validators.pattern(/^((https:\/\/www\.youtube\.com)|(https:\/\/youtu\.be))/)]],
  });

  constructor() { }

  ngOnInit(): void {
    this.monitorProcesses();
  }

  ngAfterContentInit(): void {
    this.checkForExistingData(); // Have to do this after contentInit to prevent a ExpressionChangedAfterItHasBeenCheckedError
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;
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

  // Note this signal is provided from the parent component
  private checkForExistingData() {
    const trainingSessionData = this.$localTrainingSession();
    console.log('Found this trainingSessionData in step one', trainingSessionData);
    if (trainingSessionData) {
      this.visibilityCategory.setValue(trainingSessionData[TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY]);
      this.visibilityCategory.disable();
      this.videoUrl.setValue(trainingSessionData.videoData.videoUrl);
      this.videoUrl.disable();
      this.stepOneCompleted.emit(true);
    }
  }

  onGetYoutubeVideoData() {
    
    const url = this.videoUrl.value as string;

    const videoId = this.helperService.extractYoutubeVideoIdFromUrl(url);

    if (!videoId) {
      this.uiService.showSnackBar('Invalid YouTube URL. Please try again.', 10000);
      return;
    }

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
          if (!this.$fetchYoutubeVideoDataSubmitted()) {
            const fetchYoutubeVideoData: FetchYoutubeVideoData = {
              videoId,
              visibilityCategory: this.visibilityCategory.value
            }
            this.store$.dispatch(TrainingSessionStoreActions.fetchYoutubeVideoDataRequested({fetchYoutubeVideoData}));
            this.$fetchYoutubeVideoDataSubmitted.set(true);
          }
          return this.youtubeVideoData$;
        }),
        filter(videoData => !!videoData),
        tap(videoData => {
          console.log('Video data retreival successful', videoData);
          this.fetchYoutubeVideoDataSubscription?.unsubscribe(); // Clear subscription no longer needed
          this.visibilityCategory.disable();
          this.monitorYoutubeVideoUrlChange(); // Prevents user from proceeding if url edits are made after previous query
          this.$unfetchedUrlActive.set(false);
          this.stepOneCompleted.emit(true); 
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
    this.stepOneCompleted.emit(false);
    this.fetchYoutubeVideoDataSubscription?.unsubscribe();
    this.youtubeVideoDataForm.reset(); // Prevents user from proceeding manually to next step by clicking in stepper
    this.visibilityCategory.enable();
    this.visibilityCategory.setValue(TrainingSessionVisibilityCategoryDbOption.PRIVATE);
    this.$fetchYoutubeVideoDataSubmitted.set(false);
    this.store$.dispatch(TrainingSessionStoreActions.purgeTrainingSessionErrors());
    this.store$.dispatch(TrainingSessionStoreActions.purgeYoutubeVideoData());
  }

  // Ensures new youtube data must be retreived if user goes back to edit the video url
  private monitorYoutubeVideoUrlChange() {
    this.videoUrlSubscription = this.videoUrl.statusChanges
      .pipe(
        tap(change => {
          if (!this.$unfetchedUrlActive()) {
            
            this.$unfetchedUrlActive.set(true); // This only gets disabled when a video has been successfully fetched
            this.resetComponentState();
          }
        })
      ).subscribe();
  }

  ngOnDestroy(): void {
    this.fetchYoutubeVideoDataSubscription?.unsubscribe();
    this.videoUrlSubscription?.unsubscribe();
    this.existingTrainingSessionDataSubscription?.unsubscribe();
  }

  // These getters are used for easy access in the HTML template
  // get videoDataRetreived() { return this.youtubeVideoDataForm.get(YoutubeVideoDataKeys.YOUTUBE_VIDEO_DATA_RETREIVED) as FormControl<boolean>; }
  get videoUrl() { return this.youtubeVideoDataForm.get(YoutubeVideoDataKeys.VIDEO_URL) as FormControl<string>; }
  get visibilityCategory() {return this.youtubeVideoDataForm.get(TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY) as FormControl<TrainingSessionVisibilityCategoryDbOption>;}

}
