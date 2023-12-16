import { Component, Input, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { YouTubePlayer, YouTubePlayerModule } from '@angular/youtube-player';
import { PersonalSessionFragment } from 'shared-models/train/personal-session-fragment.model';
import { PlanSessionFragment } from 'shared-models/train/plan-session-fragment.model';
import { CanonicalTrainingSession, TrainingSessionKeys } from 'shared-models/train/training-session.model';
import { DeviceOSType, IOSDeviceTypes } from 'shared-models/user-interface/device-os-types.model';
import { YoutubeVideoDataKeys } from 'shared-models/youtube/youtube-video-data.model';
import { HelperService } from 'src/app/core/services/helpers.service';
import { UiService } from 'src/app/core/services/ui.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-training-session-video',
    templateUrl: './training-session-video.component.html',
    styleUrls: ['./training-session-video.component.scss'],
    standalone: true,
    imports: [YouTubePlayerModule, MatButtonModule]
})
export class TrainingSessionVideoComponent implements OnInit {
  
  @Input() trainingSessionData!: CanonicalTrainingSession | PlanSessionFragment | PersonalSessionFragment;

  private apiLoaded = signal(false);
  
  @ViewChild('ytVideoPlayerApi') ytVideoPlayerApi!: YouTubePlayer; // Accessed by parent component
  $videoPlayerWidth = signal(undefined as number | undefined);
  $videoPlayerHeight = signal(undefined as number | undefined);
  $videoPlayerOptions = signal({});

  private uiService = inject(UiService);

  $screenIsMobile = computed(() => {
    return this.uiService.$screenIsMobile();
  });
  $youtubeDeeplinkUri = signal(undefined as string | undefined);
  $deviceOS = computed(() => {
    return this.uiService.$deviceOS();
  });

  constructor() { }

  ngOnInit(): void {
    this.initializeYoutubePlayer();
  }

  private initializeYoutubePlayer() {
    this.configurePlayerDimensions();
    this.configurePlayerOptions();
    this.configureYoutubeAppDeeplink();

    if (!this.apiLoaded()) {
      // Courtesy of https://github.com/angular/components/tree/main/src/youtube-player#readme
      // This code loads the IFrame Player API code asynchronously, according to the instructions at
      // https://developers.google.com/youtube/iframe_api_reference#Getting_Started
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      this.apiLoaded.set(true);
    }
  }

  private configurePlayerDimensions() {
    let screenWidth = this.uiService.screenWidth;
    console.log('Configuring player with this screen width', screenWidth);
    if (screenWidth > 800) {
      screenWidth = 800;
    }
    let screenHeight = Math.round((screenWidth*360)/640);
    this.$videoPlayerWidth.set(screenWidth);
    this.$videoPlayerHeight.set(screenHeight);
  }

  private configurePlayerOptions() {
    this.$videoPlayerOptions.set({
      controls: 1, 
      modestbranding: 1, 
      rel: 0
    });
  }

  private configureYoutubeAppDeeplink() {

    let deepLinkUri: string;

    const androidYoutubeDeeplinkUriBase = 'vnd.youtube://';
    const iOSYoutubeDeeplinkUriBase = 'youtube://';

    const currentDeviceOS = this.uiService.$deviceOS();
    
    if (this.isIOSDeviceType(currentDeviceOS)) {
      deepLinkUri = iOSYoutubeDeeplinkUriBase;  
    } else {
      deepLinkUri = androidYoutubeDeeplinkUriBase;
    }

    const videoId = this.trainingSessionData[TrainingSessionKeys.VIDEO_DATA][YoutubeVideoDataKeys.ID];

    const fullUri = deepLinkUri + videoId;
    this.$youtubeDeeplinkUri.set(fullUri);
  }

  private isIOSDeviceType(deviceType: string): deviceType is IOSDeviceTypes {
    return deviceType === 'MAC' || deviceType === 'IOS';
  }

  

}
