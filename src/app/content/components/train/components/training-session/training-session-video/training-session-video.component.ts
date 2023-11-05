import { Component, Input, OnInit, ViewChild, inject, signal } from '@angular/core';
import { YouTubePlayer } from '@angular/youtube-player';
import { TrainingSession } from 'shared-models/train/training-session.model';
import { UiService } from 'src/app/core/services/ui.service';

@Component({
  selector: 'app-training-session-video',
  templateUrl: './training-session-video.component.html',
  styleUrls: ['./training-session-video.component.scss']
})
export class TrainingSessionVideoComponent implements OnInit {
  
  @Input() trainingSessionData!: TrainingSession;

  private apiLoaded = signal(false);
  
  @ViewChild('ytVideoPlayerApi') ytVideoPlayerApi!: YouTubePlayer; // Accessed by parent component
  videoPlayerWidth = signal(undefined as number | undefined);
  videoPlayerHeight = signal(undefined as number | undefined);
  videoPlayerOptions = signal({});

  private uiService = inject(UiService);

  constructor() { }

  ngOnInit(): void {
    this.initializeYoutubePlayer();
  }

  private initializeYoutubePlayer() {
    this.configurePlayerDimensions();
    this.configurePlayerOptions();

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
    this.videoPlayerWidth.set(screenWidth);
    this.videoPlayerHeight.set(screenHeight);
  }

  private configurePlayerOptions() {
    this.videoPlayerOptions.set({
      controls: 1, 
      modestbranding: 1, 
      rel: 0
    });
  }

}
