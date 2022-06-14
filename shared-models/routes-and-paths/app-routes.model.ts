export enum PublicAppRoutes {
  ACCOUNT = '/account',
  BROWSE = '/browse',
  BROWSE_FILTERS = '/browse/filters',
  EMAIL_VERIFICATION = '/email-verification',
  LOGIN = '/login',
  PRELAUNCH = '/prelaunch',
  PRIVACY_POLICY = '/legal/privacy-policy',
  PROFILE = '/account/profile',
  SIGNUP = '/signup',
  SETTINGS = '/account/settings',
  STATS = '/account/stats',
  TERMS_AND_CONDITIONS = '/legal/terms-and-conditions',
  TRAIN = '/train',
  TRAINING_SESSION_EDIT = 'build/edit-training-session',
  TRAINING_SESSION_NEW = 'build/new-training-session',
  TRAINING_PLAN_EDIT = 'build/edit-training-plan',
  TRAINING_PLAN_NEW = 'build/new-training-plan',
}

export const NoNavBarUrls = [
  PublicAppRoutes.PRELAUNCH,
  PublicAppRoutes.LOGIN,
  PublicAppRoutes.SIGNUP,
  PublicAppRoutes.EMAIL_VERIFICATION
];