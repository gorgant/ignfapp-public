import { logger } from 'firebase-functions/v2';
import { CallableOptions, CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { Timestamp } from '@google-cloud/firestore';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { EmailIdentifiers } from '../../../shared-models/email/email-vars.model';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { PublicUser } from '../../../shared-models/user/public-user.model';
import { publicFirestore } from '../config/db-config';
import { fetchDbUserById, verifyAuthUidMatchesDocumentUserIdOrIsAdmin } from '../config/global-helpers';
import { dispatchEmail } from '../email/helpers/dispatch-email';

const publicUsersCollection = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS);

const createPublicUser = async (userData: Partial<PublicUser>) => {
  const publicUser: PublicUser = {
    ...userData as PublicUser,
    lastModifiedTimestamp: Timestamp.now() as any,
    lastAuthenticatedTimestamp: Timestamp.now() as any,
    createdTimestamp: Timestamp.now() as any,
  };

  logger.log('Creating new Public User', publicUser);

  await publicUsersCollection.doc(publicUser.id).set(publicUser)
    .catch(err => {logger.log(`Failed to create user in public database:`, err); throw new HttpsError('internal', err);});
  
  return publicUser;
}

const dispatchEmailVerificationEmail = async(userData: EmailUserData) => {
  const emailCategory = EmailIdentifiers.EMAIL_VERIFICATION;
  await dispatchEmail(userData, emailCategory);
}

const executeActions = async (userData: Partial<PublicUser>): Promise<PublicUser> => {

  const existingUser = await fetchDbUserById(userData.id as string, publicUsersCollection);

  if (existingUser) {
    logger.log(`Terminating function, user with id ${userData.id} already exists in database`);
    const errorMsg = 'Failed to create user. User with this ID already exists in database.';
    throw new HttpsError('internal', errorMsg);
  }

  const newUser = await createPublicUser(userData);

  await dispatchEmailVerificationEmail(newUser);

  return newUser;

}

/////// DEPLOYABLE FUNCTIONS ///////
const callableOptions: CallableOptions = {
  enforceAppCheck: true
};

export const onCallCreatePublicUser = onCall(callableOptions, async (request: CallableRequest<PublicUser>): Promise<PublicUser> => {
  const userData = request.data;
  logger.log('onCallCreatePublicUser requested with these params', userData);

  const documentUserId = userData.id;
  await verifyAuthUidMatchesDocumentUserIdOrIsAdmin(request, documentUserId);

  const newUser = await executeActions(userData);
 
  return newUser;
});