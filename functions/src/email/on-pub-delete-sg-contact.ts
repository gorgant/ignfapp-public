import { CloudEvent, logger } from 'firebase-functions/v2';
import { AxiosRequestConfig } from 'axios';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { SendgridStandardJobResponse } from '../../../shared-models/email/sendgrid-objects.model';
import { sendgridMarketingContactsApiUrl } from './config';
import { submitHttpRequest } from '../config/global-helpers';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { sendgridApiSecret } from '../config/api-key-config';
import { MessagePublishedData, PubSubOptions, onMessagePublished } from 'firebase-functions/v2/pubsub';
import { getSgContactId } from './helpers/get-sg-contact-id';

const deleteSendgridContact = async (userData: EmailUserData): Promise<SendgridStandardJobResponse | null> => {

  const contactId = await getSgContactId(userData);

  if (!contactId) {
    logger.log('No contact id available, aborting deleteSendgridContact with null value');
    return null;
  }

  const queryParams = {
    ids: contactId 
  };

  const requestUrl = sendgridMarketingContactsApiUrl;

  const requestOptions: AxiosRequestConfig = {
    method: 'DELETE',
    url: requestUrl,
    params: queryParams,
    headers: {
      authorization: `Bearer ${sendgridApiSecret.value()}`
    }
  }

  logger.log('Transmitting delete request with these options', requestOptions);
  
  const sgJobResponse: SendgridStandardJobResponse = await submitHttpRequest(requestOptions) as SendgridStandardJobResponse;

  return sgJobResponse;

}

/////// DEPLOYABLE FUNCTIONS ///////
const pubSubOptions: PubSubOptions = {
  topic: PublicTopicNames.DELETE_SG_CONTACT_TOPIC,
  secrets: [sendgridApiSecret]
};

// Listen for pubsub message
export const onPubDeleteSgContact = onMessagePublished(pubSubOptions, async (event: CloudEvent<MessagePublishedData<EmailUserData>>) =>  {
  const userData = event.data.message.json;
  logger.log(`${PublicTopicNames.DELETE_SG_CONTACT_TOPIC} requested with this data:`, userData);

  return deleteSendgridContact(userData);

});