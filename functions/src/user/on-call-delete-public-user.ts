import { logger } from 'firebase-functions/v2';
import { CallableOptions, CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { publicFirestore } from '../config/db-config';
import { verifyAuthUidMatchesDocumentUserIdOrIsAdmin } from '../config/global-helpers';

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

/////// DEPLOYABLE FUNCTIONS ///////
const callableOptions: CallableOptions = {
  enforceAppCheck: true
};

// Note: When user is deleted from db, a separate function onDeleteRemovePublicUserData automatically removes user image files and deletes the auth account
// This enables auto-deletion of data when a user is manually deleted from the FB console
export const onCallDeletePublicUser = onCall(callableOptions, async (request: CallableRequest<string>): Promise<boolean> => {
  const publicUserId = request.data;
  logger.log('onCallDeletePublicUser requested with these params', publicUserId);

  const documentUserId = publicUserId;
  await verifyAuthUidMatchesDocumentUserIdOrIsAdmin(request, documentUserId);

  const deletionResponse = await executeActions(publicUserId);
 
  return deletionResponse;
});