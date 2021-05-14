import { PublicUser } from '../user/public-user.model';
import { EmailSubSource } from './email-sub-source.model';
import { GroupUnsubscribeRecordList, UnsubscribeRecord } from './group-unsubscribe-record.model';

export enum EmailSubscriberKeys {
  SUBSCRIPTION_SOURCES = 'subscriptionSources',
  MODIFIED_DATE = 'modifiedDate',
  CREATED_DATE = 'createdDate',
  OPT_IN_CONFIRMED = 'optInConfirmed'
}

export interface EmailSubscriber {
  id: string; // email address of user
  publicUserData: PublicUser;
  [EmailSubscriberKeys.CREATED_DATE]: number;
  [EmailSubscriberKeys.MODIFIED_DATE]: number;
  lastSubSource: EmailSubSource;
  [EmailSubscriberKeys.SUBSCRIPTION_SOURCES]: EmailSubSource[];
  introEmailSent?: boolean;
  groupUnsubscribes?: GroupUnsubscribeRecordList;
  globalUnsubscribe?: UnsubscribeRecord;
  [EmailSubscriberKeys.OPT_IN_CONFIRMED]?: boolean;
  optInTimestamp?: number;
  sendgridContactId?: string;
}

