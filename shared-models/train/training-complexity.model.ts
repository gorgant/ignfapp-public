export enum TrainingSessionComplexityDbOption {
  LOW_COMPLEXITY = 1,
  MODERATE_COMPLEXITY = 2,
  HIGH_COMPLEXITY = 3,
}

export enum TrainingSessionComplexityUiOption {
  LOW_COMPLEXITY = 'Low Complexity',
  MODERATE_COMPLEXITY = 'Moderate Complexity',
  HIGH_COMPLEXITY = 'High Complexity',
}

export interface TrainingSessionComplexityObject {
  uiValue: TrainingSessionComplexityUiOption,
  dbValue: TrainingSessionComplexityDbOption
}

export interface TrainingSessionComplexityListModel {
  [key: string]: TrainingSessionComplexityObject
}

export const TrainingSessionComplexityList: TrainingSessionComplexityListModel = {
  [TrainingSessionComplexityDbOption.LOW_COMPLEXITY]: {
    uiValue: TrainingSessionComplexityUiOption.LOW_COMPLEXITY,
    dbValue: TrainingSessionComplexityDbOption.LOW_COMPLEXITY
  },
  [TrainingSessionComplexityDbOption.MODERATE_COMPLEXITY]: {
    uiValue: TrainingSessionComplexityUiOption.MODERATE_COMPLEXITY,
    dbValue: TrainingSessionComplexityDbOption.MODERATE_COMPLEXITY
  },
  [TrainingSessionComplexityDbOption.HIGH_COMPLEXITY]: {
    uiValue: TrainingSessionComplexityUiOption.HIGH_COMPLEXITY,
    dbValue: TrainingSessionComplexityDbOption.HIGH_COMPLEXITY
  },
}
