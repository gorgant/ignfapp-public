import { Pipe, PipeTransform } from '@angular/core';
import { CanonicalTrainingSession, TrainingSessionKeys } from 'shared-models/train/training-session.model';

@Pipe({
    name: 'trainingSessionSearchFilter',
    standalone: true
})
export class TrainingSessionSearchFilterPipe implements PipeTransform {

  /**
   * Pipe filters the list of elements based on the search text provided, including character matches and keyword matches
   *
   * @param trainingSessions array of trainingSessions
   * @param searchText search string
   * @returns list of elements filtered by search text or []
   */
   transform(trainingSessions: CanonicalTrainingSession[] | null, searchText: string): CanonicalTrainingSession[] {
    if (!trainingSessions) {
      return [];
    }
    if (!searchText) {
      return trainingSessions;
    }
    searchText = searchText.toLocaleLowerCase();

    return trainingSessions.filter(trainingSession => {
      
      const combinedVideoTitleChannelTitle = [
        trainingSession.videoData.title.toLocaleLowerCase(),
        trainingSession.videoData.channelTitle.toLocaleLowerCase(),
      ].join(' ');

      const combinedChannelDataAndKeywords = combinedVideoTitleChannelTitle + ' ' + trainingSession[TrainingSessionKeys.KEYWORD_LIST]?.join(' ');
      
      // Simple character match
      const isCharacterMatch = combinedChannelDataAndKeywords.toLocaleLowerCase().includes(searchText);

      // This checks any combination of keywords against the reference keywords
      let isKeywordMatch = false;
      let keywords: string[] = [];

      if (searchText.includes(' ')) {
        keywords = searchText.toLocaleLowerCase().split(' '); // split search text into individual keywords
        
        // match every keyword against the video and channel titles, if all match, return 'true'
        isKeywordMatch = keywords.every(val => { 
          return combinedChannelDataAndKeywords.includes(val);
        });
      }

      return isCharacterMatch || isKeywordMatch;
    });
  }

}
