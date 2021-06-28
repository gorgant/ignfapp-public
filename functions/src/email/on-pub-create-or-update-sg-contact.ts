import * as functions from 'firebase-functions';
import * as Axios from 'axios';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { SendgridContactUploadData, SendgridStandardJobResponse } from '../../../shared-models/email/sendgrid-objects.model';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { sendgridMarketingContactsApiUrl, sendgridSecret } from './config';
import { submitHttpRequest } from '../config/global-helpers';
import { publicFirestore } from '../config/db-config';
import { now } from 'moment';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { SgContactCustomFieldData, SgContactCustomFieldIds } from '../../../shared-models/email/sg-contact-custom-field-data.model';
import { getSgContactId } from './helpers/get-sg-contact-id';
import { SendgridContactListId } from '../../../shared-models/email/email-vars.model';

// Append Sendgrid Contact Id to Subscriber
const addSgContactIdToSubscriber = async (userData: EmailUserData) => {

  functions.logger.log('Attempting to add sendgrid contact ID to user', userData);

  const contactId = await getSgContactId(userData);

  // Exit if no matching contact found (typically will happen if request takes place right after an upload, which can be slow)
  if (!contactId) {
    functions.logger.log('No matching contact found on Sendgrid, aborted addSendgridContactIdToSubscriber');
    return null;
  }
  
  const userUpdate: Partial<EmailUserData> = {
    emailSendgridContactId: contactId,
    lastModifiedTimestamp: now()
  }

  const userCollectionPath = userData.isPrelaunchUser ? PublicCollectionPaths.PRELAUNCH_USERS : PublicCollectionPaths.PUBLIC_USERS;
  
  const subFbRes = await publicFirestore.collection(userCollectionPath).doc(userData.id).update(userUpdate)
    .catch(err => {functions.logger.log(`Failed to update subscriber:`, err); throw new functions.https.HttpsError('internal', err);});
  
  functions.logger.log('Added Sendgrid contact ID to subscriber', subFbRes);
  return subFbRes;
}

const createOrUpdateSendgridContact = async (userData: EmailUserData): Promise <SendgridStandardJobResponse> => {

  const firstName = userData.firstName;
  const lastName = userData.lastName;
  const email = userData.email;
  const requestUrl = sendgridMarketingContactsApiUrl;
  const customData: SgContactCustomFieldData = {
    [SgContactCustomFieldIds.APP_UID]: userData.id,
    [SgContactCustomFieldIds.CREATED_TIMESTAMP]: userData.createdTimestamp as number
  };

  const listIds = userData.emailSendgridContactListArray as SendgridContactListId[];

  // Many more fields available, check api docs if needed (https://sendgrid.com/docs/api-reference/)
  const requestBody: SendgridContactUploadData = { 
    list_ids: listIds, // NOTE: can add contact to lists, cannot remove from lists (must be done with separate function)
    contacts: [ // NOTE: this is an array, can add multiple contacts here
      { 
        email,
        first_name: firstName,
        last_name: lastName,
        custom_fields: customData
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

  await createOrUpdateSendgridContact(userData);

  const sgContactCreatedRecently = userData.emailSendgridContactCreatedTimestamp ? userData.emailSendgridContactCreatedTimestamp > now() - (5*60*1000) : false; // Check if opt in happend in last five minutes

  if (!userData.emailSendgridContactId && !sgContactCreatedRecently) {
    await addSgContactIdToSubscriber(userData);
  }

});