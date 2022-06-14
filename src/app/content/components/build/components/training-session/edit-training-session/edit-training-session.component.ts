import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { withLatestFrom } from 'rxjs/operators';
import { Subscription } from 'rxjs/internal/Subscription';
import { SessionVideoPlatforms, TrainingSession, TrainingSessionKeys } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { RootStoreState, UserStoreSelectors } from 'src/app/root-store';
import { Observable } from 'rxjs';
import { YoutubeVideoData } from 'shared-models/youtube/youtube-video-data.model';
import { YoutubeService } from 'src/app/core/services/train.service';

@Component({
  selector: 'app-edit-training-session',
  templateUrl: './edit-training-session.component.html',
  styleUrls: ['./edit-training-session.component.scss']
})
export class EditTrainingSessionComponent implements OnInit, OnDestroy {

  trainingSessionForm!: UntypedFormGroup;
  FORM_VALIDATION_MESSAGES = 'tbd';

  videoData!: YoutubeVideoData;

  fetchUserSubscription!: Subscription;
  userData$!: Observable<PublicUser>;

  constructor(
    private fb: UntypedFormBuilder,
    private store$: Store<RootStoreState.AppState>,
    private router: Router,
    private route: ActivatedRoute,
    private ytService: YoutubeService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  monitorProcesses() {
    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectUserData)) as Observable<PublicUser>;
  }

  // TODO: the url field should prepopulate the appropriate url based on the video platform
  // TODO: youtube video data (title, duration, channelUrl) is queried when url is plugged in and the user clicks "fetch data"
  // TODO: form can't be sumbitted until data is fetched

  private initForm(): void {
    this.trainingSessionForm = this.fb.group({
      [TrainingSessionKeys.COMPLEXITY_DEFAULT]: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      [TrainingSessionKeys.EQUIPMENT]: ['', [Validators.required]],
      [TrainingSessionKeys.FOCUS_PRIMARY]: ['', [Validators.required]],
      [TrainingSessionKeys.FOCUS_SECONDARY]: [[], []],
      [TrainingSessionKeys.INTENSITY_DEFAULT]: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      [TrainingSessionKeys.VIDEO_PLATFORM]: [SessionVideoPlatforms.YOUTUBE, [Validators.required]],
      [TrainingSessionKeys.VIDEO_URL]: ['', [Validators.required, Validators.pattern(/^\S*(?:https\:\/\/youtu\.be)\S*$/)]],
    });
  }

  onGetYoutubeVideoData() {
    // https://developers.google.com/youtube/v3/docs/videos/list
    // TODO: implement a cloud function (via store$) to fetch video data from youtube
    this.ytService.fetchYoutubeVideoData('I93PGpzmzSM')
      .subscribe(vidData => {
        console.log('Video data in component', vidData.items[0].snippet.title);
      })
  }

  onSubmit(): void {

    this.fetchUserSubscription = this.userData$
      .subscribe(userData => {

        // const sessionData: TrainingSession = {
        //   creatorId: userData.id,
        //   complexityAverage: this.complexityDefault.value, // TODO: If edit (vs new), check if value already exists so that it doesn't get overwritten
        //   complexityDefault: this.complexityDefault.value,
        // }


      })

  }

  ngOnDestroy(): void {
    
    if (this.fetchUserSubscription) {
      this.fetchUserSubscription.unsubscribe();
    }
    
  }

  // These getters are used for easy access in the HTML template
  get complexityDefault() { return this.trainingSessionForm.get(TrainingSessionKeys.COMPLEXITY_DEFAULT) as AbstractControl; }
  get equipment() { return this.trainingSessionForm.get(TrainingSessionKeys.EQUIPMENT) as AbstractControl; }
  get duration() { return this.trainingSessionForm.get(TrainingSessionKeys.DURATION) as AbstractControl; }
  get focusPrimary() { return this.trainingSessionForm.get(TrainingSessionKeys.FOCUS_PRIMARY) as AbstractControl; }
  get focusSecondary() { return this.trainingSessionForm.get(TrainingSessionKeys.FOCUS_SECONDARY) as AbstractControl; }
  get intensityDefault() { return this.trainingSessionForm.get(TrainingSessionKeys.INTENSITY_DEFAULT) as AbstractControl; }
  get videoPlatform() { return this.trainingSessionForm.get(TrainingSessionKeys.VIDEO_PLATFORM) as AbstractControl; }
  get videoUrl() { return this.trainingSessionForm.get(TrainingSessionKeys.VIDEO_URL) as AbstractControl; }
  get channelUrl() { return this.trainingSessionForm.get(TrainingSessionKeys.CHANNEL_URL) as AbstractControl; }

}
