export enum TrainingSessionMuscleGroupDbOption {
  CORE = 'core',
  FULL_BODY = 'fullBody',
  LOWER_BODY = 'lowerBody',
  UPPER_BODY = 'upperBody',
}

export enum TrainingSessionMuscleGroupUiOption {
  CORE = 'Core',
  FULL_BODY = 'Full Body',
  LOWER_BODY = 'Lower Body',
  UPPER_BODY = 'Upper Body',
}

export interface TrainingSessionMuscleGroupObject {
  uiValue: TrainingSessionMuscleGroupUiOption,
  dbValue: TrainingSessionMuscleGroupDbOption
}

export interface TrainingSessionMuscleGroupListModel {
  [key: string]: TrainingSessionMuscleGroupObject
}

export const TrainingSessionMuscleGroupList: TrainingSessionMuscleGroupListModel = {
  [TrainingSessionMuscleGroupDbOption.CORE]: {
    uiValue: TrainingSessionMuscleGroupUiOption.CORE,
    dbValue: TrainingSessionMuscleGroupDbOption.CORE
  },
  [TrainingSessionMuscleGroupDbOption.FULL_BODY]: {
    uiValue: TrainingSessionMuscleGroupUiOption.FULL_BODY,
    dbValue: TrainingSessionMuscleGroupDbOption.FULL_BODY
  },
  [TrainingSessionMuscleGroupDbOption.LOWER_BODY]: {
    uiValue: TrainingSessionMuscleGroupUiOption.LOWER_BODY,
    dbValue: TrainingSessionMuscleGroupDbOption.LOWER_BODY
  },

  [TrainingSessionMuscleGroupDbOption.UPPER_BODY]: {
    uiValue: TrainingSessionMuscleGroupUiOption.UPPER_BODY,
    dbValue: TrainingSessionMuscleGroupDbOption.UPPER_BODY
  },
}
