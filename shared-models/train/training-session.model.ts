import { FormControl } from "@angular/forms"
import { YoutubeVideoDataCompact } from "../youtube/youtube-video-data.model"

export interface TrainingSession extends TrainingSessionNoId {
  id: string;
}

export interface TrainingSessionNoId {
  complexityAverage: number, // the average value of submitted ratings
  complexityRatingCount: number // the number of ratings submitted
  [TrainingSessionKeys.COMPLEXITY_DEFAULT]: number, // the starting value set by the creator
  creatorId: string,
  [TrainingSessionKeys.EQUIPMENT]: boolean,
  [TrainingSessionKeys.FOCUS_LIST]: TrainingSessionFocusDbOption[],
  intensityAverage: number, // the average value of submitted ratings
  [TrainingSessionKeys.INTENSITY_DEFAULT]: number, // the starting value set by the creator
  intensityRatingCount: number, // the number of ratings submitted 
  [TrainingSessionKeys.VIDEO_PLATFORM]: TrainingSessionVideoPlatform,
  videoData: YoutubeVideoDataCompact
}

export interface TrainingSessionForm {
  [TrainingSessionKeys.COMPLEXITY_DEFAULT]: FormControl<number | null>, // the starting value set by the creator
  [TrainingSessionKeys.EQUIPMENT]: FormControl<boolean | null>,
  [TrainingSessionKeys.FOCUS_LIST]: FormControl<TrainingSessionFocusDbOption[] | null>,
  [TrainingSessionKeys.INTENSITY_DEFAULT]: FormControl<number | null>, // the starting value set by the creator
  [TrainingSessionKeys.VIDEO_PLATFORM]: FormControl<TrainingSessionVideoPlatform | null>,
}

export const TrainingSessionFormVars = {
  complexityMin: 0,
  complexityMax: 3,
  intensityMin: 0,
  intensityMax: 3
}

export enum TrainingSessionKeys {
  COMPLEXITY_DEFAULT = 'complexityDefault',
  EQUIPMENT = 'equipment',
  FOCUS_LIST = 'focusList',
  INTENSITY_DEFAULT = 'intensityDefault',
  VIDEO_PLATFORM = 'videoPlatform',
};

export enum TrainingSessionVideoPlatform {
  YOUTUBE = 'youtube'
}

// Db friendly values
export enum TrainingSessionFocusDbOption {
  AGILITY = 'agility',
  CARDIO = 'cardio',
  CORE = 'core',
  DANCE = 'dance',
  ENDURANCE = 'endurance',
  FLEXIBILITY = 'flexibility',
  HIIT = 'hitt',
  LOW_IMPACT = 'low-impact',
  MARTIAL_ARTS = 'martial-arts',
  MEDITATION = 'meditation',
  POSTURE = 'posture',
  STABILITY = 'stability',
  STANDING_NO_FLOOR = 'standing-no-floor',
  STRENGTH = 'strength',
};

// User readable version of db values
export enum TrainingSessionFocusUiOption {
  AGILITY = 'Agility',
  CARDIO = 'Cardio',
  CORE = 'Core',
  DANCE = 'Dance',
  ENDURANCE = 'Endurance',
  FLEXIBILITY = 'Flexibility',
  HIIT = 'HIIT',
  LOW_IMPACT = 'Low Impact',
  MARTIAL_ARTS = 'Martial Arts',
  MEDITATION = 'Meditation',
  POSTURE = 'Posture',
  STABILITY = 'Stability',
  STANDING_NO_FLOOR = 'Standing - No Floor',
  STRENGTH = 'Strength',
};

export interface TrainingSessionFocusObject {
  uiValue: TrainingSessionFocusUiOption,
  dbValue: TrainingSessionFocusDbOption
}

export interface TrainingSessionFocusListModel {
  [key: string]: TrainingSessionFocusObject
}

export const TrainingSessionFocusList: TrainingSessionFocusListModel = {
  [TrainingSessionFocusDbOption.AGILITY]: {
    uiValue: TrainingSessionFocusUiOption.AGILITY,
    dbValue: TrainingSessionFocusDbOption.AGILITY
  },
  [TrainingSessionFocusDbOption.CARDIO]: {
    uiValue: TrainingSessionFocusUiOption.CARDIO,
    dbValue: TrainingSessionFocusDbOption.CARDIO
  },
  [TrainingSessionFocusDbOption.CORE]: {
    uiValue: TrainingSessionFocusUiOption.CORE,
    dbValue: TrainingSessionFocusDbOption.CORE
  },
  [TrainingSessionFocusDbOption.DANCE]: {
    uiValue: TrainingSessionFocusUiOption.DANCE,
    dbValue: TrainingSessionFocusDbOption.DANCE
  },
  [TrainingSessionFocusDbOption.ENDURANCE]: {
    uiValue: TrainingSessionFocusUiOption.ENDURANCE,
    dbValue: TrainingSessionFocusDbOption.ENDURANCE
  },
  [TrainingSessionFocusDbOption.FLEXIBILITY]: {
    uiValue: TrainingSessionFocusUiOption.FLEXIBILITY,
    dbValue: TrainingSessionFocusDbOption.FLEXIBILITY
  },
  [TrainingSessionFocusDbOption.HIIT]: {
    uiValue: TrainingSessionFocusUiOption.HIIT,
    dbValue: TrainingSessionFocusDbOption.HIIT
  },
  [TrainingSessionFocusDbOption.LOW_IMPACT]: {
    uiValue: TrainingSessionFocusUiOption.LOW_IMPACT,
    dbValue: TrainingSessionFocusDbOption.LOW_IMPACT
  },
  [TrainingSessionFocusDbOption.MARTIAL_ARTS]: {
    uiValue: TrainingSessionFocusUiOption.MARTIAL_ARTS,
    dbValue: TrainingSessionFocusDbOption.MARTIAL_ARTS
  },
  [TrainingSessionFocusDbOption.MEDITATION]: {
    uiValue: TrainingSessionFocusUiOption.MEDITATION,
    dbValue: TrainingSessionFocusDbOption.MEDITATION
  },
  [TrainingSessionFocusDbOption.POSTURE]: {
    uiValue: TrainingSessionFocusUiOption.POSTURE,
    dbValue: TrainingSessionFocusDbOption.POSTURE
  },
  [TrainingSessionFocusDbOption.STABILITY]: {
    uiValue: TrainingSessionFocusUiOption.STABILITY,
    dbValue: TrainingSessionFocusDbOption.STABILITY
  },
  [TrainingSessionFocusDbOption.STANDING_NO_FLOOR]: {
    uiValue: TrainingSessionFocusUiOption.STANDING_NO_FLOOR,
    dbValue: TrainingSessionFocusDbOption.STANDING_NO_FLOOR
  },
  [TrainingSessionFocusDbOption.STRENGTH]: {
    uiValue: TrainingSessionFocusUiOption.STRENGTH,
    dbValue: TrainingSessionFocusDbOption.STRENGTH
  },


}

export interface TrainingSessionRecord {
  duration: number,
  endTime: number
  id: string,
  sessionId: string,
  startTime: number,
  userId: string,
};
