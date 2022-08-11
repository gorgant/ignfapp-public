import { Timestamp } from '@google-cloud/firestore';;
import * as functions from 'firebase-functions';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { EmailCategories } from '../../../shared-models/email/email-vars.model';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { PublicUser } from '../../../shared-models/user/public-user.model';
import { publicFirestore } from '../config/db-config';
import { fetchUserById } from '../config/global-helpers';
import { dispatchEmail } from '../email/helpers/dispatch-email';
// import * as admin from 'firebase-admin';

const publicUsersCollection = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS);

const createPublicUser = async (userData: Partial<PublicUser>) => {
  const publicUser: PublicUser = {
    ...userData as PublicUser,
    lastModifiedTimestamp: Timestamp.now() as any,
    lastAuthenticatedTimestamp: Timestamp.now() as any,
    createdTimestamp: Timestamp.now() as any,
  };

  functions.logger.log('Creating new Public User', publicUser);

  await publicUsersCollection.doc(publicUser.id).set(publicUser)
    .catch(err => {functions.logger.log(`Failed to create user in public database:`, err); throw new functions.https.HttpsError('internal', err);});
  
  return publicUser;
}

const dispatchEmailVerificationEmail = async(userData: EmailUserData) => {
  const emailCategory = EmailCategories.EMAIL_VERIFICATION;
  await dispatchEmail(userData, emailCategory);
}

const executeActions = async (userData: Partial<PublicUser>): Promise<PublicUser> => {

  const existingUser = await fetchUserById(userData.id as string, publicUsersCollection);

  if (existingUser) {
    functions.logger.log(`Terminating function, user with id ${userData.id} already exists in database`);
    const errorMsg = 'Failed to create user. User with this ID already exists in database.';
    throw new functions.https.HttpsError('internal', errorMsg);
  }

  const newUser = await createPublicUser(userData);

  await dispatchEmailVerificationEmail(newUser);

  return newUser;

}

/////// DEPLOYABLE FUNCTIONS ///////

export const onCallCreatePublicUser = functions.https.onCall(async (userData: Partial<PublicUser>): Promise<PublicUser> => {
  functions.logger.log('Received createPublicUser request with these params', userData);

  const newUser = await executeActions(userData);
 
  return newUser;
});