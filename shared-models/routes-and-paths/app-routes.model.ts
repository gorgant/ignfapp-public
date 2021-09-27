export enum PublicAppRoutes {
  ACCOUNT = '/account',
  BROWSE = '/browse',
  EMAIL_VERIFICATION = '/email-verification',
  LOGIN = '/login',
  PRELAUNCH = '/prelaunch',
  PRIVACY_POLICY = '/legal/privacy-policy',
  PROFILE = '/account/profile',
  SIGNUP = '/signup',
  TERMS_AND_CONDITIONS = '/legal/terms-and-conditions',
  WORKOUT = '/workout'
}

export const NoNavBarUrls = [
  PublicAppRoutes.PRELAUNCH,
  PublicAppRoutes.LOGIN,
  PublicAppRoutes.SIGNUP,
  PublicAppRoutes.EMAIL_VERIFICATION
];