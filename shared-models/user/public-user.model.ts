import { BillingDetails } from "shared-models/billing/billing-details.model";
import { OrderHistory } from "shared-models/orders/order-history.model";
import { EmailSubSource } from "shared-models/subscribers/email-sub-source.model";

export interface PublicUser {
  id: string;
  email: string;
  lastAuthenticated: number;
  lastModifiedTimestamp: number;
  isNewUser?: boolean;
  displayName?: string;
  avatarUrl?: string;
  dob?: number;
  gender?: 'male' | 'female' | 'nonbinary'
  createdTimestamp?: number;
  billingDetails?: BillingDetails | Partial<BillingDetails>;
  stripeCustomerId?: string;
  orderHistory?: OrderHistory;
  emailVerified?: boolean;
  emailOptInConfirmed?: boolean;
  emailOptInTimestamp?: number;
  emailIntroSent?: boolean;
  emailLastSubSource?: EmailSubSource
}
