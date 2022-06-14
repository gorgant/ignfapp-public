export interface TrainingSession {
  [TrainingSessionKeys.CHANNEL_URL]: string,
  complexityAverage: number, // the average value of submitted ratings
  complexityCount: number // the number of ratings submitted
  [TrainingSessionKeys.COMPLEXITY_DEFAULT]: number, // the starting value set by the creator
  creatorId: string,
  [TrainingSessionKeys.EQUIPMENT]: boolean,
  [TrainingSessionKeys.DURATION]: number,
  [TrainingSessionKeys.FOCUS_PRIMARY]: TrainingSessionFocus,
  [TrainingSessionKeys.FOCUS_SECONDARY]?: TrainingSessionFocus[],
  id: string,
  intensityAverage: number, // the average value of submitted ratings
  intensityCount: number, // the number of ratings submitted 
  [TrainingSessionKeys.INTENSITY_DEFAULT]: number, // the starting value set by the creator
  thumbnailUrl: string,
  [TrainingSessionKeys.VIDEO_PLATFORM]: SessionVideoPlatforms,
  [TrainingSessionKeys.VIDEO_TITLE]: string,
  [TrainingSessionKeys.VIDEO_URL]: string,
  
};

export interface TrainingSessionVideoData {
  [TrainingSessionKeys.CHANNEL_URL]: string,
  [TrainingSessionKeys.VIDEO_TITLE]: string,
  [TrainingSessionKeys.VIDEO_URL]: string,
  [TrainingSessionKeys.DURATION]: number,
}

export enum TrainingSessionKeys {
  CHANNEL_URL = 'channelUrl',
  COMPLEXITY_DEFAULT = 'complexityDefault',
  EQUIPMENT = 'equipment',
  DURATION = 'duration',
  FOCUS_PRIMARY = 'focusPrimary',
  FOCUS_SECONDARY = 'focusSecondary',
  INTENSITY_DEFAULT = 'intensityDefault',
  VIDEO_PLATFORM = 'videoPlatform',
  VIDEO_TITLE = 'videoTitle',
  VIDEO_URL = 'videoUrl',
};

export enum SessionVideoPlatforms {
  YOUTUBE = 'youtube'
}

export enum TrainingSessionFocus {
  HIIT = 'hitt',
  STRENGTH = 'strength',
  AGILITY = 'agility',
  LOW_IMPACT = 'low-impact',
  POSTURE = 'posture',
  CORE = 'core',
  CARDIO = 'cardio',
  ENDURANCE = 'endurance',
  STABILITY = 'stability',
  FLEXIBILITY = 'flexibility',
  DANCE = 'dance',
  MARTIAL_ARTS = 'martial-arts',
  MEDITATION = 'meditation',
  STANDING_NO_FLOOR = 'standing-no-floor'
};

export interface TrainingSessionRecord {
  duration: number,
  endTime: number
  id: string,
  sessionId: string,
  startTime: number,
  userId: string,
};
