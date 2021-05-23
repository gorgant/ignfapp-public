import { EmailSubSource } from "../email/email-sub-source.model";
import { SendgridContactListIds } from "../email/email-vars.model";
import { BillingDetails } from "../billing/billing-details.model";
import { OrderHistory } from "../orders/order-history.model";
import { UnsubscribeRecordList, UnsubscribeRecord } from "../email/unsubscribe-record.model";

export enum PublicUserKeys {
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
  [PublicUserKeys.EMAIL]: string;
  [PublicUserKeys.ID]: string;
  lastAuthenticated: number;
  lastModifiedTimestamp: number;
  [PublicUserKeys.FIRST_NAME]?: string;
  avatarUrl?: string;
  billingDetails?: BillingDetails | Partial<BillingDetails>;
  createdTimestamp?: number;
  displayName?: string;
  dob?: number;
  [PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES]?: UnsubscribeRecordList;
  [PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE]?: UnsubscribeRecord;
  [PublicUserKeys.ONBOARDING_WELCOME_EMAIL_SENT]?: boolean;
  [PublicUserKeys.EMAIL_LAST_SUB_SOURCE]?: EmailSubSource,
  [PublicUserKeys.EMAIL_OPT_IN_CONFIRMED]?: boolean;
  [PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP]?: number;
  [PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP]?: number;
  [PublicUserKeys.EMAIL_SENDGRID_CONTACT_ID]?: string;
  [PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY]?: SendgridContactListIds[];
  [PublicUserKeys.EMAIL_VERIFIED]?: boolean;
  gender?: 'male' | 'female' | 'nonbinary'
  isNewUser?: boolean;
  [PublicUserKeys.LAST_NAME]?: boolean;
  orderHistory?: OrderHistory;
  stripeCustomerId?: string;
}
