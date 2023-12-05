import { Pipe, PipeTransform } from '@angular/core';
import { TrainingSessionComplexityDbOption, TrainingSessionComplexityList, TrainingSessionComplexityUiOption } from 'shared-models/train/training-complexity.model';

@Pipe({
  name: 'complexityDbToUi'
})
export class ComplexityDbToUiPipe implements PipeTransform {

  // Round input to the nearest integer and match to the UI value
  transform(activityCategoryDbOption: TrainingSessionComplexityDbOption): TrainingSessionComplexityUiOption {
    const roundedValue = Math.round(activityCategoryDbOption) as TrainingSessionComplexityDbOption;
    const trainingSessionComplexityMasterList = Object.values(TrainingSessionComplexityList);  
    // Query master list for matching object
    return trainingSessionComplexityMasterList.find(activityCategoryObject => activityCategoryObject.dbValue === roundedValue)?.uiValue as TrainingSessionComplexityUiOption;
  }

}
