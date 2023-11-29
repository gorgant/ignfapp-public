import { EmailSubSource } from "../email/email-sub-source.model";
import { SendgridContactListId } from "../email/email-vars.model";
import { BillingDetails } from "../billing/billing-details.model";
import { OrderHistory } from "../orders/order-history.model";
import { UnsubscribeRecordList, UnsubscribeRecord } from "../email/unsubscribe-record.model";
import { Timestamp } from '@angular/fire/firestore';



export enum PublicUserKeys {
  AVATAR_URL = 'avatarUrl',
  CREATED_TIMESTAMP = 'createdTimestamp',
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
  LAST_AUTHENTICATED_TIMESTAMP = 'lastAuthenticatedTimestamp',
  LAST_MODIFIED_TIMESTAMP = 'lastModifiedTimestamp',
  ONBOARDING_WELCOME_EMAIL_SENT = 'onboardingWelcomeEmailSent',
}

export interface GoogleCloudFunctionsTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface GoogleCloudFunctionsPublicUser extends PublicUser {
  [PublicUserKeys.CREATED_TIMESTAMP]: GoogleCloudFunctionsTimestamp;
  [PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP]: GoogleCloudFunctionsTimestamp | undefined;
  [PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP]: GoogleCloudFunctionsTimestamp | undefined;
  [PublicUserKeys.LAST_AUTHENTICATED_TIMESTAMP]: GoogleCloudFunctionsTimestamp;
  [PublicUserKeys.LAST_MODIFIED_TIMESTAMP]: GoogleCloudFunctionsTimestamp;
}

export interface PublicUser {
  [PublicUserKeys.AVATAR_URL]?: string;
  billingDetails?: BillingDetails | Partial<BillingDetails>;
  [PublicUserKeys.CREATED_TIMESTAMP]: number | Timestamp | GoogleCloudFunctionsTimestamp;
  [PublicUserKeys.DISPLAY_NAME]: string | undefined;
  [PublicUserKeys.EMAIL]: string;
  [PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES]: UnsubscribeRecordList | undefined;
  [PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE]: UnsubscribeRecord | undefined;
  [PublicUserKeys.EMAIL_LAST_SUB_SOURCE]: EmailSubSource | undefined,
  [PublicUserKeys.EMAIL_OPT_IN_CONFIRMED]: boolean | undefined;
  [PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP]: number | Timestamp | GoogleCloudFunctionsTimestamp | undefined;
  [PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP]: number | Timestamp | GoogleCloudFunctionsTimestamp | undefined;
  [PublicUserKeys.EMAIL_SENDGRID_CONTACT_ID]: string | undefined;
  [PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY]: SendgridContactListId[] | undefined;
  [PublicUserKeys.EMAIL_VERIFIED]: boolean | undefined;
  [PublicUserKeys.FIRST_NAME]: string | undefined;
  gender?: 'male' | 'female' | 'nonbinary'
  [PublicUserKeys.ID]: string;
  [PublicUserKeys.LAST_AUTHENTICATED_TIMESTAMP]: number | Timestamp | GoogleCloudFunctionsTimestamp;
  [PublicUserKeys.LAST_MODIFIED_TIMESTAMP]: number | Timestamp | GoogleCloudFunctionsTimestamp;
  [PublicUserKeys.LAST_NAME]: string | undefined;
  isAdmin?: boolean,
  [PublicUserKeys.ONBOARDING_WELCOME_EMAIL_SENT]: boolean | undefined;
  orderHistory?: OrderHistory;
  stripeCustomerId?: string;
}
