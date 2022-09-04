import * as functions from 'firebase-functions';
import { UserRecord } from 'firebase-functions/v1/auth';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { PrelaunchUser } from '../../../shared-models/user/prelaunch-user.model';
import { UserUpdateData, UserUpdateType } from '../../../shared-models/user/user-update.model';
import { publicFirestore } from '../config/db-config';
import { fetchDbUserById, fetchAuthUserById } from '../config/global-helpers';
import { Timestamp } from '@google-cloud/firestore';;

const prelaunchUsersCollection = publicFirestore.collection(PublicCollectionPaths.PRELAUNCH_USERS);

const updateUser = async (userUpdateData: UserUpdateData): Promise<PrelaunchUser> => {

  const existingUser = await fetchDbUserById(userUpdateData.userData.id as string, prelaunchUsersCollection) as PrelaunchUser;
  const newDataFromClient = userUpdateData.userData;
  const updateType = userUpdateData.updateType;

  let updatedUser: PrelaunchUser = {
    ...existingUser,
  }

  // If bio update, update all aspects of user
  if (updateType === UserUpdateType.BIO_UPDATE) {
    functions.logger.log(`Bio update detected`);
    updatedUser = {
      ...updatedUser,
      ...newDataFromClient,
    };
  }

  // If email update, just update that field
  if (updateType === UserUpdateType.EMAIL_UPDATE) {
    functions.logger.log(`Email update detected`);
    updatedUser.email = newDataFromClient.email as string;
  }

  // If authentication update, just update that field
  if (updateType === UserUpdateType.PASSWORD_UPDATE) {
    functions.logger.log(`Password update detected`);
    // No specific actions for this
  }

  // If authentication update, just update auth specific fields
  if (updateType === UserUpdateType.AUTHENTICATION) {
    const userAuthData: UserRecord = await fetchAuthUserById(updatedUser.id); // This is a precaution to ensure the auth DB is the primary record of email verification
    updatedUser.emailVerified = userAuthData.emailVerified;
    updatedUser.lastAuthenticatedTimestamp = Timestamp.now() as any;
  }

  updatedUser.lastModifiedTimestamp = Timestamp.now() as any; // All user updates trigger this

  await prelaunchUsersCollection.doc(updatedUser.id).update(updatedUser as {}) // Temp typecast to object to bypass typescript type error bug
    .catch(err => {functions.logger.log(`Failed to update prelaunchUser in public database:`, err); throw new functions.https.HttpsError('internal', err);});
  
  functions.logger.log('Updated prelaunchUser', updatedUser);
  
  return updatedUser;
}

const executeActions = async (userUpateData: UserUpdateData): Promise<Partial<PrelaunchUser>> => {

  const updatedUser = await updateUser(userUpateData);

  return updatedUser;

}

/////// DEPLOYABLE FUNCTIONS ///////

export const onCallUpdatePrelaunchUser = functions.https.onCall(async (userUpdateData: UserUpdateData) => {
  functions.logger.log('Received updatePrelaunchUser request with these params', userUpdateData);

  const updatedUser = await executeActions(userUpdateData);
 
  return updatedUser;
});