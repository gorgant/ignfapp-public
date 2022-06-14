import { Injectable } from '@angular/core';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { Observable, throwError } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';
import { YoutubeVideoData } from 'shared-models/youtube/youtube-video-data.model';
import { UiService } from './ui.service';

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {

  constructor(
    private fns: Functions,
    private uiService: UiService
  ) { }

  fetchYoutubeVideoData(videoId: string): Observable<YoutubeVideoData> {
    const fetchYoutubeDataHttpCall: (videoId: string) => 
      Observable<YoutubeVideoData> = httpsCallableData(this.fns, PublicFunctionNames.ON_CALL_FETCH_YOUTUBE_VIDEO_DATA);

    return fetchYoutubeDataHttpCall(videoId)
      .pipe(
        take(1),
        map( videoData => {
          console.log('Video data retreived', videoData)
          return videoData;
        }),
        catchError(error => {
          console.log('Error fetching youtube video data', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );
  }
}
