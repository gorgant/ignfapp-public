import { HttpsError } from 'firebase-functions/v2/https';
import { CloudEvent, logger } from 'firebase-functions/v2';
import { AxiosRequestConfig } from 'axios';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { SendgridContact, SendgridContactUploadData, SendgridStandardJobResponse } from '../../../shared-models/email/sendgrid-objects.model';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { sendgridMarketingContactsApiUrl } from './config';
import { convertFirebaseTimestampToGoogleCloudTimestamp, submitHttpRequest } from '../config/global-helpers';
import { publicFirestore } from '../config/db-config';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { getSgContactId } from './helpers/get-sg-contact-id';
import { SendgridContactListId, SgContactCustomFieldData, SgContactCustomFieldIds } from '../../../shared-models/email/email-vars.model';
import { Timestamp } from '@google-cloud/firestore';
import { sendgridApiSecret } from '../config/api-key-config';
import { MessagePublishedData, PubSubOptions, onMessagePublished } from "firebase-functions/v2/pubsub";
import { PublicUserKeys } from '../../../shared-models/user/public-user.model';
import { SgCreateOrUpdateContactData } from '../../../shared-models/email/sg-create-or-update-contact-data.model';

// Append Sendgrid Contact Id to Subscriber
const addSgContactIdToSubscriber = async (userData: EmailUserData) => {

  logger.log('Attempting to add sendgrid contact ID to user', userData);

  const contactId = await getSgContactId(userData);

  // Exit if no matching contact found (typically will happen if request takes place right after an upload, which can be slow)
  if (!contactId) {
    logger.log('No matching contact found on Sendgrid, aborted addSendgridContactIdToSubscriber');
    return null;
  }
  
  const userUpdate: Partial<EmailUserData> = {
    emailSendgridContactId: contactId,
    lastModifiedTimestamp: Timestamp.now() as any,
  }

  const userCollectionPath = PublicCollectionPaths.PUBLIC_USERS;
  
  const subFbRes = await publicFirestore.collection(userCollectionPath).doc(userData.id).update(userUpdate)
    .catch(err => {logger.log(`Failed to update subscriber:`, err); throw new HttpsError('internal', err);});
  
  logger.log('Added Sendgrid contact ID to subscriber', subFbRes);
  return subFbRes;
}

const createOrUpdateSendgridContact = async (sgCreateOrUpdateContactData: SgCreateOrUpdateContactData): Promise <SendgridStandardJobResponse> => {

  const userData = sgCreateOrUpdateContactData.emailUserData;
  
  const firstName = userData.firstName;
  const email = userData.email;
  const requestUrl = sendgridMarketingContactsApiUrl;
  
  // Without this conversion, manipulations on Timestamps retrieved using the firebase-admin SDK will throw an error.
  const createdTimestamp = userData[PublicUserKeys.CREATED_TIMESTAMP] as Timestamp;
  const optInTimestamp = userData[PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP] as Timestamp;
  const convertedCreatedTimestamp = convertFirebaseTimestampToGoogleCloudTimestamp(createdTimestamp);
  const convertedOptInTimestamp = convertFirebaseTimestampToGoogleCloudTimestamp(optInTimestamp);

  const customData: SgContactCustomFieldData = {
    [SgContactCustomFieldIds.APP_CREATED_TIMESTAMP]: convertedCreatedTimestamp.toDate().toISOString(),
    [SgContactCustomFieldIds.APP_OPT_IN_TIMESTAMP]: convertedOptInTimestamp.toDate().toISOString(),
    [SgContactCustomFieldIds.APP_UID]: userData.id,
  };

  const listIds = userData[PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY] as SendgridContactListId[];
  const contactUpdateData: SendgridContact = {
    email,
    first_name: firstName,
    custom_fields: customData
  };

  // Many more fields available, check api docs if needed (https://sendgrid.com/docs/api-reference/)
  const requestBody: SendgridContactUploadData = { 
    list_ids: listIds, // NOTE: can add contact to lists, cannot remove from lists (must be done with separate function)
    contacts: [ // NOTE: this is an array, can add multiple contacts here
      contactUpdateData
    ] 
  };

  const requestOptions: AxiosRequestConfig = { 
    method: 'PUT',
    url: requestUrl,
    headers: 
      { 
        'content-type': 'application/json',
        authorization: `Bearer ${sendgridApiSecret.value()}` 
      },
    data: requestBody,
  };

  logger.log('Transmitting SG update with these options', requestOptions);
  
  const sgJobResponse: SendgridStandardJobResponse = await submitHttpRequest(requestOptions) as SendgridStandardJobResponse;

  return sgJobResponse;

}

/////// DEPLOYABLE FUNCTIONS ///////
const pubSubOptions: PubSubOptions = {
  topic: PublicTopicNames.CREATE_OR_UPDATE_SG_CONTACT_TOPIC,
  secrets: [sendgridApiSecret]
};

// Listen for pubsub message
export const onPubCreateOrUpdateSgContact = onMessagePublished(pubSubOptions, async (event: CloudEvent<MessagePublishedData<SgCreateOrUpdateContactData>>) => {
  const sgCreateOrUpdateContactData = event.data.message.json;
  const userData = sgCreateOrUpdateContactData.emailUserData;
  const isNewContact = sgCreateOrUpdateContactData.isNewContact;

  logger.log(`${PublicTopicNames.CREATE_OR_UPDATE_SG_CONTACT_TOPIC} requested with this data:`, userData);

  await createOrUpdateSendgridContact(sgCreateOrUpdateContactData);

  const sgContactCreatedRecently = userData[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP] ? convertFirebaseTimestampToGoogleCloudTimestamp(userData[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP] as Timestamp).toMillis() > (Timestamp.now().toMillis() - (5*60*1000)) : false; // Check if opt in happend in last five minutes

  if (!userData[PublicUserKeys.EMAIL_SENDGRID_CONTACT_ID] && !sgContactCreatedRecently && !isNewContact) {
    await addSgContactIdToSubscriber(userData);
  }

});