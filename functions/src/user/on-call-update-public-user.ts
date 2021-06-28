import * as functions from 'firebase-functions';
import { now } from 'moment';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { PublicUser } from '../../../shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from '../../../shared-models/user/user-update.model';
import { publicFirestore } from '../config/db-config';
import { fetchUserById } from '../config/global-helpers';


const publicUsersCollection = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS);

const updateUser = async (userUpdateData: UserUpdateData): Promise<PublicUser> => {

  const existingUser = await fetchUserById(userUpdateData.userData.id as string, publicUsersCollection);

  let updatedUser: PublicUser = {
    ...existingUser,
    lastModifiedTimestamp: now(),
  }

  if (userUpdateData.updateType === UserUpdateType.AUTHENTICATION) {
    updatedUser.lastAuthenticated = now();
  }

  await publicUsersCollection.doc(updatedUser.id as string).update(updatedUser)
    .catch(err => {functions.logger.log(`Failed to update publicUser in public database:`, err); throw new functions.https.HttpsError('internal', err);});
  
  functions.logger.log('Updated existing public user', updatedUser);
  
  return updatedUser;
}

const executeActions = async (userUpateData: UserUpdateData): Promise<Partial<PublicUser>> => {

  const updatedUser = await updateUser(userUpateData);

  return updatedUser;

}

/////// DEPLOYABLE FUNCTIONS ///////

export const onCallUpdatePublicUser = functions.https.onCall(async (userUpdateData: UserUpdateData) => {
  functions.logger.log('Received updatePublicUser request with these params', userUpdateData);

  const updatedUser = await executeActions(userUpdateData);
 
  return updatedUser;
});