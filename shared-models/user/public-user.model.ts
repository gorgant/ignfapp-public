import { EmailSubSource } from "../email/email-sub-source.model";
import { SendgridContactListId } from "../email/email-vars.model";
import { BillingDetails } from "../billing/billing-details.model";
import { OrderHistory } from "../orders/order-history.model";
import { UnsubscribeRecordList, UnsubscribeRecord } from "../email/unsubscribe-record.model";
import { Timestamp } from '@angular/fire/firestore';



export enum PublicUserKeys {
  AVATAR_URL = 'avatarUrl',
  DISPLAY_NAME = 'displayName',
  EMAIL = 'email',
  EMAIL_GROUP_UNSUBSCRIBES = 'emailGroupUnsubscribes',
  EMAIL_GLOBAL_UNSUBSCRIBE = 'emailGlobalUnsubscribe',
  EMAIL_LAST_SUB_SOURCE = 'emailLastSubSource',
  EMAIL_OPT_IN_TIMESTAMP = 'emailOptInTimestamp',
  EMAIL_OPT_IN_CONFIRMED = 'emailOptInConfirmed',
  EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP = 'emailSendgridContactCreatedTimestamp',
  EMAIL_SENDGRID_CONTACT_ID = 'emailSendgridContactId',
  EMAIL_SENDGRID_CONTACT_LIST_ARRAY = 'emailSendgridContactListArray',
  EMAIL_VERIFIED = 'emailVerified',
  FIRST_NAME = 'firstName',
  ID = 'id',
  LAST_NAME = 'lastName',
  ONBOARDING_WELCOME_EMAIL_SENT = 'onboardingWelcomeEmailSent',
}

export interface PublicUser {
  createdTimestamp: number | Timestamp;
  [PublicUserKeys.EMAIL]: string;
  [PublicUserKeys.ID]: string;
  lastAuthenticatedTimestamp: number | Timestamp;
  lastModifiedTimestamp: number | Timestamp;
  [PublicUserKeys.AVATAR_URL]?: string;
  billingDetails?: BillingDetails | Partial<BillingDetails>;
  [PublicUserKeys.DISPLAY_NAME]?: string;
  [PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES]?: UnsubscribeRecordList;
  [PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE]?: UnsubscribeRecord;
  [PublicUserKeys.EMAIL_LAST_SUB_SOURCE]?: EmailSubSource,
  [PublicUserKeys.EMAIL_OPT_IN_CONFIRMED]?: boolean;
  [PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP]?: number | Timestamp;
  [PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP]?: number | Timestamp;
  [PublicUserKeys.EMAIL_SENDGRID_CONTACT_ID]?: string;
  [PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY]?: SendgridContactListId[];
  [PublicUserKeys.EMAIL_VERIFIED]?: boolean;
  [PublicUserKeys.FIRST_NAME]?: string;
  gender?: 'male' | 'female' | 'nonbinary'
  [PublicUserKeys.LAST_NAME]?: string;
  isAdmin?: boolean,
  [PublicUserKeys.ONBOARDING_WELCOME_EMAIL_SENT]?: boolean;
  orderHistory?: OrderHistory;
  stripeCustomerId?: string;
}
