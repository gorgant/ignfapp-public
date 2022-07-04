import { SocialUrlPrefixes } from "shared-models/meta/social-urls.model";
import { TrainingSessionKeys } from "shared-models/train/training-session.model";
import { YoutubeVideoDataKeys } from "shared-models/youtube/youtube-video-data.model";
import { PublicUserKeys } from "../user/public-user.model";
import { UserRegistrationFormFieldKeys } from "./user-registration-form-vals.model";

export const TrainingSessionFormValidationMessages = {
  [TrainingSessionKeys.ACTIVITY_CATEGORY_LIST]: [
    { type: 'required', message: 'Add at least one focus.'},
  ],
  [TrainingSessionKeys.COMPLEXITY_DEFAULT]: [
    { type: 'min', message: 'Value must be greater than 0.'},
  ],
  [TrainingSessionKeys.INTENSITY_DEFAULT]: [
    { type: 'min', message: 'Value must be greater than 0.'},
  ],
  [TrainingSessionKeys.MUSCLE_GROUP]: [
    { type: 'required', message: 'This field is required.'},
  ],
  [TrainingSessionKeys.VIDEO_PLATFORM]: [
    { type: 'required', message: 'This field is required.'},
  ],
  [YoutubeVideoDataKeys.VIDEO_URL]: [
    { type: 'required', message: 'This field is required.'},
    { type: 'pattern', message: `Video url must begin with '${SocialUrlPrefixes.YOUTUBE_VIDEO}'` }
  ],
}

export const UserProfileFormValidationMessages = {
  [PublicUserKeys.FIRST_NAME]: [
    { type: 'required', message: 'First name is required.'},
  ],
  [PublicUserKeys.LAST_NAME]: [
    { type: 'required', message: 'Last name is required.'},
  ],
  [PublicUserKeys.DISPLAY_NAME]: [
    { type: 'required', message: 'Display name is required.'},
  ],
  [PublicUserKeys.EMAIL]: [
    { type: 'required', message: 'Email is required.'},
  ],
  [UserRegistrationFormFieldKeys.PASSWORD]: [
    { type: 'required', message: 'Password is required.'},
  ],
}

export const UserRegistrationFormValidationMessages = {
  [PublicUserKeys.FIRST_NAME]: [
    { type: 'required', message: 'First name is required.'},
  ],
  [PublicUserKeys.EMAIL]: [
    { type: 'required', message: 'Email is required.'},
    { type: 'email', message: 'Not a valid email.'},
  ],
  [UserRegistrationFormFieldKeys.PASSWORD]: [
    { type: 'required', message: 'Password is required.'},
    { type: 'minlength', message: 'Password must be at least eight characters.' }
  ],
};


