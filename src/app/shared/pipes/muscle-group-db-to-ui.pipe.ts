import { Pipe, PipeTransform } from '@angular/core';
import { } from 'shared-models/train/activity-category.model';
import { TrainingSessionMuscleGroupDbOption, TrainingSessionMuscleGroupUiOption, TrainingSessionMuscleGroupList } from 'shared-models/train/muscle-group.model';

@Pipe({
  name: 'muscleGroupDbToUi'
})
export class MuscleGroupDbToUiPipe implements PipeTransform {

  transform(activityCategoryDbOption: TrainingSessionMuscleGroupDbOption): TrainingSessionMuscleGroupUiOption {
    const trainingSessionMuscleGroupMasterList = Object.values(TrainingSessionMuscleGroupList);  
    // Query master list for matching activityCategory object
    return trainingSessionMuscleGroupMasterList.find(activityCategoryObject => activityCategoryObject.dbValue === activityCategoryDbOption)?.uiValue as TrainingSessionMuscleGroupUiOption;
  }

}
