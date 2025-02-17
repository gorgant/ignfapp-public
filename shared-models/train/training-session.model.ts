import { FormControl } from "@angular/forms"
import { FieldValue, Timestamp } from '@angular/fire/firestore';
import { YoutubeVideoDataCompact } from "../youtube/youtube-video-data.model"
import { TrainingSessionActivityCategoryDbOption } from "./activity-category.model";
import { TrainingSessionMuscleGroupDbOption } from "./muscle-group.model";
import { TrainingSessionComplexityDbOption } from "./training-complexity.model";
import { TrainingSessionIntensityDbOption } from "./training-intensity.model";

export interface CanonicalTrainingSessionRatingUpdate extends Omit<CanonicalTrainingSession, TrainingSessionKeys.COMPLEXITY_RATING_COUNT | TrainingSessionKeys.INTENSITY_RATING_COUNT> {
  [TrainingSessionKeys.COMPLEXITY_RATING_COUNT]: FieldValue, // the number of ratings submitted
  [TrainingSessionKeys.INTENSITY_RATING_COUNT]: FieldValue,
}

export interface CanonicalTrainingSession extends CanonicalTrainingSessionNoIdOrTimestamps {
  [TrainingSessionKeys.CREATED_TIMESTAMP]: number | Timestamp,
  [TrainingSessionKeys.ID]: string,
  [TrainingSessionKeys.LAST_MODIFIED_TIMESTAMP]: number | Timestamp,
}

export interface CanonicalTrainingSessionNoIdOrTimestamps extends TrainingSessionNoIdOrTimestamps {
  // [TrainingSessionKeys.VISIBILITY_CATEGORY]: TrainingSessionVisibilityCategoryDbOption;
}

export interface TrainingSessionNoIdOrTimestamps {
  [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: TrainingSessionActivityCategoryDbOption[],
  [TrainingSessionKeys.COMPLEXITY_AVERAGE]: number, // the average value of submitted ratings
  [TrainingSessionKeys.COMPLEXITY_RATING_COUNT]: number // the number of ratings submitted
  [TrainingSessionKeys.COMPLEXITY_DEFAULT]: number, // the starting value set by the creator
  [TrainingSessionKeys.CREATOR_ID]: string,
  [TrainingSessionKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes,
  [TrainingSessionKeys.EQUIPMENT]: boolean,
  [TrainingSessionKeys.INTENSITY_AVERAGE]: number, // the average value of submitted ratings
  [TrainingSessionKeys.INTENSITY_DEFAULT]: number, // the starting value set by the creator
  [TrainingSessionKeys.INTENSITY_RATING_COUNT]: number, // the number of ratings submitted 
  [TrainingSessionKeys.KEYWORD_LIST]: string[],
  [TrainingSessionKeys.MUSCLE_GROUP]: TrainingSessionMuscleGroupDbOption,
  [TrainingSessionKeys.VIDEO_PLATFORM]: TrainingSessionVideoPlatform,
  [TrainingSessionKeys.VIDEO_DATA]: YoutubeVideoDataCompact,
  [TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY]: TrainingSessionVisibilityCategoryDbOption;
}

export enum TrainingSessionDatabaseCategoryTypes {
  CANONICAL = 'canonical',
  PLAN_SESSION_FRAGMENT = 'planSessionFragment',
  PERSONAL_SESSION_FRAGMENT = 'personalSessionFragment',
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
  CREATOR_ID = 'creatorId',
  DATABASE_CATEGORY = 'databaseCategory',
  EQUIPMENT = 'equipment',
  ID = 'id',
  INTENSITY_AVERAGE = 'intensityAverage',
  INTENSITY_DEFAULT = 'intensityDefault',
  INTENSITY_RATING_COUNT = 'intensityRatingCount',
  KEYWORD_LIST = 'keywords',
  LAST_MODIFIED_TIMESTAMP = 'lastModifiedTimestamp',
  MUSCLE_GROUP = 'muscleGroup',
  VIDEO_DATA = 'videoData',
  VIDEO_PLATFORM = 'videoPlatform',
  TRAINING_SESSION_VISIBILITY_CATEGORY = 'trainingSessionVisibilityCategory',
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

export interface BrowseTrainingSessionsQueryParams {
  [BrowseTrainingSessionsQueryParamsKeys.VIEW_TRAINING_SESSIONS]: boolean | null
}

export enum BrowseTrainingSessionsQueryParamsKeys {
  VIEW_TRAINING_SESSIONS = 'viewTrainingSessions'
}

export interface ViewCanonicalTrainingSessionQueryParams {
  [ViewCanonicalTrainingSessionQueryParamsKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes,
  [ViewCanonicalTrainingSessionQueryParamsKeys.TRAINING_SESSION_VISIBILITY_CATEGORY]: TrainingSessionVisibilityCategoryDbOption,
}

// If needed, swap these to static values below when deploying to cloud functions due to compiler complaint
// export enum ViewCanonicalTrainingSessionQueryParamsKeys {
//   DATABASE_CATEGORY = TrainingSessionKeys.DATABASE_CATEGORY,
//   TRAINING_SESSION_VISIBILITY_CATEGORY = TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY,
// }

export enum ViewCanonicalTrainingSessionQueryParamsKeys {
  DATABASE_CATEGORY = 'databaseCategory',
  TRAINING_SESSION_VISIBILITY_CATEGORY = 'trainingSessionVisibilityCategory',
}

export enum TrainingSessionVisibilityCategoryDbOption {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

export enum TrainingSessionVisibilityCategoryUiOption {
  PUBLIC = 'Everyone',
  PRIVATE = 'Only You'
}

export interface TrainingSessionVisibilityCategoryObject {
  uiValue: TrainingSessionVisibilityCategoryUiOption,
  dbValue: TrainingSessionVisibilityCategoryDbOption
}

export interface TrainingSessionVisibilityCategoryListModel {
  [key: string]: TrainingSessionVisibilityCategoryObject
}

export const TrainingSessionVisibilityTypeList: TrainingSessionVisibilityCategoryListModel = {
  [TrainingSessionVisibilityCategoryDbOption.PUBLIC]: {
    uiValue: TrainingSessionVisibilityCategoryUiOption.PUBLIC,
    dbValue: TrainingSessionVisibilityCategoryDbOption.PUBLIC
  },
  [TrainingSessionVisibilityCategoryDbOption.PRIVATE]: {
    uiValue: TrainingSessionVisibilityCategoryUiOption.PRIVATE,
    dbValue: TrainingSessionVisibilityCategoryDbOption.PRIVATE
  },
}

export interface NewTrainingSessionSnackbarData {
  trainingSessionId: string,
  queryParams: ViewCanonicalTrainingSessionQueryParams
};