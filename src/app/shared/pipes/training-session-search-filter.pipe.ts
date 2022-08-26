import { Pipe, PipeTransform } from '@angular/core';
import { TrainingSession } from 'shared-models/train/training-session.model';

@Pipe({
  name: 'trainingSessionSearchFilter'
})
export class TrainingSessionSearchFilterPipe implements PipeTransform {

  /**
   * Pipe filters the list of elements based on the search text provided, including character matches and keyword matches
   *
   * @param trainingSessions array of trainingSessions
   * @param searchText search string
   * @returns list of elements filtered by search text or []
   */
   transform(trainingSessions: TrainingSession[] | null, searchText: string): TrainingSession[] {
    if (!trainingSessions) {
      return [];
    }
    if (!searchText) {
      return trainingSessions;
    }
    searchText = searchText.toLocaleLowerCase();

    return trainingSessions.filter(trainingSession => {
      const combinedVideoTitleChannelTitle = [trainingSession.videoData.title.toLocaleLowerCase(), trainingSession.videoData.channelTitle.toLocaleLowerCase()].join(' ');
      
      // Simple character match
      const isCharacterMatch = combinedVideoTitleChannelTitle.toLocaleLowerCase().includes(searchText);

      // This checks any combination of keywords against the reference keywords
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
