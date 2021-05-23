import * as functions from 'firebase-functions';
import * as Axios from 'axios';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { SendgridStandardJobResponse } from '../../../shared-models/email/sendgrid-job-response.model';
import { getSgContactId } from './helpers/get-sg-contact-id';
import { sendgridMarketingContactsApiUrl, sendgridSecret } from './config';
import { submitHttpRequest } from '../config/global-helpers';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';

const deleteSendgridContact = async (userData: EmailUserData): Promise<SendgridStandardJobResponse | null> => {

  const contactId = getSgContactId(userData);

  if (!contactId) {
    functions.logger.log('No contact id available, aborting deleteSendgridContact with null value');
    return null;
  }

  const queryParams = {
    ids: contactId 
  };

  const requestUrl = sendgridMarketingContactsApiUrl;

  const requestOptions: Axios.AxiosRequestConfig = {
    method: 'DELETE',
    url: requestUrl,
    params: queryParams,
    headers: {
      authorization: `Bearer ${sendgridSecret}`
    }
  }

  functions.logger.log('Transmitting delete request with these options', requestOptions);
  
  const sgJobResponse: SendgridStandardJobResponse = await submitHttpRequest(requestOptions) as SendgridStandardJobResponse;

  return sgJobResponse;

}

/////// DEPLOYABLE FUNCTIONS ///////


// Listen for pubsub message
export const onPubDeleteSgContact = functions.pubsub.topic(PublicTopicNames.DELETE_SG_CONTACT_TOPIC).onPublish( async (message, context) => {
  const userData = message.json as EmailUserData;
  functions.logger.log('Create or update SG Contact request received with this data:', userData);
  functions.logger.log('Context from pubsub:', context);

  return deleteSendgridContact(userData);

});