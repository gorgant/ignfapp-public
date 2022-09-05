import { FormControl } from "@angular/forms"
import { Timestamp } from '@angular/fire/firestore';
import { YoutubeVideoDataCompact } from "../youtube/youtube-video-data.model"
import { TrainingSessionActivityCategoryDbOption } from "./activity-category.model";
import { TrainingSessionMuscleGroupDbOption } from "./muscle-group.model";
import { TrainingSessionComplexityDbOption } from "./training-complexity.model";
import { TrainingSessionIntensityDbOption } from "./training-intensity.model";


export interface TrainingSession extends TrainingSessionNoIdOrTimestamps {
  [TrainingSessionKeys.CREATED_TIMESTAMP]: number | Timestamp,
  id: string,
  [TrainingSessionKeys.LAST_MODIFIED_TIMESTAMP]: number | Timestamp,
}

export interface TrainingSessionNoIdOrTimestamps {
  [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: TrainingSessionActivityCategoryDbOption[],
  [TrainingSessionKeys.COMPLEXITY_AVERAGE]: number, // the average value of submitted ratings
  [TrainingSessionKeys.COMPLEXITY_RATING_COUNT]: number // the number of ratings submitted
  [TrainingSessionKeys.COMPLEXITY_DEFAULT]: number, // the starting value set by the creator
  creatorId: string,
  [TrainingSessionKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes,
  [TrainingSessionKeys.EQUIPMENT]: boolean,
  [TrainingSessionKeys.INTENSITY_AVERAGE]: number, // the average value of submitted ratings
  [TrainingSessionKeys.INTENSITY_DEFAULT]: number, // the starting value set by the creator
  [TrainingSessionKeys.INTENSITY_RATING_COUNT]: number, // the number of ratings submitted 
  [TrainingSessionKeys.MUSCLE_GROUP]: TrainingSessionMuscleGroupDbOption,
  [TrainingSessionKeys.VIDEO_PLATFORM]: TrainingSessionVideoPlatform,
  [TrainingSessionKeys.VIDEO_DATA]: YoutubeVideoDataCompact
}

export interface TrainingSessionForm {
  [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: FormControl<TrainingSessionActivityCategoryDbOption[] | null>,
  [TrainingSessionKeys.COMPLEXITY_DEFAULT]: FormControl<number | null>, // the starting value set by the creator
  [TrainingSessionKeys.EQUIPMENT]: FormControl<boolean | null>,
  [TrainingSessionKeys.INTENSITY_DEFAULT]: FormControl<number | null>, // the starting value set by the creator
  [TrainingSessionKeys.MUSCLE_GROUP]: FormControl<TrainingSessionMuscleGroupDbOption | null>,
  [TrainingSessionKeys.VIDEO_PLATFORM]: FormControl<TrainingSessionVideoPlatform | null>,
}

export enum TrainingSessionDatabaseCategoryTypes {
  CANONICAL = 'canonical',
  PLAN_FRAGMENT = 'planFragment',
  PERSONAL_FRAGMENT = 'personalFragment',
}

export const TrainingSessionFormVars = {
  complexityMin: 0,
  complexityMax: 3,
  intensityMin: 0,
  intensityMax: 3
}

export enum TrainingSessionKeys {
  ACTIVITY_CATEGORY_LIST = 'activityCategoryList',
  COMPLEXITY_AVERAGE = 'complexityAverage',
  COMPLEXITY_DEFAULT = 'complexityDefault',
  COMPLEXITY_RATING_COUNT = 'complexityRatingCount',
  CREATED_TIMESTAMP = 'createdTimestamp',
  DATABASE_CATEGORY = 'databaseCategory',
  EQUIPMENT = 'equipment',
  INTENSITY_AVERAGE = 'intensityAverage',
  INTENSITY_DEFAULT = 'intensityDefault',
  INTENSITY_RATING_COUNT = 'intensityRatingCount',
  LAST_MODIFIED_TIMESTAMP = 'lastModifiedTimestamp',
  MUSCLE_GROUP = 'muscleGroup',
  VIDEO_DATA = 'videoData',
  VIDEO_PLATFORM = 'videoPlatform',
};

export enum TrainingSessionVideoPlatform {
  YOUTUBE = 'youtube'
}

export enum TrainingSessionFilterFormKeys {
  ACTIVITY_CATEGORY_FILTER_ARRAY = 'activityCategoryFilterArray',
  COMPLEXITY_FILTER_ARRAY = 'complexityFilterArray',
  INTENSITY_FILTER_ARRAY = 'intensityFilterArray',
  MUSCLE_GROUP_FILTER_ARRAY = 'muscleGroupFilterArray',
}

export interface TrainingSessionFilterForm {
  [TrainingSessionFilterFormKeys.ACTIVITY_CATEGORY_FILTER_ARRAY]: FormControl<TrainingSessionActivityCategoryDbOption[] | null>,
  [TrainingSessionFilterFormKeys.COMPLEXITY_FILTER_ARRAY]: FormControl<TrainingSessionComplexityDbOption[] | null>, 
  [TrainingSessionKeys.EQUIPMENT]: FormControl<boolean[] | null>, // This is an array due to the multiselect nature of the button toggle mat field form
  [TrainingSessionFilterFormKeys.INTENSITY_FILTER_ARRAY]: FormControl<TrainingSessionIntensityDbOption[] | null>,
  [TrainingSessionFilterFormKeys.MUSCLE_GROUP_FILTER_ARRAY]: FormControl<TrainingSessionMuscleGroupDbOption[] | null>,
}

export interface ViewTrainingSessionsUlrParams {
  [ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS]: boolean | null
}

export enum ViewTrainingSessionsUrlParamsKeys {
  VIEW_TRAINING_SESSIONS = 'viewTrainingSessions'
}

