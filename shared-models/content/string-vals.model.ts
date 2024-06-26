import { PASSWORD_MIN_LENGTH } from "shared-models/auth/password-vars.model";

export enum GlobalFieldValues {
  ACTIVITY_CATEGORY = `Activity Category`,
  ADD_A_KEYWORD = `Add a keyword...`,
  ADD_A_PLAN = `Add a Plan`,
  ADD_AN_ACTIVITY_CATEGORY = `Add an activity category...`,
  ADD_PLAN_TO_MY_QUEUE = `Add Plan to My Queue`,
  ADD_SESSION_TO_PLAN = `Add Session to Plan`,
  ADD_TO_PLAN = `Add to Plan`,
  ADD_TO_MY_QUEUE = `Add to My Queue`,
  AFTER_THAT = `After That...`,
  APP_VERSION = `App Version`,
  AUTH_PERSONALIZED_WORKOUTS = `Personalized Workout Plans`,
  BACK_TO_DASHBOARD = `Back to Dashboard`,
  BEGIN_TRAINING = `Begin Training`,
  BODYWEIGHT = `Bodyweight`,
  BROWSE_TRAINING_PLANS = `Browse Training Plans`,
  BROWSE_TRAINING_SESSIONS = `Browse Training Sessions`,
  CHANNEL = `Channel`,
  CANCEL = `Cancel`,
  CANCEL_TRAINING = `Cancel Session`,
  CANCEL_TRAINING_CONF_BODY = `Are you sure you want to cancel this training session?`,
  CHANGE_PASSWORD = `Change Password`,
  CHANGE_PASSWORD_BLURB = `A password reset email will be sent to`,
  CHECK_INBOX_1 = `Thanks`,
  CHECK_INBOX_2 = `Now check your inbox to`,
  CHECK_INBOX_3 = `verify your email`,
  CHECK_SPAM_1 = `If you don't see it, be sure to check your Promotions Tab and Spam. Also be sure to add`,
  CHECK_SPAM_2 = `to your trusted contacts`,
  CLEAR_PERSONAL_QUEUE_CONF_BODY = `Are you sure you want to remove ALL training sessions from your queue?`,
  CLEAR_PERSONAL_QUEUE_CONF_TITLE = `Clear My Queue`,
  COMPLETE_TRAINING = `Complete Training`,
  COMPLEXITY = `Complexity`,
  CONFIRM_NEW_EMAIL = `Check your inbox to confirm your new email. Until you do so, your email will remain unchanged.`,
  CREATE_ACCOUNT = `Create Account`,
  CREATE_PASSWORD = `Create Password`,
  CREATE_PLAN = `Create Plan`,
  CREATE_SESSION = `Create Session`,
  DELETE_PUBLIC_USER_CONF_BODY = `Are you sure you want to delete your account and all data associated with it? This action is permanent and cannot be undone.`,
  DELETE_PUBLIC_USER_CONF_TITLE = `Permanently Delete Account`,
  DELETE_TRAINING_PLAN = `Delete Training Plan`,
  DELETE_TRAINING_PLAN_CONF_BODY = `Are you sure you want to delete this training plan?`,
  DELETE_TRAINING_PLAN_CONF_TITLE = `Delete Training Plan`,
  DELETE_TRAINING_RECORD = `Delete Training Record`,
  DELETE_TRAINING_RECORD_CONF_BODY = `Are you sure you want to delete this training record?`,
  DELETE_TRAINING_RECORD_CONF_TITLE = `Delete Training Record`,
  DELETE_TRAINING_SESSION = `Delete Training Session`,
  DELETE_TRAINING_SESSION_CONF_BODY = `Are you sure you want to delete this training session?`,
  DELETE_TRAINING_SESSION_CONF_TITLE = `Delete Training Session`,
  DISCARD_EDITS_TITLE = `Discard Edits`,
  DISCARD_EDITS_BODY = `Are you sure you want to leave? All changes will be discarded.`,
  DISPLAY_NAME = `Display Name`,
  DURATION = `Duration`,
  EC_CONFIRMING_EMAIL = `Processing your email, please wait...`,
  EC_VERIFICATION_FAILED = `Failed to process your email. If you continue to receive this message, try resubmitting your request. If all else fails, contact `,
  EC_EMAIL_CONFIRMED = `Success! Your email has been confirmed.`,
  EC_CHECK_INBOX = `Success! Your email has been confirmed.`,
  EDIT = `Edit`,
  EDIT_AVATAR = `Edit Avatar`,
  EDIT_EMAIL = `Edit Email`,
  EDIT_MY_QUEUE = `Edit My Queue`,
  EDIT_NAME = `Edit Name`,
  EDIT_SESSION = `Edit Session`,
  EDIT_TRAINING_PLAN = `Edit Training Plan`,
  EDIT_TRAINING_RECORD = `Edit Training Record`,
  EMAIL = `Email`,
  EQUIPMENT = `Equipment`,
  FETCH_VIDEO_DATA = `Fetch Video Data`,
  FIRST_NAME = `First Name`,
  FOCUS_SECONDARY = `Other Focus`,
  GO_BACK = `Go Back`,
  HOURS_SHORT = `Hrs`,
  INPUT_NEW_EMAIL = `Input New Email`,
  INPUT_SESSION_DATA = `Input Session Data`,
  INPUT_YOUTUBE_VIDEO_URL_TITLE = `Input YouTube Video Url`,
  INPUT_YOUTUBE_VIDEO_URL_FIELD_VALUE = `Video Url`,
  INPUT_YOUTUBE_VIDEO_URL_HINT = `Click 'Share' on the YouTube video to get the correct url format.`,
  INTENSITY = `Intensity`,
  IVE_CONFIRMED_MY_EMAIL = `I've Confirmed My Email!`,
  LAST_NAME = `Last Name`,
  LOGIN = `Login`,
  LOGOUT = `Logout`,
  LI_ALREADY_HAVE_ACCOUNT = `Already have an account?`,
  LI_AUTH_PROCESSING = `Authentication in progress, please wait...`,
  LI_CREATE_ACCOUNT = `Create a New Account`,
  LI_CONTINUE_WITH_FACEBOOK = `Continue with Facebook`,
  LI_CONTINUE_WITH_GOOGLE = `Continue with Google`,
  LI_PASSWORD_HINT = `Must be at least ${PASSWORD_MIN_LENGTH} characters`,
  LI_SIGN_IN_WITH_EMAIL = `Sign In with Email`,
  LI_SIGN_UP_WITH_EMAIL = `Sign Up with Email`,
  LP_ALREADY_REGISTERED = `You're already registered!`,
  LP_COMING_SOON = `IgnyteFit is Coming Soon!`,
  LP_JOIN_WAITLIST = `Join the Waitlist`,
  LP_BODY = `We're putting the finishing touches on the IgnyteFit app. Don't worry -- you'll be the first to know when it goes live!`,
  LP_YOURE_ON_THE_WAITLIST = `Nice, you're on the waitlist!`,
  MINUTES_SHORT = `Min`,
  MUSCLE_GROUP = `Muscle Group`,
  MY_TRAINING_QUEUE = `My Training Queue`,
  NO = `No`,
  NO_TRAINING_PLANS = `No training plans found. Try creating a new one!`,
  NO_TRAINING_RECORDS = `No training records found. Complete a training session to view it here!`,
  NO_TRAINING_SESSIONS = `No training sessions found. Try adding a new one!`,
  OTHER_KEYWORDS = `Other Keywords`,
  OR_CAPS = `OR`,
  PASSWORD = `Password`,
  PAUSE_TRAINING = `Pause Training`,
  PLANS = `Plans`,
  PROCEED = `Proceed`,
  PROFILE = `Profile`,
  PROCESSING_SUBMISSION = `Processing your submission, please wait...`,
  QUEUE_IS_EMPTY = `Your queue is empty! Click the button below to get started.`,
  REMOVE_FROM_PERSONAL_QUEUE = `Remove from My Queue`,
  REMOVE_FROM_TRAINING_PLAN = `Remove from Plan`,
  REMOVE_PERSONAL_SESSION_FRAGMENT_CONF_BODY = `Are you sure you'd like to remove this training session from your queue?`,
  REMOVE_PERSONAL_SESSION_FRAGMENT_CONF_TITLE = `Remove Training Session`,
  REMOVE_TRAINING_SESSION_CONF_BODY = `Are you sure you'd like to remove this training session from this plan?`,
  REMOVE_TRAINING_SESSION_CONF_TITLE = `Remove Training Session`,
  REQUEST_INVITE = `Request Invite`,
  REQUEST_PROCESSING = `Request Processing`,
  RESUME_TRAINING = `Resume Training`,
  RETURN_TO_EDIT_PLAN = `Return to Edit Plan`,
  RP_CHECK_INBOX = `Check your inbox for an email to reset your password.`,
  RP_FORGOT_PASSWORD = `Forgot password?`,
  RP_RESET_PASSWORD = `Reset Password`,
  SAVE = `Save`,
  SAVE_TRAINING_SESSION_TITLE = `Save Training Session`,
  SEARCH_PLAN_OR_CHANNEL_TITLE = `Search plan or channel title...`,
  SEARCH_VIDEO_OR_CHANNEL_TITLE = `Search video or channel title...`,
  SECONDS_SHORT = `Sec`,
  SEND_UPDATE_EMAIL_CONFIRMATION = `Send Email Confirmation`,
  SESSIONS = `Sessions`,
  SETTINGS = `Settings`,
  STATS = `Stats`,
  START_NOW = `Start Now`,
  SUBMIT = `Submit`,
  TAGS = `Tags`,
  TITLE = `Title`,
  TRAINING_HISTORY = `Training History`,
  TRAINING_RECORDS = `Training Records`,
  TRAINING_SESSIONS = `Training Sessions`,
  UP_NEXT = `Up Next`,
  UPLOAD_IMAGE = `Upload Image`,
  UPDATE_EMAIL = `Update Email`,
  UPDATE_TRAINING_RECORD = `Update Training Record`,
  VERIFY_PASSWORD = `Verify Password`,
  VERIFYING_CREDENTIALS = `Verifying credentials...`,
  VIEW_MY_QUEUE = `View My Queue`,
  VISIBILITY = `Visibility`,
  VISIBILITY_TOOLTIP = `Public: all users can see this\nPrivate: only you can see this`,
  WHO_CAN_SEE_THIS = `Who Can See This?`,
  YES = `Yes`,
}
