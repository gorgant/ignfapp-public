import * as functions from 'firebase-functions';
import { PrelaunchUser, PrelaunchUserFormData, PrelaunchUserKeys } from '../../../shared-models/user/prelaunch-user.model';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';

import { now } from 'moment';
import { publicFirestore } from '../config/db-config';

const prelaunchUsersCollection = publicFirestore.collection(PublicCollectionPaths.PRELAUNCH_USERS);

const checkIfPrelaunchUserExists = async (email: string): Promise<PrelaunchUser | undefined> => {
  const prelaunchUserCollectionRef = await prelaunchUsersCollection
    .where(PrelaunchUserKeys.EMAIL, '==', email)
    .get()
    .catch(err => {functions.logger.log(`Failed to fetch prelaunchUser in public database:`, err); throw new functions.https.HttpsError('internal', err);});

  if (prelaunchUserCollectionRef.empty) {
    functions.logger.log(`PrelaunchUser with email '${email}' doesn't exist in database`);
    return undefined;
  }

  const existingUser = prelaunchUserCollectionRef.docs[0].data() as PrelaunchUser;

  
  return existingUser;

}

// const checkIfPrelaunchUserExists = async (email: string): Promise<{verified: boolean, uid: string | undefined}> => {
//   const prelaunchUserCollectionRef = await prelaunchUsersCollection
//     .where(PrelaunchUserKeys.EMAIL, '==', email)
//     .get()
//     .catch(err => {functions.logger.log(`Failed to fetch prelaunchUser in public database:`, err); throw new functions.https.HttpsError('internal', err);});

//   if (prelaunchUserCollectionRef.empty) {
//     functions.logger.log(`PrelaunchUser with email '${email}' doesn't exist in database`);
//     return {verified: false, uid: undefined};
//   }

//   const existingUser = prelaunchUserCollectionRef.docs[0].data() as PrelaunchUser;

//   if (!existingUser.emailVerified) {
//     functions.logger.log(`PrelaunchUser with email '${email}' does exist but email is not yet verified`);
//     return {verified: false, uid: existingUser.id};
//   }

//   functions.logger.log(`PrelaunchUser with email '${email}' does exists and email is already verified`);
//   return {verified: true, uid: existingUser.id};;

// }

const createPrelaunchUser = async (prelaunchUserFormData: PrelaunchUserFormData, existingUser?: PrelaunchUser): Promise<PrelaunchUser> => {
  const newUserId = prelaunchUsersCollection.doc().id; // Create a new ID
  const prelaunchUser: PrelaunchUser = {
    id: existingUser?.id || newUserId, // use existing UID if it exists
    email: prelaunchUserFormData.email,
    lastModifiedTimestamp: now(),
    createdTimestamp: now(),
    firstName: prelaunchUserFormData.firstName
  }

  await prelaunchUsersCollection.doc(prelaunchUser.id).set(prelaunchUser)
    .catch(err => {functions.logger.log(`Failed to create prelaunchUser in public database:`, err); throw new functions.https.HttpsError('internal', err);});
  
  if (prelaunchUser.emailVerified) {
    functions.logger.log('Existing prelaunchUser updated', prelaunchUser);
  } else {
    functions.logger.log('PrelaunchUser created', prelaunchUser);
  }

  return prelaunchUser;
}

const executeActions = async (prelaunchUserFormData: PrelaunchUserFormData): Promise<PrelaunchUser> => {
  let prelaunchUser = await checkIfPrelaunchUserExists(prelaunchUserFormData.email);
  if (prelaunchUser?.emailVerified) {
    functions.logger.log(`PrelaunchUser exists, exiting function`, prelaunchUser);
    return prelaunchUser;
  }

  prelaunchUser = await createPrelaunchUser(prelaunchUserFormData, prelaunchUser);
  // TODO: fire off confirmation email pubsub request (separate function)

  return prelaunchUser;
}

/////// DEPLOYABLE FUNCTIONS ///////

export const registerPrelaunchUser = functions.https.onCall(async (prelaunchUserFormData: PrelaunchUserFormData, context) => {
  functions.logger.log('Received registerPrelaunchUser request with these params', prelaunchUserFormData);
  functions.logger.log('Request contains this context', context);

  const prelaunchUser = await executeActions(prelaunchUserFormData);

 
  return prelaunchUser;
});

