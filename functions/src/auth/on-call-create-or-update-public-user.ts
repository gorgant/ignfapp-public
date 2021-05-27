import * as functions from 'firebase-functions';
import { now } from 'moment';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { EmailCategories } from '../../../shared-models/email/email-vars.model';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { PublicUser } from '../../../shared-models/user/public-user.model';
import { publicFirestore } from '../config/db-config';
import { dispatchEmail } from '../email/helpers/dispatch-email';


const publicUsersCollection = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS);

const fetchExistingUser = async (userId: string): Promise<PublicUser | undefined> => {
  const userDoc = await publicUsersCollection.doc(userId as string).get();
  return userDoc.data() as PublicUser; // Will return undefined if doesn't exist
}

const createOrUpdateUser = async (userData: Partial<PublicUser>, existingUser?: PublicUser) => {
  let publicUser: PublicUser;

  // If user exists, layer new data onto existing user data
  if (existingUser) {
    publicUser =  {
      ...existingUser,
      ...userData,
      lastModifiedTimestamp: now(),
      lastAuthenticated: now(),
    }
    functions.logger.log('Updating existing public user', publicUser);
  } else {
    // Otherwise, create a new public user with the provided userData
    publicUser = {
      ...userData as PublicUser,
      lastModifiedTimestamp: now(),
      lastAuthenticated: now(),
      createdTimestamp: now(),
    };
    functions.logger.log('Creating new Public User', publicUser);
  }
  
  await publicUsersCollection.doc(publicUser.id).set(publicUser, {merge: true})
    .catch(err => {functions.logger.log(`Failed to create prelaunchUser in public database:`, err); throw new functions.https.HttpsError('internal', err);});
  
  return publicUser;
}

const dispatchEmailVerificationEmail = async(userData: EmailUserData) => {
  const emailCategory = EmailCategories.EMAIL_VERIFICATION;
  await dispatchEmail(userData, emailCategory);
}

const executeActions = async (userData: Partial<PublicUser>) => {
  const existingUser = await fetchExistingUser(userData.id as string);

  const updatedUser = await createOrUpdateUser(userData, existingUser);

  if (!existingUser) {
    await dispatchEmailVerificationEmail(updatedUser);
  }

  return updatedUser;

}

/////// DEPLOYABLE FUNCTIONS ///////

export const onCallCreateOrUpdatePublicUser = functions.https.onCall(async (userData: Partial<PublicUser>) => {
  functions.logger.log('Received registerPrelaunchUser request with these params', userData);

  const updatedUser = await executeActions(userData);
 
  return updatedUser;
});