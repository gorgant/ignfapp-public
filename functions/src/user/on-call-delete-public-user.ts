import { logger } from 'firebase-functions/v2';
import { CallableOptions, CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { publicFirestore } from '../config/db-config';
import { fetchDbUserById } from '../config/global-helpers';

const publicUsersCollection = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS);

// Recursively delete user and all subcollections for that user in DB
const deletePublicUserOnDb = async (publicUserId: string): Promise<void> => {
  logger.log('Deleting publicUser and all subcollections on db with id : ', publicUserId);
  await publicFirestore.recursiveDelete(publicUsersCollection.doc(publicUserId))
    .catch(err => {logger.log(`Failed to delete publicUser on db: `, err); throw new HttpsError('internal', err);});
}

const executeActions = async (publicUserId: string): Promise<boolean> => {
  await deletePublicUserOnDb(publicUserId);
  return true;
}

// Check if caller ID matches publicUserId OR that caller is an admin
const verifyRequest = async (publicUserId: string, authId: string | undefined) => {
  if (!authId) {
    logger.log('No authentication in request');
    throw new HttpsError('permission-denied', 'User is not authenticated');
  }
  if (authId !== publicUserId) {
    logger.log('authId does not match publicUserId');
    const callerUserData = await fetchDbUserById(authId, publicUsersCollection);
    if (!callerUserData.isAdmin) {
      logger.log('callerData is not admin');
      throw new HttpsError('permission-denied', 'User is not authenticated');
    }
  }
}

/////// DEPLOYABLE FUNCTIONS ///////
const callableOptions: CallableOptions = {
  enforceAppCheck: true
};

// Note: When user is deleted from db, a separate function onDeleteRemovePublicUserData automatically removes user image files and deletes the auth account
// This enables auto-deletion of data when a user is manually deleted from the FB console
export const onCallDeletePublicUser = onCall(callableOptions, async (request: CallableRequest<string>): Promise<boolean> => {
  const publicUserId = request.data;
  const authId = request.auth?.uid;
  logger.log('Received deletePublicUser request with these params', publicUserId);

  await verifyRequest(publicUserId, authId);

  const deletionResponse = await executeActions(publicUserId);
 
  return deletionResponse;
});