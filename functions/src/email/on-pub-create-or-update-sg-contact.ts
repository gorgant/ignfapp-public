import * as functions from 'firebase-functions';
import * as Axios from 'axios';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { SendgridStandardJobResponse } from '../../../shared-models/email/sendgrid-job-response.model';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { sendgridContactsApiUrl, sendgridSecret } from './config';
import { submitHttpRequest } from '../config/global-helpers';
import { publicFirestore } from '../config/db-config';
import { now } from 'moment';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { getSgContactIdByEmail } from './helpers/get-sg-contact-id';

// Append Sendgrid Contact Id to Subscriber
const addSgContactIdToSubscriber = async (userData: EmailUserData) => {

  functions.logger.log('Attempting to add sendgrid contact ID to user', userData);

  const contactId = await getSgContactIdByEmail(userData.email);

  // Exit if no matching contact found (typically will happen if request takes place right after an upload, which can be slow)
  if (!contactId) {
    functions.logger.log('No matching contact found on Sendgrid, aborted addSendgridContactIdToSubscriber');
    return null;
  }
  
  const sendgridContactId: Partial<EmailUserData> = {
    emailSendgridContactId: contactId,
    lastModifiedTimestamp: now()
  }

  const userCollectionPath = userData.isPrelaunchUser ? PublicCollectionPaths.PRELAUNCH_USERS : PublicCollectionPaths.PUBLIC_USERS;
  
  const subFbRes = await publicFirestore.collection(userCollectionPath).doc(userData.id).update(sendgridContactId)
    .catch(err => {functions.logger.log(`Failed to update subscriber:`, err); throw new functions.https.HttpsError('internal', err);});
  
  functions.logger.log('Added Sendgrid contact ID to subscriber', subFbRes);
  return subFbRes;
}

// // Courtesy of https://sendgrid.api-docs.io/v3.0/contacts-api-lists/delete-a-single-recipient-from-a-single-list

// const removeUserFromSendgridContactList = async (listId: SendgridContactListIds, recipientId: string) => {
//   functions.logger.log(`Removing user from contact list: ${listId}`);

//   const requestUrl = `${sendgridContactsApiUrl}/lists/${listId}/recipients/${recipientId}`;

//   const queryParams = {
//     list_id: listId,
//     recipient_id: recipientId 
//   };

//   const requestOptions: Axios.AxiosRequestConfig = {
//     method: 'DELETE',
//     url: requestUrl,
//     params: queryParams,
//     headers: {
//       authorization: `Bearer ${sendgridSecret}`
//     }
//   }

//   functions.logger.log('Transmitting SG update with these options', requestOptions);
  
//   const sgJobResponse: SendgridStandardJobResponse = await submitHttpRequest(requestOptions) as SendgridStandardJobResponse;

//   return sgJobResponse;

// }

const createOrUpdateSendgridContact = async (userData: EmailUserData): Promise <SendgridStandardJobResponse> => {

  const firstName = userData.firstName;
  const lastName = userData.lastName;
  const email = userData.email;
  const requestUrl = sendgridContactsApiUrl;

  const listIds = userData.emailSendgridContactListArray

  // Many more fields available, check api docs if needed (https://sendgrid.com/docs/api-reference/)
  const requestBody = { 
    list_ids: listIds,
    contacts: [ 
      { 
        email,
        first_name: firstName,
        last_name: lastName
      } 
    ] 
  };

  const requestOptions: Axios.AxiosRequestConfig = { 
    method: 'PUT',
    url: requestUrl,
    headers: 
      { 
        'content-type': 'application/json',
        authorization: `Bearer ${sendgridSecret}` 
      },
    data: requestBody,
  };

  functions.logger.log('Transmitting SG update with these options', requestOptions);
  
  const sgJobResponse: SendgridStandardJobResponse = await submitHttpRequest(requestOptions) as SendgridStandardJobResponse;

  return sgJobResponse;

}


/////// DEPLOYABLE FUNCTIONS ///////


// Listen for pubsub message
export const onPubCreateOrUpdateSgContact = functions.pubsub.topic(PublicTopicNames.CREATE_OR_UPDATE_SG_CONTACT_TOPIC).onPublish( async (message, context) => {
  const userData = message.json as EmailUserData;
  functions.logger.log('Create or update SG Contact request received with this data:', userData);
  functions.logger.log('Context from pubsub:', context);

  // TODO: Confirm if lists can bulk add/remove using the array in EmailUserData, otherwise use the specific delete list function that is currently commented out
  await createOrUpdateSendgridContact(userData);

  const sgContactCreatedRecently = userData.emailSendgridContactCreatedTimestamp ? userData.emailSendgridContactCreatedTimestamp > now() - (5*60*1000) : false; // Check if opt in happend in last five minutes

  if (!userData.emailSendgridContactId && !sgContactCreatedRecently) {
    await addSgContactIdToSubscriber(userData);
  }

});