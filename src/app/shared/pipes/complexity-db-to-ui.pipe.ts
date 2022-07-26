import { Pipe, PipeTransform } from '@angular/core';
import { TrainingSessionComplexityDbOption, TrainingSessionComplexityList, TrainingSessionComplexityUiOption } from 'shared-models/train/training-complexity.model';

@Pipe({
  name: 'complexityDbToUi'
})
export class ComplexityDbToUiPipe implements PipeTransform {

  transform(activityCategoryDbOption: TrainingSessionComplexityDbOption): TrainingSessionComplexityUiOption {
    const trainingSessionComplexityMasterList = Object.values(TrainingSessionComplexityList);  
    // Query master list for matching object
    return trainingSessionComplexityMasterList.find(activityCategoryObject => activityCategoryObject.dbValue === activityCategoryDbOption)?.uiValue as TrainingSessionComplexityUiOption;
  }

}
