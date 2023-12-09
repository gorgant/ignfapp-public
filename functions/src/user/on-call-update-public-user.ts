import { logger } from 'firebase-functions/v2';
import { CallableOptions, CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { PublicUser } from '../../../shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from '../../../shared-models/user/user-update.model';
import { publicFirestore } from '../config/db-config';
import { fetchDbUserById, fetchAuthUserById, verifyAuthUidMatchesDocumentUserIdOrIsAdmin } from '../config/global-helpers';
import { Timestamp } from '@google-cloud/firestore';

const publicUsersCollection = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS);

const updateUser = async (userUpdateData: UserUpdateData): Promise<PublicUser> => {

  const existingUser = await fetchDbUserById(userUpdateData.userData.id as string, publicUsersCollection) as PublicUser;
  const newDataFromClient = userUpdateData.userData;
  const updateType = userUpdateData.updateType;

  let updatedUser: PublicUser = {
    ...existingUser,
  }

  // If bio update, update all aspects of user
  if (updateType === UserUpdateType.BIO_UPDATE) {
    logger.log(`Bio update detected`);
    updatedUser = {
      ...updatedUser,
      ...newDataFromClient,
    };
  }

  // If email update, just update that field
  if (updateType === UserUpdateType.EMAIL_UPDATE) {
    logger.log(`Email update detected`);
    updatedUser.email = newDataFromClient.email as string;
  }

  // If password update, just update that field
  if (updateType === UserUpdateType.PASSWORD_UPDATE) {
    logger.log(`Password update detected`);
    // No specific actions for this
  }

  // If authentication update, just update auth specific fields
  if (updateType === UserUpdateType.AUTHENTICATION) {
    const userAuthData = await fetchAuthUserById(updatedUser.id); // This is a precaution to ensure the auth DB is the primary record of email verification
    updatedUser.emailVerified = userAuthData.emailVerified;
    updatedUser.lastAuthenticatedTimestamp = Timestamp.now() as any;
  }

  updatedUser.lastModifiedTimestamp = Timestamp.now() as any; // All user updates trigger this

  await publicUsersCollection.doc(updatedUser.id).update(updatedUser as {}) // Temp typecast to object to bypass typescript type error bug
    .catch(err => {logger.log(`Failed to update publicUser in public database:`, err); throw new HttpsError('internal', err);});
  
  logger.log('Updated existing public user', updatedUser);
  
  return updatedUser;
}

const executeActions = async (userUpateData: UserUpdateData): Promise<Partial<PublicUser>> => {

  const updatedUser = await updateUser(userUpateData);

  return updatedUser;

}

/////// DEPLOYABLE FUNCTIONS ///////
const callableOptions: CallableOptions = {
  enforceAppCheck: true
};

export const onCallUpdatePublicUser = onCall(callableOptions, async (request: CallableRequest<UserUpdateData>) => {
  const userUpdateData = request.data;
  logger.log('onCallUpdatePublicUser requested with this data:', userUpdateData);

  const documentUserId = userUpdateData.userData.id!;
  await verifyAuthUidMatchesDocumentUserIdOrIsAdmin(request, documentUserId);

  const updatedUser = await executeActions(userUpdateData);
 
  return updatedUser;
});