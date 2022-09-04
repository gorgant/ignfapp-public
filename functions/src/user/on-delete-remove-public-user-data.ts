import * as functions from 'firebase-functions';
import { EnvironmentTypes, ProductionCloudStorage, SandboxCloudStorage } from '../../../shared-models/environments/env-vars.model';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { ignfappPublicApp } from '../config/app-config';
import { currentEnvironmentType } from '../config/environments-config';
import { ignfappPublicStorage } from '../config/storage-config';

const publicStorage = ignfappPublicStorage;
const publicUsersBucket = currentEnvironmentType === EnvironmentTypes.PRODUCTION ? 
  publicStorage.bucket(ProductionCloudStorage.IGNFAPP_PUBLIC_USERS_STORAGE) :
  publicStorage.bucket(SandboxCloudStorage.IGNFAPP_PUBLIC_USERS_STORAGE);


const deleteAuthUser = async(publicUserId: string): Promise<void> => {
  await ignfappPublicApp.auth().deleteUser(publicUserId)
    .catch(err => {functions.logger.log(`Failed to delete authUser: `, err); throw new functions.https.HttpsError('internal', err);});
  console.log('Deleted authUser', publicUserId);
};

// Note: this firebase function gracefully exits if directory doesn't exist so no need to check
const deletePublicUserImageData = async (publicUserId: string) => {
  const dataDirectory = publicUserId;
  await publicUsersBucket.deleteFiles({prefix: dataDirectory})
    .catch(err => {functions.logger.log(`Failed to delete publicUser files: `, err); throw new functions.https.HttpsError('internal', err);});
  
  console.log('Deleted publicUser files');
};

const executeActions = async(publicUserId: string) => {
  await deleteAuthUser(publicUserId);
  await deletePublicUserImageData(publicUserId);
  return true
};

/////// DEPLOYABLE FUNCTIONS ///////

// Note: When user is deleted from db, a separate function automatically removes user image files and deletes the auth account
export const onDeleteRemovePublicUserData = functions.firestore.document(`${PublicCollectionPaths.PUBLIC_USERS}/{wildcardUserId}`).onDelete(async (snapshot, context): Promise<boolean> => {
  
  const publicUserId = snapshot.id;
  
  functions.logger.log('Detected deletePublicUser in database, processing removal of user data and account', publicUserId);

  const deletionResponse = await executeActions(publicUserId);
 
  return deletionResponse;
});