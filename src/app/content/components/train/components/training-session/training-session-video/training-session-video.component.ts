import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { YouTubePlayer } from '@angular/youtube-player';
import { TrainingSession } from 'shared-models/train/training-session.model';
import { UiService } from 'src/app/core/services/ui.service';

@Component({
  selector: 'app-training-session-video',
  templateUrl: './training-session-video.component.html',
  styleUrls: ['./training-session-video.component.scss']
})
export class TrainingSessionVideoComponent implements OnInit {

  private apiLoaded = false;
  @ViewChild('ytVideoPlayerApi') ytVideoPlayerApi!: YouTubePlayer;

  videoPlayerWidth!: number;
  videoPlayerHeight!: number;
  videoPlayerOptions!: {};

  @Input() trainingSessionData!: TrainingSession;

  constructor(
    private uiService: UiService
  ) { }

  ngOnInit(): void {
    this.initializeYoutubePlayer();
  }

  private initializeYoutubePlayer() {
    this.configurePlayerDimensions();
    this.configurePlayerOptions();

    if (!this.apiLoaded) {
      // Courtesy of https://github.com/angular/components/tree/main/src/youtube-player#readme
      // This code loads the IFrame Player API code asynchronously, according to the instructions at
      // https://developers.google.com/youtube/iframe_api_reference#Getting_Started
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      this.apiLoaded = true;
    }
  }

  private configurePlayerDimensions() {
    let screenWidth = this.uiService.screenWidth;
    console.log('Configuring player with this screen width', screenWidth);
    if (screenWidth > 800) {
      screenWidth = 800;
    }
    let screenHeight = Math.round((screenWidth*360)/640);
    this.videoPlayerWidth = screenWidth;
    this.videoPlayerHeight = screenHeight;
  }

  private configurePlayerOptions() {
    this.videoPlayerOptions = {
      controls: 1, 
      modestbranding: 1, 
      rel: 0
    }
  }

}
