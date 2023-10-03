export enum PublicAppRoutes {
  ACCOUNT = '/account',
  BROWSE = '/browse',
  BROWSE_FILTERS = '/browse/filters',
  EMAIL_VERIFICATION = '/auth/email-verification',
  LOGIN = '/auth/login',
  PRELAUNCH = '/prelaunch',
  PRIVACY_POLICY = '/legal/privacy-policy',
  PROFILE = '/account/profile',
  SIGNUP = '/auth/signup',
  SETTINGS = '/account/settings',
  STATS = '/account/stats',
  TERMS_AND_CONDITIONS = '/legal/terms-and-conditions',
  TRAIN_DASHBOARD = '/train',
  TRAINING_SESSION = '/train/session',
  TRAINING_SESSION_EDIT = '/build/edit-training-session',
  TRAINING_SESSION_NEW = '/build/new-training-session',
  TRAINING_PLAN = '/train/plan',
  TRAINING_PLAN_EDIT = '/build/edit-training-plan',
  TRAINING_PLAN_NEW = '/build/new-training-plan',
}

export const NoNavBarUrls = [
  PublicAppRoutes.PRELAUNCH,
  PublicAppRoutes.LOGIN,
  PublicAppRoutes.SIGNUP,
  PublicAppRoutes.EMAIL_VERIFICATION,
  PublicAppRoutes.TRAINING_SESSION,
  PublicAppRoutes.TRAINING_SESSION_EDIT,
  PublicAppRoutes.TRAINING_SESSION_NEW,
  PublicAppRoutes.TRAINING_PLAN,
  PublicAppRoutes.TRAINING_PLAN_NEW,
  PublicAppRoutes.TRAINING_PLAN_EDIT,
];