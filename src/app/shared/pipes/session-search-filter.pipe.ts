import { Pipe, PipeTransform } from '@angular/core';
import { TrainingSession } from 'shared-models/train/training-session.model';

@Pipe({
  name: 'sessionSearchFilter'
})
export class SessionSearchFilterPipe implements PipeTransform {

  /**
   * Pipe filters the list of elements based on the search text provided, including character matches and keyword matches
   *
   * @param sessions array of trainingSessions
   * @param searchText search string
   * @returns list of elements filtered by search text or []
   */
   transform(sessions: TrainingSession[] | null, searchText: string): TrainingSession[] {
    if (!sessions) {
      return [];
    }
    if (!searchText) {
      return sessions;
    }
    searchText = searchText.toLocaleLowerCase();

    return sessions.filter(session => {
      const combinedVideoTitleChannelTitle = [session.videoData.title.toLocaleLowerCase(), session.videoData.channelTitle.toLocaleLowerCase()].join(' ');
      
      // Simple character match
      const isCharacterMatch = combinedVideoTitleChannelTitle.toLocaleLowerCase().includes(searchText);

      // This checks any combination of keywords against the video and channel title keywords
      let isKeywordMatch = false;
      let keywords: string[] = [];

      if (searchText.includes(' ')) {
        keywords = searchText.toLocaleLowerCase().split(' '); // split search text into individual keywords
        
        // match every keyword against the video and channel titles, if all match, return 'true'
        isKeywordMatch = keywords.every(val => { 
          return combinedVideoTitleChannelTitle.includes(val);
        });
      }

      return isCharacterMatch || isKeywordMatch;
    });
  }

}
