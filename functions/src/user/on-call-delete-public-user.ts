import * as functions from 'firebase-functions';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { publicFirestore } from '../config/db-config';
import { fetchDbUserById } from '../config/global-helpers';

const publicUsersCollection = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS);

// Recursively delete user and all subcollections
const deletePublicUser = async (publicUserId: string): Promise<boolean> => {
  functions.logger.log('Deleting publicUser with id and all subcollections: ', publicUserId);
  await publicFirestore.recursiveDelete(publicUsersCollection.doc(publicUserId))
    .catch(err => {functions.logger.log(`Failed to delete publicUser: `, err); throw new functions.https.HttpsError('internal', err);});
  return true;
}

const executeActions = async (publicUserId: string): Promise<boolean> => {
  const deleteResult = await deletePublicUser(publicUserId);
  return !!deleteResult;
}

// Check if caller ID matches publicUserId OR that caller is an admin
const verifyRequest = async (publicUserId: string, context: functions.https.CallableContext) => {
  const callerId = context.auth?.uid;
  if (!callerId) {
    functions.logger.log('No authentication in request');
    throw new functions.https.HttpsError('permission-denied', 'User is not authenticated');
  }
  if (callerId !== publicUserId) {
    functions.logger.log('callerId does not match publicUserId');
    const callerUserData = await fetchDbUserById(callerId, publicUsersCollection);
    if (!callerUserData.isAdmin) {
      functions.logger.log('callerData is not admin');
      throw new functions.https.HttpsError('permission-denied', 'User is not authenticated');
    }
  }
}

/////// DEPLOYABLE FUNCTIONS ///////

// Note: When user is deleted from db, a separate function automatically removes user image files and deletes the auth account
export const onCallDeletePublicUser = functions.https.onCall(async (publicUserId: string, context): Promise<boolean> => {
  functions.logger.log('Received deletePublicUser request with these params', publicUserId);

  await verifyRequest(publicUserId, context);

  // TODO: Delete user account
  // TODO: Delete user images directory

  const deletionResponse = await executeActions(publicUserId);
 
  return deletionResponse;
});