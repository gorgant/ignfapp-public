import { HttpsError } from 'firebase-functions/v2/https';
import { CloudEvent, logger } from 'firebase-functions/v2';

import { AxiosRequestConfig } from 'axios';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { SgContactListRemovalData } from '../../../shared-models/email/sg-contact-list-removal-data';
import { SendgridContactListId } from '../../../shared-models/email/email-vars.model';
import { sendgridMarketingListsApiUrl } from './config';
import { SendgridStandardJobResponse } from '../../../shared-models/email/sendgrid-objects.model';
import { submitHttpRequest } from '../config/global-helpers';
import { getSgContactId } from './helpers/get-sg-contact-id';
import { PublicUser } from '../../../shared-models/user/public-user.model';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { publicFirestore } from '../config/db-config';
import { Timestamp } from '@google-cloud/firestore';
import { sendgridApiSecret } from '../config/api-key-config';
import { MessagePublishedData, PubSubOptions, onMessagePublished } from 'firebase-functions/v2/pubsub';
import { FieldValue } from 'firebase-admin/firestore';
;

// Courtesy of https://sendgrid.api-docs.io/v3.0/contacts-api-lists/delete-a-single-recipient-from-a-single-list

const removeUserFromSendgridContactList = async (listId: SendgridContactListId, contactId: string) => {
  const requestUrl = `${sendgridMarketingListsApiUrl}/${listId}/contacts`;

  // Can add multiple with comma separation
  const queryParams = {
    contact_ids: contactId 
  };

  const requestOptions: AxiosRequestConfig = {
    method: 'DELETE',
    url: requestUrl,
    params: queryParams,
    headers: {
      authorization: `Bearer ${sendgridApiSecret.value()}`
    }
  }

  logger.log(`Transmitting request to remove user from contact list "${listId}" with these options`, requestOptions);
  
  const sgJobResponse: SendgridStandardJobResponse = await submitHttpRequest(requestOptions) as SendgridStandardJobResponse;

  return sgJobResponse;

}

const bulkContactListUpdate = async (sgContactListRemovalData: SgContactListRemovalData, sgContactId: string) => {
  
  const listsToUpdate = sgContactListRemovalData.listsToUpdate;
  
  const listUpdateQueue = listsToUpdate.map(async listId => {
    const response = await removeUserFromSendgridContactList(listId, sgContactId as string)
    return response;
  })

  await Promise.all(listUpdateQueue);
  logger.log(`User removed from ${listsToUpdate.length} SG contact list(s)`);
}

const updateUserListsOnFirestore = async (sgContactListRemovalData: SgContactListRemovalData) => {
  const userData = sgContactListRemovalData.emailUserData;
  const listsToUpdate = sgContactListRemovalData.listsToUpdate;
  
  const userUpdate: Partial<PublicUser> = {
    emailSendgridContactListArray: FieldValue.arrayRemove(...listsToUpdate) as any, // This spread operator deconstructs the array into comma separated values
    lastModifiedTimestamp: Timestamp.now() as any,
  }

  const userCollectionPath = PublicCollectionPaths.PUBLIC_USERS;
  
  logger.log(`Updating list array of this user: "${userData.id}"`);

  const subFbRes = await publicFirestore.collection(userCollectionPath).doc(userData.id).update(userUpdate)
    .catch(err => {logger.log(`Failed to update subscriber:`, err); throw new HttpsError('internal', err);});
  
  logger.log(`Removed these lists from user profile`, listsToUpdate);
  return subFbRes;
}

const executeActions = async (sgContactListRemovalData: SgContactListRemovalData) => {

  const userData = sgContactListRemovalData.emailUserData;
  const sgContactId = await getSgContactId(userData);

  // Abort function if SG user can't be found
  if (!sgContactId) {
    logger.error('Failed to retreive SG contact ID, aborting list removal');
    return;
  }

  await bulkContactListUpdate(sgContactListRemovalData, sgContactId);

  await updateUserListsOnFirestore(sgContactListRemovalData);
}

/////// DEPLOYABLE FUNCTIONS ///////
const pubSubOptions: PubSubOptions = {
  topic: PublicTopicNames.REMOVE_USER_FROM_SG_CONTACT_LIST_TOPIC,
  secrets: [sendgridApiSecret]
};
// Listen for pubsub message
export const onPubRemoveUserFromSgContactList = onMessagePublished(pubSubOptions, async (event: CloudEvent<MessagePublishedData<SgContactListRemovalData>>) => {
  const sgContactListRemovalData = event.data.message.json;
  logger.log(`${PublicTopicNames.REMOVE_USER_FROM_SG_CONTACT_LIST_TOPIC} requested with this data:`, sgContactListRemovalData);

  await executeActions(sgContactListRemovalData);
});