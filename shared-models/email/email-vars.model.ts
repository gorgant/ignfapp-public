import { ShorthandBusinessNames } from "../meta/business-info.model";
import { WebDomains } from "../meta/web-urls.model";

export enum EmailCategories {
  APP_FEATURES_AND_NEWS = 'app-features-and-news',
  AUTO_NOTICE_NEW_USER_SIGNUP = 'auto-notice-new-user-signup',
  AUTO_NOTICE_SUBSCRIBER_COUNT_MISMATCH = 'auto-notice-subscriber-count-mismatch',
  AUTO_NOTICE_WEBPAGE_DATA_LOAD_FAILURE = 'auto-notice-webpage-data-load-failure',
  CONTACT_FORM_CONFIRMATION = 'contact-form-confirmation',
  EMAIL_VERIFICATION = 'email-verification',
  HEALTH_AND_FITNESS_NEWSLETTER = 'health-and-fitness-newsletter',
  ONBOARDING_GUIDE = 'onboarding-guide',
  PRELAUNCH_WELCOME = 'prelaunch-welcome',
  TEST_SEND = 'test-send',
}

// Ids sourced from Sendgrid template system
export enum SendgridEmailTemplateIds {
  IGNFAPP_CONTACT_FORM_CONFIRMATION = 'tbd',
  IGNFAPP_EMAIL_VERIFICATION = 'd-2654be8a32fb4266af9ded864e951355',
  IGNFAPP_ONBOARDING_WELCOME_EMAIL = 'd-0ddd98bc9e0042ef971a6347763b2974',
  IGNFAPP_PRELAUNCH_WELCOME_EMAIL = 'd-bff2b48a51f648a79b19b6e4bc365ffd',
}

export enum SendgridContactListId {
  IGNFAPP_APP_FEATURES_AND_NEWS = '0f27347d-7c8e-4ca1-a587-3ca45da3f0b8',
  IGNFAPP_HEALTH_AND_FITNESS_NEWSLETTER = '0c035799-fbd6-44e8-9a6b-fc4ffa621a89',
  IGNFAPP_ONBOARDING_GUIDE = 'f4cf7b97-ac80-4109-8017-a64042da4b81',
  IGNFAPP_PRELAUNCH_WAIT_LIST = 'd9d4bbee-cc84-4989-b387-a1f3ee6ae241',
}

export enum SendgridEmailUnsubscribeGroupIds {
  IGNFAPP_APP_FEATURES_AND_NEWS = 18275,
  IGNFAPP_HEALTH_AND_FITNESS_NEWSLETTER = 18276,
  IGNFAPP_ONBOARDING_GUIDE = 18278,
  IGNFAPP_PRELAUNCH_WAIT_LIST = 18277,
}

// The UnsubGroupId/ContactListId pair
export interface UnsubIdContactListPairingRecord {
  unsubGroupId: number;
  contactListId: string;
}

// The object containing any number of UnsubGroupId/ContactListId pairs
export interface UnsubIdContactListPairingList {
  [key: string]: UnsubIdContactListPairingRecord;
}

// Allows for addition and removal of contact lists from user profile when subscribing or unsubscribing
export const SendgridUnsubGroupIdContactListPairings: UnsubIdContactListPairingList = {
  [SendgridEmailUnsubscribeGroupIds.IGNFAPP_APP_FEATURES_AND_NEWS]: {
    unsubGroupId: SendgridEmailUnsubscribeGroupIds.IGNFAPP_APP_FEATURES_AND_NEWS,
    contactListId: SendgridContactListId.IGNFAPP_APP_FEATURES_AND_NEWS
  },
  [SendgridEmailUnsubscribeGroupIds.IGNFAPP_HEALTH_AND_FITNESS_NEWSLETTER]: {
    unsubGroupId: SendgridEmailUnsubscribeGroupIds.IGNFAPP_HEALTH_AND_FITNESS_NEWSLETTER,
    contactListId: SendgridContactListId.IGNFAPP_HEALTH_AND_FITNESS_NEWSLETTER
  },
  [SendgridEmailUnsubscribeGroupIds.IGNFAPP_ONBOARDING_GUIDE]: {
    unsubGroupId: SendgridEmailUnsubscribeGroupIds.IGNFAPP_ONBOARDING_GUIDE,
    contactListId: SendgridContactListId.IGNFAPP_ONBOARDING_GUIDE
  },
  [SendgridEmailUnsubscribeGroupIds.IGNFAPP_PRELAUNCH_WAIT_LIST]: {
    unsubGroupId: SendgridEmailUnsubscribeGroupIds.IGNFAPP_PRELAUNCH_WAIT_LIST,
    contactListId: SendgridContactListId.IGNFAPP_PRELAUNCH_WAIT_LIST
  },
}

export const EmailSenderAddresses = {
  IGNFAPP_DEFAULT: `hello@${WebDomains.IGNFAPP_EMAIL}`,
  IGNFAPP_NEWSLETTER: `newsletter@${WebDomains.IGNFAPP_EMAIL}`,
  IGNFAPP_ORDERS: `orders@${WebDomains.IGNFAPP_EMAIL}`,
  IGNFAPP_ADMIN: `admin@${WebDomains.IGNFAPP_EMAIL}`,
  IGNFAPP_SUPPORT: `support@${WebDomains.IGNFAPP_EMAIL}`,
}

export const EmailSenderNames = {
  IGNFAPP_DEFAULT: `${ShorthandBusinessNames.IGNFAPP}`,
  IGNFAPP_NEWSLETTER: `${ShorthandBusinessNames.IGNFAPP}`,
  IGNFAPP_ADMIN: `${ShorthandBusinessNames.IGNFAPP} ADMIN`,
}

export const AdminEmailAddresses = {
  IGNFAPP_GREG: `greg@${WebDomains.IGNFAPP_EMAIL}`,
  IGNFAPP_MD: `md@${WebDomains.IGNFAPP_EMAIL}`,
  IGNFAPP_DEFAULT: `hello@${WebDomains.IGNFAPP_EMAIL}`,
  IGNFAPP_ADMIN: `greg@${WebDomains.IGNFAPP_EMAIL}`
};
