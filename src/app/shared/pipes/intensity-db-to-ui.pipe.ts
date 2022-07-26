import { Pipe, PipeTransform } from '@angular/core';
import { TrainingSessionIntensityDbOption, TrainingSessionIntensityUiOption, TrainingSessionIntensityList } from 'shared-models/train/training-intensity.model';

@Pipe({
  name: 'intensityDbToUi'
})
export class IntensityDbToUiPipe implements PipeTransform {

  transform(activityCategoryDbOption: TrainingSessionIntensityDbOption): TrainingSessionIntensityUiOption {
    const trainingSessionIntensityMasterList = Object.values(TrainingSessionIntensityList);  
    // Query master list for matching object
    return trainingSessionIntensityMasterList.find(activityCategoryObject => activityCategoryObject.dbValue === activityCategoryDbOption)?.uiValue as TrainingSessionIntensityUiOption;
  }

}
