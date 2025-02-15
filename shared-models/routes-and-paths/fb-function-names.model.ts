export enum PublicFunctionNames {
  ON_CALL_CREATE_PUBLIC_USER = 'onCallCreatePublicUser',
  ON_CALL_CREATE_SESSION_RATING = 'onCallCreateSessionRating',
  ON_CALL_DELETE_PUBLIC_USER = 'onCallDeletePublicUser',
  ON_CALL_DELETE_TRAINING_PLAN = 'onCallDeleteTrainingPlan',
  ON_CALL_DELETE_TRAINING_SESSION = 'onCallDeleteTrainingSession',
  ON_CALL_FETCH_YOUTUBE_VIDEO_DATA = 'onCallFetchYoutubeVideoData',
  ON_CALL_REGISTER_PRELAUNCH_USER = 'onCallRegisterPrelaunchUser',
  ON_CALL_REMOVE_USER_FROM_SG_CONTACT_LIST = 'onCallRemoveUserFromSgContactList',
  ON_CALL_RESIZE_AVATAR = 'onCallResizeAvatar',
  ON_CALL_UPDATE_EMAIL = 'onCallUpdateEmail',
  ON_CALL_UPDATE_PRELAUNCH_USER = 'onCallUpdatePrelaunchUser',
  ON_CALL_UPDATE_PUBLIC_USER = 'onCallUpdatePublicUser',
  ON_CALL_SEND_UPDATE_EMAIL_CONFIRMATION = 'onCallSendUpdateEmailConfirmation',
  ON_CALL_TEST_FUNCTION = 'onCallTestFunction',
  ON_CALL_VERIFY_EMAIL = 'onCallVerifyEmail',
  ON_DELETE_REMOVE_PUBLIC_USER_DATA = 'onDeleteRemovePublicUserData',
  ON_PUB_CREATE_OR_UPDATE_SG_CONTACT = 'onPubCreateOrUpdateSgContact',
  ON_PUB_DELETE_SG_CONTACT = 'onPubDeleteSgContact',
  ON_PUB_DISPATCH_EMAIL = 'onPubDispatchEmail',
  ON_PUB_REMOVE_USER_FROM_SG_CONTACT_LIST = 'onPubRemoveUserFromSgContactList',
  ON_PUB_RESIZE_AVATAR = 'onPubResizeAvatar',
  ON_PUB_UPDATE_SESSION_RATING = 'onPubUpdateSessionRating',
  ON_REQ_PURGE_UNVERIFIED_PUBLIC_USERS = 'onReqPurgeUnverifiedPublicUsers',
  ON_REQ_SG_EMAIL_WEBHOOK_ENDPOINT = 'onReqSgEmailWebhookEndpoint',
  ON_REQ_VERIFY_DB_SG_OPT_IN_PARITY = 'onReqVerifyDbSgOptInParity',
}

export enum PublicTopicNames {
  CREATE_OR_UPDATE_SG_CONTACT_TOPIC = 'create-or-update-sg-contact-topic',
  CREATE_SESSION_RATING = 'create-session-rating',
  DELETE_SG_CONTACT_TOPIC = 'delete-sg-contact-topic',
  DISPATCH_EMAIL_TOPIC = 'dispatch-email-topic',
  REMOVE_USER_FROM_SG_CONTACT_LIST_TOPIC = 'remove-user-from-sg-contact-list-topic',
  RESET_SG_CONTACT_OPT_IN_STATUS = 'reset-sg-contact-opt-in-status',
  RESIZE_AVATAR_TOPIC = 'resize-avatar-topic',
}
