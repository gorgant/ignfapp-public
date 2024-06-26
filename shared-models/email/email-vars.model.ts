import { ShorthandBusinessNames } from "../meta/business-info.model";
import { WebDomains } from "../meta/web-urls.model";

export enum EmailIdentifiers {
  AUTO_NOTICE_NEW_USER_SIGNUP = 'auto-notice-new-user-signup',
  AUTO_NOTICE_OPT_IN_MISMATCH = 'auto-notice-opt-in-mismatch',
  AUTO_NOTICE_WEBPAGE_DATA_LOAD_FAILURE = 'auto-notice-webpage-data-load-failure',
  CONTACT_FORM_CONFIRMATION = 'contact-form-confirmation',
  EMAIL_VERIFICATION = 'email-verification',
  FEATURES_AND_NEWS = 'features-and-news',
  ONBOARDING_WELCOME = 'onboarding-welcome',
  TEST_SEND = 'test-send',
  UPDATE_EMAIL_CONFIRMATION = 'update-email-confirmation'
}

// Ids sourced from Sendgrid template system
export enum SendgridEmailTemplateIds {
  IGNFAPP_CONTACT_FORM_CONFIRMATION = 'tbd',
  IGNFAPP_EMAIL_VERIFICATION = 'd-c12615f9f735408bb2b3097a040fe138',
  IGNFAPP_ONBOARDING_WELCOME = 'd-06c7b8c5076e4ebcac0e91209cf4e8c2',
  IGNFAPP_UPDATE_EMAIL_CONFIRMATION = 'd-67c80cb2ac4a4ebe92a58f8151f515e9'
}

export enum SendgridContactListId {
  IGNFAPP_FEATURES_AND_NEWS = '4583cd9a-6b32-474e-a99c-eb11885662b8',
}

export enum SendgridEmailUnsubscribeGroupIds {
  IGNFAPP_FEATURES_AND_NEWS = 21757,
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
  [SendgridEmailUnsubscribeGroupIds.IGNFAPP_FEATURES_AND_NEWS]: {
    unsubGroupId: SendgridEmailUnsubscribeGroupIds.IGNFAPP_FEATURES_AND_NEWS,
    contactListId: SendgridContactListId.IGNFAPP_FEATURES_AND_NEWS
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
  IGNFAPP_ADMIN: `greg@${WebDomains.IGNFAPP_EMAIL}`,
  IGNFAPP_TEST_1: `greg+test1@${WebDomains.IGNFAPP_EMAIL}`
};

export type SgContactCustomFieldData = {
  [key in SgContactCustomFieldIds]: string | number | Date;
}

// Sendgrid uses these custom IDs for the custom fields
// To get these ids use postman GET https://api.sendgrid.com/v3/marketing/field_definitions
export enum SgContactCustomFieldIds {
  APP_CREATED_TIMESTAMP = 'e6_D',
  APP_OPT_IN_TIMESTAMP = 'e7_D',
  APP_UID = 'e5_T',
}

export enum SgWebhookSignatureVerificationKeys {
  PRIMARY_KEY = `MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE8hdNto0zp1Z7VcuaI6p5aOdW8b9zjgdTZQf3p9WvNwnvKRRoOZowD1E1NCzcjlKqjfCfi5g/Dt5JuhD2WnM0bA==`
}
