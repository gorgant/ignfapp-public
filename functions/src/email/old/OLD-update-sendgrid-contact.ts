import * as functions from 'firebase-functions';
import * as Axios from 'axios';
import { sendgridMarketingContactsApiUrl, sendgridSecret } from '../config';
import { currentEnvironmentType } from '../../config/environments-config';
import { SendgridStandardJobResponse, SendgridImportStatusResponse, SendgridSearchContactsResponse } from '../../../../shared-models/email/sendgrid-objects.model';
import { now } from 'moment';
import { submitHttpRequest } from '../../config/global-helpers';
import { publicFirestore } from '../../config/db-config';
import { EmailUserData } from '../../../../shared-models/email/email-user-data.model';
import { PublicCollectionPaths } from '../../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { EnvironmentTypes } from '../../../../shared-models/environments/env-vars.model';

const sendgridApiKey = sendgridSecret;

const wildcardParamKey = 'subscriberId'; // Can use any value here, will represent the doc ID

const getImportStatus = async (jobId: string): Promise<SendgridImportStatusResponse> => {

  // Encode reserved characters found in URL (may not be necessary)
  const safeUrl = jobId.replace(/[!'()*]/g, (c) => {
    return '%' + c.charCodeAt(0).toString(16);
  });

  const requestUrl = `${sendgridMarketingContactsApiUrl}/imports/${safeUrl}`;

  const requestOptions: Axios.AxiosRequestConfig = {
    method: 'GET',
    url: requestUrl,
    headers: 
      { 
        'content-type': 'application/json',
        authorization: `Bearer ${sendgridApiKey}` 
      }
  };

  functions.logger.log('Checking job status with these options', requestOptions);

  const importStatusResponse: SendgridImportStatusResponse = await submitHttpRequest(requestOptions) as SendgridImportStatusResponse;

    
  functions.logger.log('Got this job status:', importStatusResponse);
  // const parsedResponse: SengridImportStatusResponse = JSON.parse(importStatusResponse);
  // functions.logger.log(`Here's the parsed version ${parsedResponse}`);
  
  return importStatusResponse;
}

// Make five attempts over several seconds to check if SG update was complete
const checkUpdateComplete = async (jobId: string): Promise<boolean> => {
  
  let attemptCount = 0;
  let jobDone = false;
  let importStatusResponse: any;
  
  while(!jobDone && attemptCount < 5) {
    importStatusResponse = await getImportStatus(jobId);

    const parsedStatusResponse: SendgridImportStatusResponse = JSON.parse(importStatusResponse);

    // Check if job is done, return true if it is, otherwise wait a second and return false
    // If job not complete, wait and try again
    jobDone = await new Promise<boolean>((resolve, reject) => {
      functions.logger.log('initiating jobDoneCheckPromise with this importStatusResponse', parsedStatusResponse)

      // It takes a while for import to be marked complete, created_count seems to update faster so that's an alternative signal
      // If job not complete, wait a second and try again
      if (
          parsedStatusResponse.status !== 'completed' && 
          !parsedStatusResponse.results.created_count && 
          !parsedStatusResponse.results.updated_count
        ) {
        setTimeout(() => {
          resolve(false);
        }, 3000)
      } else {
        resolve(true);
      }
    });


    attemptCount ++;
  }

  functions.logger.log(`Completed check for update with outcome of ${jobDone} after ${attemptCount} attempts`);
  return jobDone;
}

// Queries sendgrid for a specific email address and returns the user ID
const getSendgridContactId = async (email: string): Promise<string | null> => {

  const requestUrl = `${sendgridMarketingContactsApiUrl}/search`;
  const requestBody = { 
    query: `email LIKE '${email}'` // accepts most SQL queries such as AND CONTAINS...
  };
  const requestOptions: Axios.AxiosRequestConfig = {
    method: 'POST',
    url: requestUrl,
    headers: 
      { 
        'content-type': 'application/json',
        authorization: `Bearer ${sendgridApiKey}` 
      },
    data: requestBody
  };

  functions.logger.log('Searching SG for contact with these options', requestOptions);

  const searchResponse: SendgridSearchContactsResponse = await submitHttpRequest(requestOptions) as SendgridSearchContactsResponse;
  
  if (searchResponse.contact_count < 1) {
    functions.logger.log('No contacts found, aborting getSendgridContactId with null value');
    return null;
  }

  const subId = searchResponse.result[0].id as string;
  functions.logger.log('Found contact with this id:', subId);
  
  return subId;

}

const deleteSendgridContact = async (userData: EmailUserData): Promise<SendgridStandardJobResponse | null> => {

  let contactId: string;

  if (userData.emailSendgridContactId) {
    contactId = userData.emailSendgridContactId;
  } else {
    contactId = await getSendgridContactId(userData.id) as string;
  }


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
      authorization: `Bearer ${sendgridApiKey}`
    }
  }

  functions.logger.log('Transmitting delete request with these options', requestOptions);
  
  const sgJobResponse: SendgridStandardJobResponse = await submitHttpRequest(requestOptions) as SendgridStandardJobResponse;

  return sgJobResponse;

}

const createOrUpdateSendgridContact = async (userData: EmailUserData): Promise <SendgridStandardJobResponse> => {

  const firstName = userData.firstName;
  const lastName = userData.lastName;
  const email = userData.id;
  const requestUrl = sendgridMarketingContactsApiUrl;

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
        authorization: `Bearer ${sendgridApiKey}` 
      },
    data: requestBody,
  };

  functions.logger.log('Transmitting SG update with these options', requestOptions);
  
  const sgJobResponse: SendgridStandardJobResponse = await submitHttpRequest(requestOptions) as SendgridStandardJobResponse;

  return sgJobResponse;

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
//       authorization: `Bearer ${sendgridApiKey}`
//     }
//   }

//   functions.logger.log('Transmitting SG update with these options', requestOptions);
  
//   const sgJobResponse: SendgridStandardJobResponse = await submitHttpRequest(requestOptions) as SendgridStandardJobResponse;

//   return sgJobResponse;

// }

// Append Sendgrid Contact Id to Subscriber
const addSendgridContactIdToSubscriber = async (userData: EmailUserData, contactUpdateJobId?: string) => {

  functions.logger.log('Attempting to add sendgrid contact ID to user', userData);

  // If contactUpdateJobId provided, use it to screen addition request
  if (contactUpdateJobId) {
    // Wait for sendgrid update job to complete
    const updateJobComplete = await checkUpdateComplete(contactUpdateJobId);
    
    // Abort if update job takes too long (will not be able to fetch contact ID if contact isn't in Sendgrid system yet)
    if (!updateJobComplete) {
      functions.logger.log('Sendgrid update took too long, aborted addSendgridContactIdToSubscriber');
      return null;
    }
  }

  const email = userData.email;
  const contactId = await getSendgridContactId(email);

  // Exit if no matching contact found (typically will happen if request takes place right after an upload, which can be slow)
  if (!contactId) {
    functions.logger.log('No matching contact found on Sendgrid, aborted addSendgridContactIdToSubscriber');
    return null;
  }
  
  const sendgridContactId: Partial<EmailUserData> = {
    emailSendgridContactId: contactId,
    lastModifiedTimestamp: now()
  }
  
  const subFbRes = await publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS).doc(userData.id).update(sendgridContactId)
    .catch(err => {functions.logger.log(`Failed to update subscriber:`, err); throw new functions.https.HttpsError('internal', err);});
  
  functions.logger.log('Added Sendgrid contact ID to subscriber', subFbRes);
  return subFbRes;
}



const executeActions = async (newUserData: EmailUserData | null, oldUserData: EmailUserData | null) => {

  const deleteRequest = !newUserData; // If no new subscriber data, document has been deleted
  const optInRequest = !oldUserData?.emailOptInConfirmed && newUserData?.emailOptInConfirmed; // Incoming data shows optIn changed from false to true
  const optOutRequest = oldUserData?.emailOptInConfirmed && !newUserData?.emailOptInConfirmed; // Incoming data shows optIn changed from true to false
  const contactListUpdate = newUserData?.emailSendgridContactListArray?.length !== oldUserData?.emailSendgridContactListArray?.length; // Detect change in contact list
  const nameChange = newUserData?.firstName !== oldUserData?.firstName || newUserData?.lastName !== oldUserData?.lastName; // Detect name change

  const subscriberMissingSGContactId = !newUserData?.emailSendgridContactId;
  const optInOccurredSecondsAgo = newUserData?.emailOptInTimestamp ? newUserData.emailOptInTimestamp > now() - (60*1000) : false; // Check if opt in happend in last minute

  // Exit function if in sandbox to prevent bad data getting to sendGrid
  if (currentEnvironmentType === EnvironmentTypes.SANDBOX) {
    // functions.logger.log('Sandbox detected, OVERRIDING EXIT FOR TESTING PURPOSES');
    functions.logger.log('Sandbox detected, exit function with no updates to SengGrid');
    return;
  }

  if (deleteRequest) {
    functions.logger.log('Deleting contact from SendGrid');
    await deleteSendgridContact(oldUserData as EmailUserData);
    return;
  }

  if (optInRequest || optOutRequest || contactListUpdate || nameChange) {
    functions.logger.log('Updating Sendgrid user profile');
    await createOrUpdateSendgridContact(newUserData as EmailUserData);
  }

  if (!subscriberMissingSGContactId && !optInOccurredSecondsAgo) {
    await addSendgridContactIdToSubscriber(newUserData as EmailUserData);
  }

}

/////// DEPLOYABLE FUNCTIONS ///////

// Listen for writes to the subscribers collection, courtesy of https://firebase.google.com/docs/functions/firestore-events#writing-triggered_functions
export const updateSendgridContact = functions.firestore.document(`${PublicCollectionPaths.PUBLIC_USERS}/{${wildcardParamKey}}`).onWrite( async (change, context) => {

  const userId = context.params[wildcardParamKey];
  functions.logger.log('Subscriber collection write detected for this userId:', userId);

  const oldSubscriberData: EmailUserData | null = change.before.exists ? change.before.data() as EmailUserData : null; // Check for additions
  const newSubscriberData: EmailUserData | null = change.after.exists ? change.after.data() as EmailUserData : null; // Check for deletions

  return executeActions(newSubscriberData, oldSubscriberData);

});

