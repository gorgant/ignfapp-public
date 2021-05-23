
import * as functions from 'firebase-functions';
import * as Axios from 'axios';
import admin = require('firebase-admin');
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { SgContactListRemovalData } from '../../../shared-models/email/sg-contact-list-removal-data';
import { SendgridContactListId } from '../../../shared-models/email/email-vars.model';
import { sendgridMarketingListsApiUrl, sendgridSecret } from './config';
import { SendgridStandardJobResponse } from '../../../shared-models/email/sendgrid-job-response.model';
import { submitHttpRequest } from '../config/global-helpers';
import { getSgContactId } from './helpers/get-sg-contact-id';
import { PublicUser } from '../../../shared-models/user/public-user.model';
import { PrelaunchUser } from '../../../shared-models/user/prelaunch-user.model';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { publicFirestore } from '../config/db-config';
import { now } from 'moment';

// Courtesy of https://sendgrid.api-docs.io/v3.0/contacts-api-lists/delete-a-single-recipient-from-a-single-list

const removeUserFromSendgridContactList = async (listId: SendgridContactListId, contactId: string) => {
  const requestUrl = `${sendgridMarketingListsApiUrl}/${listId}/contacts`;

  // Can add multiple with comma separation
  const queryParams = {
    contact_ids: contactId 
  };

  const requestOptions: Axios.AxiosRequestConfig = {
    method: 'DELETE',
    url: requestUrl,
    params: queryParams,
    headers: {
      authorization: `Bearer ${sendgridSecret}`
    }
  }

  functions.logger.log(`Transmitting request to remove user from contact list "${listId}" with these options`, requestOptions);
  
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
  functions.logger.log(`User removed from ${listsToUpdate.length} SG contact list(s)`);
}

const updateUserListsOnFirestore = async (sgContactListRemovalData: SgContactListRemovalData) => {
  const userData = sgContactListRemovalData.emailUserData;
  const listsToUpdate = sgContactListRemovalData.listsToUpdate;
  
  const userUpdate: Partial<PublicUser | PrelaunchUser> = {
    emailSendgridContactListArray: admin.firestore.FieldValue.arrayRemove(...listsToUpdate) as any, // This spread operator deconstructs the array into comma separated values
    lastModifiedTimestamp: now()
  }

  const userCollectionPath = userData.isPrelaunchUser ? PublicCollectionPaths.PRELAUNCH_USERS : PublicCollectionPaths.PUBLIC_USERS;
  
  functions.logger.log(`Updating list array of this user: "${userData.id}"`);

  const subFbRes = await publicFirestore.collection(userCollectionPath).doc(userData.id).update(userUpdate)
    .catch(err => {functions.logger.log(`Failed to update subscriber:`, err); throw new functions.https.HttpsError('internal', err);});
  
  functions.logger.log(`Removed these lists from user profile`, listsToUpdate);
  return subFbRes;
}

const executeActions = async (sgContactListRemovalData: SgContactListRemovalData) => {

  const userData = sgContactListRemovalData.emailUserData;
  const sgContactId = await getSgContactId(userData);

  // Abort function if SG user can't be found
  if (!sgContactId) {
    functions.logger.error('Failed to retreive SG contact ID, aborting list removal');
    return;
  }

  await bulkContactListUpdate(sgContactListRemovalData, sgContactId);

  await updateUserListsOnFirestore(sgContactListRemovalData);
}

/////// DEPLOYABLE FUNCTIONS ///////

// Listen for pubsub message
export const onPubRemoveUserFromSgContactList = functions.pubsub.topic(PublicTopicNames.REMOVE_USER_FROM_SG_CONTACT_LIST).onPublish( async (message, context) => {
  const sgContactListRemovalData = message.json as SgContactListRemovalData;
  functions.logger.log(`${PublicTopicNames.REMOVE_USER_FROM_SG_CONTACT_LIST} request received with this data:`, sgContactListRemovalData);
  functions.logger.log('Context from pubsub:', context);

  await executeActions(sgContactListRemovalData);
});