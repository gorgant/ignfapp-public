import { Pipe, PipeTransform } from '@angular/core';
import { TrainingSessionIntensityDbOption, TrainingSessionIntensityUiOption, TrainingSessionIntensityList } from 'shared-models/train/training-intensity.model';

@Pipe({
    name: 'intensityDbToUi',
    standalone: true
})
export class IntensityDbToUiPipe implements PipeTransform {

  // Round input to the nearest integer and match to the UI value
  transform(activityCategoryDbOption: TrainingSessionIntensityDbOption): TrainingSessionIntensityUiOption {
    const roundedValue = Math.round(activityCategoryDbOption) as TrainingSessionIntensityDbOption;
    const trainingSessionIntensityMasterList = Object.values(TrainingSessionIntensityList);  
    // Query master list for matching object
    return trainingSessionIntensityMasterList.find(activityCategoryObject => activityCategoryObject.dbValue === roundedValue)?.uiValue as TrainingSessionIntensityUiOption;
  }

}
