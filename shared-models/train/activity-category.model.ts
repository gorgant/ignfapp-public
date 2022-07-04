// Db friendly values
export enum TrainingSessionActivityCategoryDbOption {
  AGILITY = 'agility',
  CARDIO = 'cardio',
  DANCE = 'dance',
  ENDURANCE = 'endurance',
  FLEXIBILITY = 'flexibility',
  HIIT = 'hitt',
  LOW_IMPACT = 'lowImpact',
  MARTIAL_ARTS = 'martialArts',
  MEDITATION = 'meditation',
  MOBILITY = 'mobility',
  POSTURE = 'posture',
  POWER = 'power',
  STABILITY = 'stability',
  STANDING_NO_FLOOR = 'standingNoFloor',
  STRENGTH = 'strength',
  YOGA = 'yoga'
};

// User readable version of db values
export enum TrainingSessionActivityCategoryUiOption {
  AGILITY = 'Agility',
  CARDIO = 'Cardio',
  DANCE = 'Dance',
  ENDURANCE = 'Endurance',
  FLEXIBILITY = 'Flexibility',
  HIIT = 'HIIT',
  LOW_IMPACT = 'Low Impact',
  MARTIAL_ARTS = 'Martial Arts',
  MEDITATION = 'Meditation',
  MOBILITY = 'Mobility',
  POSTURE = 'Posture',
  POWER = 'Power',
  STABILITY = 'Stability',
  STANDING_NO_FLOOR = 'Standing - No Floor',
  STRENGTH = 'Strength',
  YOGA = 'Yoga'
};

export interface TrainingSessionActivityCategoryObject {
  uiValue: TrainingSessionActivityCategoryUiOption,
  dbValue: TrainingSessionActivityCategoryDbOption
}

export interface TrainingSessionActivityCategoryListModel {
  [key: string]: TrainingSessionActivityCategoryObject
}

export const TrainingSessionActivityCategoryList: TrainingSessionActivityCategoryListModel = {
  [TrainingSessionActivityCategoryDbOption.AGILITY]: {
    uiValue: TrainingSessionActivityCategoryUiOption.AGILITY,
    dbValue: TrainingSessionActivityCategoryDbOption.AGILITY
  },
  [TrainingSessionActivityCategoryDbOption.CARDIO]: {
    uiValue: TrainingSessionActivityCategoryUiOption.CARDIO,
    dbValue: TrainingSessionActivityCategoryDbOption.CARDIO
  },
  [TrainingSessionActivityCategoryDbOption.DANCE]: {
    uiValue: TrainingSessionActivityCategoryUiOption.DANCE,
    dbValue: TrainingSessionActivityCategoryDbOption.DANCE
  },
  [TrainingSessionActivityCategoryDbOption.ENDURANCE]: {
    uiValue: TrainingSessionActivityCategoryUiOption.ENDURANCE,
    dbValue: TrainingSessionActivityCategoryDbOption.ENDURANCE
  },
  [TrainingSessionActivityCategoryDbOption.FLEXIBILITY]: {
    uiValue: TrainingSessionActivityCategoryUiOption.FLEXIBILITY,
    dbValue: TrainingSessionActivityCategoryDbOption.FLEXIBILITY
  },
  [TrainingSessionActivityCategoryDbOption.HIIT]: {
    uiValue: TrainingSessionActivityCategoryUiOption.HIIT,
    dbValue: TrainingSessionActivityCategoryDbOption.HIIT
  },
  [TrainingSessionActivityCategoryDbOption.LOW_IMPACT]: {
    uiValue: TrainingSessionActivityCategoryUiOption.LOW_IMPACT,
    dbValue: TrainingSessionActivityCategoryDbOption.LOW_IMPACT
  },
  [TrainingSessionActivityCategoryDbOption.MARTIAL_ARTS]: {
    uiValue: TrainingSessionActivityCategoryUiOption.MARTIAL_ARTS,
    dbValue: TrainingSessionActivityCategoryDbOption.MARTIAL_ARTS
  },
  [TrainingSessionActivityCategoryDbOption.MEDITATION]: {
    uiValue: TrainingSessionActivityCategoryUiOption.MEDITATION,
    dbValue: TrainingSessionActivityCategoryDbOption.MEDITATION
  },
  [TrainingSessionActivityCategoryDbOption.MOBILITY]: {
    uiValue: TrainingSessionActivityCategoryUiOption.MOBILITY,
    dbValue: TrainingSessionActivityCategoryDbOption.MOBILITY
  },
  [TrainingSessionActivityCategoryDbOption.POSTURE]: {
    uiValue: TrainingSessionActivityCategoryUiOption.POSTURE,
    dbValue: TrainingSessionActivityCategoryDbOption.POSTURE
  },
  [TrainingSessionActivityCategoryDbOption.POWER]: {
    uiValue: TrainingSessionActivityCategoryUiOption.POWER,
    dbValue: TrainingSessionActivityCategoryDbOption.POWER
  },
  [TrainingSessionActivityCategoryDbOption.STABILITY]: {
    uiValue: TrainingSessionActivityCategoryUiOption.STABILITY,
    dbValue: TrainingSessionActivityCategoryDbOption.STABILITY
  },
  [TrainingSessionActivityCategoryDbOption.STANDING_NO_FLOOR]: {
    uiValue: TrainingSessionActivityCategoryUiOption.STANDING_NO_FLOOR,
    dbValue: TrainingSessionActivityCategoryDbOption.STANDING_NO_FLOOR
  },
  [TrainingSessionActivityCategoryDbOption.STRENGTH]: {
    uiValue: TrainingSessionActivityCategoryUiOption.STRENGTH,
    dbValue: TrainingSessionActivityCategoryDbOption.STRENGTH
  },
  [TrainingSessionActivityCategoryDbOption.YOGA]: {
    uiValue: TrainingSessionActivityCategoryUiOption.YOGA,
    dbValue: TrainingSessionActivityCategoryDbOption.YOGA
  },
}