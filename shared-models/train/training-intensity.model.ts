export enum TrainingSessionIntensityDbOption {
  LOW_INTENSITY = 1,
  MODERATE_INTENSITY = 2,
  HIGH_INTENSITY = 3,
}

export enum TrainingSessionIntensityUiOption {
  LOW_INTENSITY = 'Low Intensity',
  MODERATE_INTENSITY = 'Moderate Intensity',
  HIGH_INTENSITY = 'High Intensity',
}

export interface TrainingSessionIntensityObject {
  uiValue: TrainingSessionIntensityUiOption,
  dbValue: TrainingSessionIntensityDbOption
}

export interface TrainingSessionIntensityListModel {
  [key: string]: TrainingSessionIntensityObject
}

export const TrainingSessionIntensityList: TrainingSessionIntensityListModel = {
  [TrainingSessionIntensityDbOption.LOW_INTENSITY]: {
    uiValue: TrainingSessionIntensityUiOption.LOW_INTENSITY,
    dbValue: TrainingSessionIntensityDbOption.LOW_INTENSITY
  },
  [TrainingSessionIntensityDbOption.MODERATE_INTENSITY]: {
    uiValue: TrainingSessionIntensityUiOption.MODERATE_INTENSITY,
    dbValue: TrainingSessionIntensityDbOption.MODERATE_INTENSITY
  },
  [TrainingSessionIntensityDbOption.HIGH_INTENSITY]: {
    uiValue: TrainingSessionIntensityUiOption.HIGH_INTENSITY,
    dbValue: TrainingSessionIntensityDbOption.HIGH_INTENSITY
  },
}
