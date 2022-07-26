import { FormControl } from "@angular/forms"
import { YoutubeVideoDataCompact } from "../youtube/youtube-video-data.model"
import { TrainingSessionActivityCategoryDbOption } from "./activity-category.model";
import { TrainingSessionMuscleGroupDbOption } from "./muscle-group.model";

export interface TrainingSession extends TrainingSessionNoId {
  id: string;
}

export interface TrainingSessionNoId {
  [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: TrainingSessionActivityCategoryDbOption[],
  complexityAverage: number, // the average value of submitted ratings
  complexityRatingCount: number // the number of ratings submitted
  [TrainingSessionKeys.COMPLEXITY_DEFAULT]: number, // the starting value set by the creator
  creatorId: string,
  [TrainingSessionKeys.EQUIPMENT]: boolean,
  intensityAverage: number, // the average value of submitted ratings
  [TrainingSessionKeys.MUSCLE_GROUP]: TrainingSessionMuscleGroupDbOption,
  [TrainingSessionKeys.INTENSITY_DEFAULT]: number, // the starting value set by the creator
  intensityRatingCount: number, // the number of ratings submitted 
  [TrainingSessionKeys.VIDEO_PLATFORM]: TrainingSessionVideoPlatform,
  videoData: YoutubeVideoDataCompact
}

export interface TrainingSessionForm {
  [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: FormControl<TrainingSessionActivityCategoryDbOption[] | null>,
  [TrainingSessionKeys.COMPLEXITY_DEFAULT]: FormControl<number | null>, // the starting value set by the creator
  [TrainingSessionKeys.EQUIPMENT]: FormControl<boolean | null>,
  [TrainingSessionKeys.INTENSITY_DEFAULT]: FormControl<number | null>, // the starting value set by the creator
  [TrainingSessionKeys.MUSCLE_GROUP]: FormControl<TrainingSessionMuscleGroupDbOption | null>,
  [TrainingSessionKeys.VIDEO_PLATFORM]: FormControl<TrainingSessionVideoPlatform | null>,
}

export const TrainingSessionFormVars = {
  complexityMin: 0,
  complexityMax: 3,
  intensityMin: 0,
  intensityMax: 3
}

export enum TrainingSessionKeys {
  ACTIVITY_CATEGORY_LIST = 'activityCategoryList',
  COMPLEXITY_DEFAULT = 'complexityDefault',
  EQUIPMENT = 'equipment',
  INTENSITY_DEFAULT = 'intensityDefault',
  MUSCLE_GROUP = 'muscleGroup',
  VIDEO_PLATFORM = 'videoPlatform',
};

export enum TrainingSessionVideoPlatform {
  YOUTUBE = 'youtube'
}

