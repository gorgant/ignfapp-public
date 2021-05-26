import * as functions from 'firebase-functions';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { now } from 'moment';
import { publicFirestore } from '../config/db-config';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { EmailCategories } from '../../../shared-models/email/email-vars.model';
import { PrelaunchUser } from '../../../shared-models/user/prelaunch-user.model';
import { fetchUserByEmail } from '../config/global-helpers';
import { dispatchEmail } from '../email/helpers/dispatch-email';

const prelaunchUsersCollection = publicFirestore.collection(PublicCollectionPaths.PRELAUNCH_USERS);

// Important to put the timestamps here to prevent user tampering on client side
const createOrUpdatePrelaunchUser = async (userData: EmailUserData, existingUser?: PrelaunchUser): Promise<PrelaunchUser> => {

  let prelaunchUser: PrelaunchUser;

  if (existingUser) {
    // If user already exists, exit function with that user and updated timestamps
    prelaunchUser =  {
      ...existingUser,
      lastModifiedTimestamp: now(),
      lastAuthenticated: now(),
    }
    functions.logger.log('Updating existing prelaunchUser', prelaunchUser);
  } else {
    // Otherwise, create a new prelaunch user with the provided userData
    prelaunchUser = {
      ...userData,
      lastModifiedTimestamp: now(),
      lastAuthenticated: now(),
      createdTimestamp: now(),
      isPrelaunchUser: true,
    };
    functions.logger.log('Creating new PrelaunchUser', prelaunchUser);
  }

  
  await prelaunchUsersCollection.doc(prelaunchUser.id).set(prelaunchUser, {merge: true})
    .catch(err => {functions.logger.log(`Failed to create prelaunchUser in public database:`, err); throw new functions.https.HttpsError('internal', err);});
  
  return prelaunchUser;
}

const dispatchEmailVerificationEmail = async(userData: EmailUserData) => {
  const emailCategory = EmailCategories.EMAIL_VERIFICATION;
  await dispatchEmail(userData, emailCategory);
}

const executeActions = async (userData: EmailUserData): Promise<PrelaunchUser> => {
  // Since this uses only Firestore rather than also Firebase Auth (which prevents email dups), need to screen by email rather than UID (otherwise multiple UIDs could have same email)
  
  let prelaunchUser = await fetchUserByEmail(userData.email, prelaunchUsersCollection) as PrelaunchUser | undefined;
  
  // If prelaunch user exists and email is verfied, exit function without welcome email
  if (prelaunchUser?.emailVerified) {
    functions.logger.log(`PrelaunchUser exists and email is verified, exiting function`, prelaunchUser);
    return prelaunchUser;
  }

  prelaunchUser = await createOrUpdatePrelaunchUser(userData, prelaunchUser);

  await dispatchEmailVerificationEmail(prelaunchUser);

  return prelaunchUser;
}

/////// DEPLOYABLE FUNCTIONS ///////

export const onCallRegisterPrelaunchUser = functions.https.onCall(async (userData: EmailUserData) => {
  functions.logger.log('Received registerPrelaunchUser request with these params', userData);

  const prelaunchUser = await executeActions(userData);
 
  return prelaunchUser;
});

