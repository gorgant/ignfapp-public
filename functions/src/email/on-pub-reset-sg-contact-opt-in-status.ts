import { CloudEvent, logger } from 'firebase-functions/v2';
import { AxiosRequestConfig } from 'axios';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { SendgridStandardJobResponse } from '../../../shared-models/email/sendgrid-objects.model';
import { sendgridGlobalSuppressionsAsmApiUrl, sendgridGroupSuppressionsApiUrl } from './config';
import { submitHttpRequest } from '../config/global-helpers';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { sendgridApiSecret } from '../config/api-key-config';
import { MessagePublishedData, PubSubOptions, onMessagePublished } from 'firebase-functions/v2/pubsub';
import { PublicUserKeys } from '../../../shared-models/user/public-user.model';

const removeContactFromGlobalSuppressionList = async (userData: EmailUserData) => {
  const contactEmail = userData[PublicUserKeys.EMAIL];
  const requestUrl = `${sendgridGlobalSuppressionsAsmApiUrl}/${contactEmail}`;

  const requestOptions: AxiosRequestConfig = {
    method: 'DELETE',
    url: requestUrl,
    headers: {
      authorization: `Bearer ${sendgridApiSecret.value()}`
    }
  }

  logger.log('Transmitting removeContactFromGlobalSuppressionList request with these options', requestOptions);
  
  await submitHttpRequest(requestOptions) as SendgridStandardJobResponse;
}

const removeContactFromGroupUnsubscribes = async (userData: EmailUserData) => {
  const unsubscribeRecordList = userData[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES];
  if (!unsubscribeRecordList) {
    return;
  }

  for (const key in unsubscribeRecordList) {
    if (unsubscribeRecordList.hasOwnProperty(key)) {
      const record = unsubscribeRecordList[key];
      if (record.asm_group_id !== undefined) {
        const groupId = record.asm_group_id;
        const contactEmail = userData[PublicUserKeys.EMAIL];

        const requestUrl = `${sendgridGroupSuppressionsApiUrl}/${groupId}/suppressions/${contactEmail}`;
        const requestOptions: AxiosRequestConfig = {
          method: 'DELETE',
          url: requestUrl,
          headers: {
            authorization: `Bearer ${sendgridApiSecret.value()}`
          }
        }

        logger.log('Transmitting removeContactFromGroupUnsubscribes request with these options', requestOptions);

        await submitHttpRequest(requestOptions) as SendgridStandardJobResponse;
      }
    }
  }
}

const executeActions = async (userData: EmailUserData) => {
  if (!!userData[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE]) {
    await removeContactFromGlobalSuppressionList(userData);
  }

  if (!!userData[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES]) {
    await removeContactFromGroupUnsubscribes(userData);
  }
}

/////// DEPLOYABLE FUNCTIONS ///////
const pubSubOptions: PubSubOptions = {
  topic: PublicTopicNames.RESET_SG_CONTACT_OPT_IN_STATUS,
  secrets: [sendgridApiSecret]
};

// Listen for pubsub message
export const onPubResetSgContactOptInStatus = onMessagePublished(pubSubOptions, async (event: CloudEvent<MessagePublishedData<EmailUserData>>) =>  {
  const userData = event.data.message.json;
  logger.log(`${PublicTopicNames.RESET_SG_CONTACT_OPT_IN_STATUS} requested with this data:`, userData);

  await executeActions(userData);

});