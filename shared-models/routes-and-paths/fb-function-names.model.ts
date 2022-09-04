export enum AdminFunctionNames {
  
}

export enum AdminTopicNames {
  
}

export enum PublicFunctionNames {
  ON_CALL_CREATE_PUBLIC_USER = 'onCallCreatePublicUser',
  ON_CALL_DELETE_PUBLIC_USER = 'onCallDeletePublicUser',
  ON_CALL_FETCH_YOUTUBE_VIDEO_DATA = 'onCallFetchYoutubeVideoData',
  ON_CALL_REGISTER_PRELAUNCH_USER = 'onCallRegisterPrelaunchUser',
  ON_CALL_REMOVE_USER_FROM_SG_CONTACT_LIST = 'onCallRemoveUserFromSgContactList',
  ON_CALL_RESIZE_AVATAR = 'onCallResizeAvatar',
  ON_CALL_UPDATE_PRELAUNCH_USER = 'onCallUpdatePrelaunchUser',
  ON_CALL_UPDATE_PUBLIC_USER = 'onCallUpdatePublicUser',
  ON_CALL_UPDATE_SESSION_RATING = 'onCallUpdateSessionRating',
  ON_CALL_VERIFY_EMAIL = 'onCallVerifyEmail',
  ON_DELETE_REMOVE_PUBLIC_USER_DATA = 'onDeleteRemovePublicUserData',
  ON_PUB_CREATE_OR_UPDATE_SG_CONTACT = 'onPubCreateOrUpdateSgContact',
  ON_PUB_DELETE_SG_CONTACT = 'onPubDeleteSgContact',
  ON_PUB_DISPATCH_EMAIL = 'onPubDispatchEmail',
  ON_PUB_REMOVE_USER_FROM_SG_CONTACT_LIST = 'onPubRemoveUserFromSgContactList',
  ON_PUB_RESIZE_AVATAR = 'onPubResizeAvatar',
  ON_REQ_SG_EMAIL_WEBHOOK_ENDPOINT = 'onReqSgEmailWebhookEndpoint',
  ON_PUB_UPDATE_SESSION_RATING = 'onPubUpdateSessionRating',
}

export enum PublicTopicNames {
  CREATE_OR_UPDATE_SG_CONTACT_TOPIC = 'create-or-update-sg-contact-topic',
  DELETE_SG_CONTACT_TOPIC = 'delete-sg-contact-topic',
  DISPATCH_EMAIL_TOPIC = 'dispatch-email-topic',
  REMOVE_USER_FROM_SG_CONTACT_LIST_TOPIC = 'remove-user-from-sg-contact-list-topic',
  RESIZE_AVATAR_TOPIC = 'resize-avatar-topic',
  SAVE_WEBPAGE_TO_CACHE_TOPIC = 'save-webpage-to-cache-topic',
  UPDATE_SESSION_RATING = 'update-session-rating',
}
