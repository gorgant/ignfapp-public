import { Pipe, PipeTransform } from '@angular/core';
import { TrainingSessionActivityCategoryDbOption, TrainingSessionActivityCategoryList, TrainingSessionActivityCategoryUiOption } from 'shared-models/train/activity-category.model';

@Pipe({
    name: 'activityCategoryDbToUi',
    standalone: true
})
export class ActivityCategoryDbToUiPipe implements PipeTransform {

  transform(activityCategoryDbOption: TrainingSessionActivityCategoryDbOption): TrainingSessionActivityCategoryUiOption {
    const trainingSessionActivityCategoryMasterList = Object.values(TrainingSessionActivityCategoryList);  
    // Query master list for matching activityCategory object
    return trainingSessionActivityCategoryMasterList.find(activityCategoryObject => activityCategoryObject.dbValue === activityCategoryDbOption)?.uiValue as TrainingSessionActivityCategoryUiOption;
  }

}
