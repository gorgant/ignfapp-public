import { logger } from 'firebase-functions/v2';
import { HttpsError } from 'firebase-functions/v2/https';
import { EnvironmentTypes, ProductionCloudStorage, SandboxCloudStorage } from '../../../shared-models/environments/env-vars.model';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { publicAppFirebaseInstance } from '../config/app-config';
import { currentEnvironmentType } from '../config/environments-config';
import { ignfappPublicStorage } from '../config/storage-config';
import { getAuth } from 'firebase-admin/auth';
import { DeleteFilesOptions } from '@google-cloud/storage';
import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { PublicUser, PublicUserKeys } from '../../../shared-models/user/public-user.model';
import { deleteSgContact } from '../email/helpers/delete-sg-contact';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';

const publicStorage = ignfappPublicStorage;
const publicUsersBucket = currentEnvironmentType === EnvironmentTypes.PRODUCTION ? 
  publicStorage.bucket(ProductionCloudStorage.IGNFAPP_PUBLIC_USERS_STORAGE) :
  publicStorage.bucket(SandboxCloudStorage.IGNFAPP_PUBLIC_USERS_STORAGE);


const deleteAuthUser = async(publicUserId: string): Promise<void> => {
  logger.log('Deleting publicUser in Auth with id: ', publicUserId);
  await getAuth(publicAppFirebaseInstance).deleteUser(publicUserId)
    .catch(err => {logger.log(`Failed to delete publicUser on db: `, err); throw new HttpsError('internal', err);});
};

// This should recursively delete anything in the provided dataDirectory
// This gracefully exits if directory doesn't exist so no need to check
// The prefix here is the directory to be queried; use a delimiter in the GetFilesOptions if you want to avoid files in sub directories
// See docs for more details on specificying a directory: https://cloud.google.com/storage/docs/listing-objects#storage-list-objects-nodejs
const deletePublicUserImageData = async (publicUserId: string) => {
  const dataDirectory = publicUserId;
  const getFilesOptions: DeleteFilesOptions = {
    prefix: dataDirectory,
  };
  await publicUsersBucket.deleteFiles(getFilesOptions)
    .catch(err => {logger.log(`Failed to delete publicUser files: `, err); throw new HttpsError('internal', err);});
  
  console.log('Deleted publicUser files');
};

const removeContactFromSg = async (deletedUser: PublicUser) => {
  if (currentEnvironmentType === EnvironmentTypes.SANDBOX) {
    logger.log('Sandbox environment detected, aborting deleteSgContact request');
    return;
  }
  const userEmailData: EmailUserData = {
    createdTimestamp: deletedUser[PublicUserKeys.CREATED_TIMESTAMP],
    email: deletedUser[PublicUserKeys.EMAIL], 
    emailGroupUnsubscribes: deletedUser[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES],
    emailGlobalUnsubscribe: deletedUser[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE],
    emailLastSubSource: deletedUser[PublicUserKeys.EMAIL_LAST_SUB_SOURCE],
    emailOptInConfirmed: deletedUser[PublicUserKeys.EMAIL_OPT_IN_CONFIRMED],
    emailOptInTimestamp: deletedUser[PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP], 
    emailSendgridContactId: deletedUser[PublicUserKeys.EMAIL_SENDGRID_CONTACT_ID],
    emailSendgridContactListArray: deletedUser[PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY],
    emailSendgridContactCreatedTimestamp: deletedUser[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP],
    emailVerified: deletedUser[PublicUserKeys.EMAIL_VERIFIED],
    firstName: deletedUser[PublicUserKeys.FIRST_NAME],
    id: deletedUser[PublicUserKeys.ID],
    lastModifiedTimestamp: deletedUser[PublicUserKeys.LAST_AUTHENTICATED_TIMESTAMP],
    lastName: deletedUser[PublicUserKeys.LAST_NAME],
    onboardingWelcomeEmailSent: deletedUser[PublicUserKeys.ONBOARDING_WELCOME_EMAIL_SENT],
  };
  await deleteSgContact(userEmailData)
    .catch(err => {logger.log(`deleteSgContact failed":`, err); throw new HttpsError('internal', err);});
}

const executeActions = async(deletedUser: PublicUser) => {
  const deletedUserId = deletedUser.id;
  await deleteAuthUser(deletedUserId);
  await deletePublicUserImageData(deletedUserId);
  await removeContactFromSg(deletedUser);
  return true
};

/////// DEPLOYABLE FUNCTIONS ///////

// Note: When user is deleted from db, a separate function automatically removes user image files and deletes the auth account
const watchedDocumentPath = `${PublicCollectionPaths.PUBLIC_USERS}/{wildcardUserId}`;
export const onDeleteRemovePublicUserData = onDocumentDeleted(watchedDocumentPath, async (event) => {
  const deletedUser = event.data?.data() as PublicUser;
  
  logger.log('Detected deletePublicUser in database, processing removal of user data and account', deletedUser);

  const deletionResponse = await executeActions(deletedUser);
 
  return deletionResponse;

})