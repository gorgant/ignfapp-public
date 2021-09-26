export enum PublicAppRoutes {
  BROWSE = '/browse',
  DASHBOARD = '/dashboard',
  EMAIL_VERIFICATION = '/email-verification',
  LOGIN = '/login',
  PRELAUNCH = '/prelaunch',
  PRIVACY_POLICY = '/legal/privacy-policy',
  PROFILE = '/profile',
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