import { EmailEvent } from "../../../../shared-models/email/email-event.model";
import { EmailRecordKeys, EmailRecordWithClicks } from "../../../../shared-models/email/email-record.model";
import { publicFirestore } from "../../config/db-config";
import { EmailEventType } from "../../../../shared-models/email/email-event-type.model";
import { now } from 'moment';
import { UnsubscribeRecord, UnsubscribeRecordList } from '../../../../shared-models/email/unsubscribe-record.model';
import * as functions from 'firebase-functions';
import admin = require('firebase-admin');
import { fetchUserByEmail } from "../../config/global-helpers";
import { PublicCollectionPaths } from "../../../../shared-models/routes-and-paths/fb-collection-paths.model";
import { PublicUser, PublicUserKeys } from "../../../../shared-models/user/public-user.model";
import { PrelaunchUser } from "../../../../shared-models/user/prelaunch-user.model";
import { SendgridUnsubGroupIdContactListPairings } from "../../../../shared-models/email/email-vars.model";

let eventKey: EmailEventType | string;

// Update email record with clicks
const handleClickEvent = async (emailRecordDocRef: FirebaseFirestore.DocumentReference): Promise<Partial<EmailRecordWithClicks>> => {

  functions.logger.log(`Adding new click data`)
  
  const updateClickCount: any = {
    [EmailRecordKeys.CLICK_COUNT]: admin.firestore.FieldValue.increment(1)
  }

  const emailRecordClickUpdates: Partial<EmailRecordWithClicks> = {
    ...updateClickCount
  };

  eventKey = `click_${now()}`; // Set event key to a unique value (to avoid overwriting previous event)

  // Update the email record with the click data
  return emailRecordClickUpdates;
}

// If group unsubscribe, add that to subscriber data
const handleGroupUnsubscribe = async (rawEventData: EmailEvent, subDocRef: FirebaseFirestore.DocumentReference) => {
  functions.logger.log('Group unsubscribe detected');
  
  const unsubGroupId: number = rawEventData.asm_group_id as number;

  const groupUnsubscribeObject: UnsubscribeRecord = {
    unsubscribeDate: now(),
    asm_group_id: unsubGroupId
  }
  
  const groupUnsub: UnsubscribeRecordList = {
    [unsubGroupId]: groupUnsubscribeObject
  };

  const unsubGroupContactListPairing = SendgridUnsubGroupIdContactListPairings[unsubGroupId];

  if (!unsubGroupContactListPairing.contactListId) {
    functions.logger.error('no matching contact list id for this unsub group id', unsubGroupId);
  }

  // Add group unsub and remove contact list id
  const userUpdate: Partial<PublicUser | PrelaunchUser> = {
    emailGlobalUnsubscribe: admin.firestore.FieldValue.delete() as any, // reset the globalUnsubscribe object if it exists
    emailGroupUnsubscribes: groupUnsub, // Since this is an update operation, this will add to existing array of objects
    emailSendgridContactListArray: admin.firestore.FieldValue.arrayRemove(unsubGroupContactListPairing.contactListId) as any,
    lastModifiedTimestamp: now()
  }

  functions.logger.log('Updating user with group unsubscribe and removing contact list id', userUpdate);
  await subDocRef.update(userUpdate)
    .catch(err => {functions.logger.log(`Failed to update subscriber in public database:`, err); throw new functions.https.HttpsError('internal', err);});
}

// If group resubscribe, remove that from subscriber data
// FYI at the moment no way to detect global resubscribe :(
const handleGroupResubscribe = async (rawEventData: EmailEvent, userDocRef: FirebaseFirestore.DocumentReference) => {
  const unsubGroupId: number = rawEventData.asm_group_id as number;
  functions.logger.log(`Group resubscribe type detected with this group id ${unsubGroupId}`);

  const unsubGroupContactListPairing = SendgridUnsubGroupIdContactListPairings[unsubGroupId];

  if (!unsubGroupContactListPairing.contactListId) {
    functions.logger.error('no matching contact list id for this unsub group id', unsubGroupId);
  }

  const userUpdates: Partial<PublicUser | PrelaunchUser> = {
    emailGlobalUnsubscribe: admin.firestore.FieldValue.delete() as any, // reset the globalUnsubscribe object if it exists
    [`${PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES}.${unsubGroupId}`]: admin.firestore.FieldValue.delete() as any, // remove specific unsub record from list
    emailOptInConfirmed: true, // mark user optedIn
    emailOptInTimestamp: now(),
    emailSendgridContactListArray: admin.firestore.FieldValue.arrayUnion(unsubGroupContactListPairing.contactListId) as any,
    lastModifiedTimestamp: now()
  }

  functions.logger.log('Updating user with these updates', userUpdates);
  await userDocRef.update(userUpdates)
    .catch(err => {functions.logger.error(`Failed to update subscriber in public database:`, err); throw new functions.https.HttpsError('internal', err);});
}

// If global unsubscribe, add that to subscriber data and remove optIn designation
// FYI at the moment no way to detect global resubscribe :(
const handleGlobalUnsubscribe = async (subDocRef: FirebaseFirestore.DocumentReference) => {
  functions.logger.log('Global unsubscribe detected');
  
  const globalUnsubscribeObject: UnsubscribeRecord = {
    unsubscribeDate: now(),
  }
  const subscriberUpdates: Partial<PublicUser| PrelaunchUser> = {
    emailGlobalUnsubscribe: globalUnsubscribeObject,
    emailGroupUnsubscribes: admin.firestore.FieldValue.delete() as any,
    emailOptInConfirmed: false,
    emailOptInTimestamp: admin.firestore.FieldValue.delete() as any,
    emailSendgridContactListArray: admin.firestore.FieldValue.delete() as any,
    lastModifiedTimestamp: now()
  };
  
  functions.logger.log('Updating subscriber with global unsubscribe', subscriberUpdates);
  await subDocRef.update(subscriberUpdates)
    .catch(err => {functions.logger.error(`Failed to update subscriber in public database:`, err); throw new functions.https.HttpsError('internal', err);});
}

const executeActions = async (emailEvents: EmailEvent[]) => {

  const userEmail = emailEvents[0].email;
  const recordId = emailEvents[0].sg_message_id;

  // TODO: SWITCH TO publicUser collection ONCE APP IS LIVE
  const userCollection = publicFirestore.collection(PublicCollectionPaths.PRELAUNCH_USERS);
  
  const userData = await fetchUserByEmail(userEmail, userCollection); 

  if (!userData) {
    functions.logger.error(`Error updating email record, prelaunchUser with email ${userEmail} not found`);
    functions.logger.log('HAVE YOU SWITCHED TO publicUser COLLECTION YET?')
    throw new functions.https.HttpsError('internal', `Error updating email record, user with email ${userEmail} not found`);
  }

  const userDocRef: FirebaseFirestore.DocumentReference = userCollection.doc(userData?.id);
  const emailRecordDocRef: FirebaseFirestore.DocumentReference = userDocRef.collection(PublicCollectionPaths.EMAIL_RECORDS).doc(recordId);

  // Log all events provided by webhook
  const logEvents = emailEvents.map( async rawEventData => {
    let emailRecordUpdates: Partial<EmailRecordWithClicks> = {};
    eventKey = rawEventData.event as EmailEventType;

    // Handle event-specific actions
    switch (eventKey) {
      case EmailEventType.CLICK:
        emailRecordUpdates = await handleClickEvent(emailRecordDocRef);
        break;
      case EmailEventType.GROUP_UNSUBSCRIBE:
        await handleGroupUnsubscribe(rawEventData, userDocRef);
        break;
      case EmailEventType.GROUP_RESUBSCRIBE:
        await handleGroupResubscribe(rawEventData, userDocRef);
        break;
      case EmailEventType.UNSUBSCRIBE:
        await handleGlobalUnsubscribe(userDocRef);
        break;
      default:
        break;
    }
    
    // Add the event to the updated email record
    functions.logger.log('Updating record using this event key', eventKey);
    emailRecordUpdates[eventKey as EmailEventType] = rawEventData;

    // Update the email record in database
    functions.logger.log('Updating email record with this event object', emailRecordUpdates);
    
    return emailRecordDocRef.set(emailRecordUpdates, {merge: true})
      .catch(err => {functions.logger.error(`Error updating email record with this event object ${emailRecordUpdates}:`, err); throw new functions.https.HttpsError('internal', err);});
  });

  const res = await Promise.all(logEvents);
  functions.logger.log('All events logged in email record', res);

  return res;
}




/////// CORE FUNCTION ///////

export const updateEmailRecord = async (emailEvents: EmailEvent[]) => {

  if (emailEvents.length < 1) {
    return 'No events in email record';
  }

  return executeActions(emailEvents);
}