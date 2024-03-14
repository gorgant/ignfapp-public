import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { EmailEvent } from "../../../../shared-models/email/email-event.model";
import { EmailRecordKeys, EmailRecordWithClicks } from "../../../../shared-models/email/email-record.model";
import { publicFirestore } from "../../config/db-config";
import { EmailEventType } from "../../../../shared-models/email/email-event-type.model";
import { UnsubscribeRecord, UnsubscribeRecordList } from '../../../../shared-models/email/unsubscribe-record.model';
import { fetchUserByEmail } from "../../config/global-helpers";
import { PublicCollectionPaths } from "../../../../shared-models/routes-and-paths/fb-collection-paths.model";
import { PublicUser, PublicUserKeys } from "../../../../shared-models/user/public-user.model";
import { SendgridUnsubGroupIdContactListPairings } from "../../../../shared-models/email/email-vars.model";
import { Timestamp } from '@google-cloud/firestore';
import { FieldValue } from 'firebase-admin/firestore';

let eventKey: EmailEventType | string;

// Update email record with clicks
const handleClickEvent = (): Partial<EmailRecordWithClicks> => {
  const updateClickCount: any = {
    [EmailRecordKeys.CLICK_COUNT]: FieldValue.increment(1)
  }

  const emailRecordClickUpdates: Partial<EmailRecordWithClicks> = {
    ...updateClickCount
  };

  eventKey = `click_${Timestamp.now().toMillis()}`; // Set event key to a unique value (to avoid overwriting previous event)

  // Update the email record with the click data
  return emailRecordClickUpdates;
}

// If group unsubscribe, add that to subscriber data
const handleGroupUnsubscribe = (rawEventData: EmailEvent): Partial<PublicUser> => {
  const unsubGroupId: number = rawEventData.asm_group_id as number;

  const groupUnsubscribeObject: UnsubscribeRecord = {
    unsubscribeTimestamp: Timestamp.now() as any,
    asm_group_id: unsubGroupId
  }
  
  const groupUnsub: UnsubscribeRecordList = {
    [unsubGroupId]: groupUnsubscribeObject
  };

  const unsubGroupContactListPairing = SendgridUnsubGroupIdContactListPairings[unsubGroupId];

  if (!unsubGroupContactListPairing.contactListId) {
    logger.error('no matching contact list id for this unsub group id', unsubGroupId);
  }

  // Add group unsub and remove contact list id
  const userUpdates: Partial<PublicUser> = {
    [PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE]: FieldValue.delete() as any, // reset the globalUnsubscribe object if it exists
    [PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES]: groupUnsub, // Since this is an update operation, this will add to existing array of objects
    [PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY]: FieldValue.arrayRemove(unsubGroupContactListPairing.contactListId) as any,
    [PublicUserKeys.LAST_MODIFIED_TIMESTAMP]: Timestamp.now() as any,
  }

  logger.log('Updating user with group unsubscribe and removing contact list id', userUpdates);
  return userUpdates;
}

// If group resubscribe, remove that from subscriber data
// FYI at the moment no way to detect global resubscribe :(
const handleGroupResubscribe = (rawEventData: EmailEvent): Partial<PublicUser> => {
  const unsubGroupId: number = rawEventData.asm_group_id as number;
  logger.log(`Group resubscribe type detected with this group id ${unsubGroupId}`);

  const unsubGroupContactListPairing = SendgridUnsubGroupIdContactListPairings[unsubGroupId];

  if (!unsubGroupContactListPairing.contactListId) {
    logger.error('no matching contact list id for this unsub group id', unsubGroupId);
  }

  const userUpdates: Partial<PublicUser> = {
    [PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE]: FieldValue.delete() as any, // reset the globalUnsubscribe object if it exists
    [`${PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES}.${unsubGroupId}`]: FieldValue.delete() as any, // remove specific unsub record from list
    [PublicUserKeys.EMAIL_OPT_IN_CONFIRMED]: true, // mark user optedIn
    [PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP]: Timestamp.now() as any,
    [PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY]: FieldValue.arrayUnion(unsubGroupContactListPairing.contactListId) as any,
    [PublicUserKeys.LAST_MODIFIED_TIMESTAMP]: Timestamp.now() as any,
  }

  logger.log('Updating user with these updates', userUpdates);
  return userUpdates;
}

// If global unsubscribe, add that to subscriber data and remove optIn designation
// FYI at the moment no way to detect global resubscribe :(
const handleGlobalUnsubscribe = () => {
  const globalUnsubscribeObject: UnsubscribeRecord = {
    unsubscribeTimestamp: Timestamp.now() as any,
  }
  const userUpdates: Partial<PublicUser> = {
    [PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE]: globalUnsubscribeObject,
    [PublicUserKeys.EMAIL_OPT_IN_CONFIRMED]: false,
    [PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP]: FieldValue.delete() as any,
    [PublicUserKeys.EMAIL_OPT_OUT_TIMESTAMP]: Timestamp.now() as any,
    [PublicUserKeys.LAST_MODIFIED_TIMESTAMP]: Timestamp.now() as any,
  };
  
  logger.log('Updating subscriber with global unsubscribe', userUpdates);
  return userUpdates;
}

// This will cycle through all email events and batch commit the various events to the database
const executeActions = async (emailEvents: EmailEvent[]) => {

  const userEmail = emailEvents[0].email;
  const recordId = emailEvents[0].sg_message_id;

  let userCollection = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS);
  let userData = await fetchUserByEmail(userEmail, userCollection); 

  if (!userData) {
    logger.error(`Error updating email record, user with email ${userEmail} not found`);
    throw new HttpsError('internal', `Error updating email record, user with email ${userEmail} not found`);
  }

  const userDocRef: FirebaseFirestore.DocumentReference = userCollection.doc(userData.id);
  const emailRecordDocRef: FirebaseFirestore.DocumentReference = userDocRef.collection(PublicCollectionPaths.EMAIL_RECORDS).doc(recordId);

  let writeBatch = publicFirestore.batch();
  let operationCount = 0;

  for (const rawEventData of emailEvents) {
    let emailRecordUpdates: Partial<EmailRecordWithClicks> = {};
    let isEmailRecordUpdate = false;
    let userUpdates: Partial<PublicUser> = {};
    let isUserUpdate = false;

    eventKey = rawEventData.event as EmailEventType;
    // Handle event-specific actions
    switch (eventKey) {
      case EmailEventType.CLICK:
        logger.log(`Click event detected`);
        emailRecordUpdates = handleClickEvent();
        isEmailRecordUpdate = true;
        break;
      case EmailEventType.GROUP_UNSUBSCRIBE:
        logger.log('Group unsubscribe detected');
        userUpdates = handleGroupUnsubscribe(rawEventData);
        isUserUpdate = true;
        break;
      case EmailEventType.GROUP_RESUBSCRIBE:
        userUpdates = handleGroupResubscribe(rawEventData);
        isUserUpdate = true;
        break;
      case EmailEventType.UNSUBSCRIBE:
        logger.log('Global unsubscribe detected');
        userUpdates = handleGlobalUnsubscribe();
        isUserUpdate = true;
        break;
      case EmailEventType.SPAM_REPORT:
        logger.log('Spam report detected');
        userUpdates = handleGlobalUnsubscribe();
        isUserUpdate = true;
        break;
      default:
        logger.log('No matching event to handle.');
        break;
    }

    if (isEmailRecordUpdate) {
      writeBatch.set(emailRecordDocRef, emailRecordUpdates, {merge: true});
      operationCount++;
    }

    if (isUserUpdate) {
      writeBatch.update(userDocRef, userUpdates);
      operationCount++;
    }

    // Firestore batch limit is 500 operations per batch
    // Commit the existing batch and create a new batch instance (the loop will continue with that new batch instance)
    if (operationCount === 490) {
      await writeBatch.commit()
        .catch(err => {logger.log(`Error writing batch to backupPostsCollectionRef:`, err); throw new HttpsError('internal', err);});
      writeBatch = publicFirestore.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await writeBatch.commit()
      .catch(err => {logger.log(`Error writing batch to backupPostsCollectionRef:`, err); throw new HttpsError('internal', err);});
  }
}



/////// CORE FUNCTION ///////

export const handleSgWebhookEvents = async (emailEvents: EmailEvent[]) => {

  return executeActions(emailEvents);
}