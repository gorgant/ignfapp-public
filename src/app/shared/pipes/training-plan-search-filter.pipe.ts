import { Pipe, PipeTransform } from '@angular/core';
import { TrainingPlan } from 'shared-models/train/training-plan.model';

@Pipe({
    name: 'trainingPlanSearchFilter',
    standalone: true
})
export class TrainingPlanSearchFilterPipe implements PipeTransform {

  /**
   * Pipe filters the list of elements based on the search text provided, including character matches and keyword matches
   *
   * @param trainingPlans array of trainingPlans
   * @param searchText search string
   * @returns list of elements filtered by search text or []
   */
   transform(trainingPlans: TrainingPlan[] | null, searchText: string): TrainingPlan[] {
    if (!trainingPlans) {
      return [];
    }
    if (!searchText) {
      return trainingPlans;
    }
    searchText = searchText.toLocaleLowerCase();

    return trainingPlans.filter(trainingPlan => {

      // Simple character match
      const isCharacterMatch = trainingPlan.title.toLocaleLowerCase().includes(searchText);

      // This checks any combination of keywords against the reference keywords
      let isKeywordMatch = false;
      let keywords: string[] = [];

      if (searchText.includes(' ')) {
        keywords = searchText.toLocaleLowerCase().split(' '); // split search text into individual keywords
        
        // match every keyword against the reference keywords, if all match, return 'true'
        isKeywordMatch = keywords.every(val => { 
          return trainingPlan.title.includes(val);
        });
      }

      return isCharacterMatch || isKeywordMatch;
    });
  }

}
