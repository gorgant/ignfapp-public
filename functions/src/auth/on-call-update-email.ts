import { logger } from 'firebase-functions/v2';
import { CallableOptions, CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { publicFirestore } from '../config/db-config';
import { PublicUser, PublicUserKeys } from '../../../shared-models/user/public-user.model';
import { EmailUpdateData } from '../../../shared-models/email/email-update-data.model';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { currentEnvironmentType } from '../config/environments-config';
import { createOrUpdateSgContact } from '../email/helpers/create-or-update-sg-contact';
import { EnvironmentTypes } from '../../../shared-models/environments/env-vars.model';
import { UserRecord } from 'firebase-functions/v1/auth';
import { fetchAuthUserById } from '../config/global-helpers';
import { Timestamp } from '@google-cloud/firestore';
import { getAuth } from 'firebase-admin/auth';
import { publicAppFirebaseInstance } from '../config/app-config';
import { deleteSgContact } from '../email/helpers/delete-sg-contact';
import { SgCreateOrUpdateContactData } from '../../../shared-models/email/sg-create-or-update-contact-data.model';

const updateEmailInAuthAndDb = async (emailUpdateData: EmailUpdateData): Promise<boolean> => {

  const userCollectionPath: string = PublicCollectionPaths.PUBLIC_USERS;

  const userDoc: FirebaseFirestore.DocumentSnapshot = await publicFirestore.collection(userCollectionPath).doc(emailUpdateData.userId).get()
    .catch(err => {logger.log(`Error fetching user from public database:`, err); throw new HttpsError('internal', err);});
  
  if (!userDoc.exists) {
    logger.log('User does not exist');
    return false;
  }

  // Verify user exists in DB
  const userDataInDb: PublicUser = userDoc.data() as PublicUser;
  if (userDataInDb.id !== emailUpdateData.userId) {
    logger.log('User id in payload does not match id in database');
    return false;
  }

  // Verify user exists in Auth
  const userDataInAuth: UserRecord = await fetchAuthUserById(emailUpdateData.userId);
  if (!userDataInAuth) {
    logger.log('User id in payload does not match id in auth');
    return false;
  }

  // Verify email is still outdated
  const oldEmailInDb = userDataInDb[PublicUserKeys.EMAIL];
  const oldEmailInAuth = userDataInAuth.email;
  if (oldEmailInAuth !== oldEmailInDb) {
    const errMsg = 'User email in db does not equal user email in auth!';
    throw new HttpsError('internal', errMsg);
  }

  // Verify email hasn't already been updated
  const newEmail = emailUpdateData.email;
  if (userDataInAuth.email === newEmail) {
    logger.log('User email already updated, no action taken')
    return true;
  }

  // Update user email and mark verified in auth
  await getAuth(publicAppFirebaseInstance).updateUser(userDataInDb.id, {email: newEmail, emailVerified: true})
    .catch(err => {logger.log(`Error updating user email and emailVerified in auth:`, err); throw new HttpsError('internal', err);});
  
  logger.log(`Email updated and marked verified in auth`);

  // Update user email in db
  const updatedUserData: Partial<PublicUser> = {
    lastModifiedTimestamp: Timestamp.now() as any,
    email: newEmail
  };
  
  await publicFirestore.collection(userCollectionPath).doc(emailUpdateData.userId).update(updatedUserData)
    .catch(err => {logger.log(`Error updating user on public database:`, err); throw new HttpsError('internal', err);});
  
  logger.log(`Marked user "${emailUpdateData.userId}" as opted in and email verified`);

  // Use this object to create a new sg contact
  const updatedEmailUserData: EmailUserData = {
    createdTimestamp: userDataInDb[PublicUserKeys.CREATED_TIMESTAMP],
    email: userDataInDb[PublicUserKeys.EMAIL], 
    emailGroupUnsubscribes: userDataInDb[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES],
    emailGlobalUnsubscribe: userDataInDb[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE],
    emailLastSubSource: userDataInDb[PublicUserKeys.EMAIL_LAST_SUB_SOURCE],
    emailOptInConfirmed: userDataInDb[PublicUserKeys.EMAIL_OPT_IN_CONFIRMED],
    emailOptInTimestamp: userDataInDb[PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP], 
    emailSendgridContactId: userDataInDb[PublicUserKeys.EMAIL_SENDGRID_CONTACT_ID],
    emailSendgridContactListArray: userDataInDb[PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY],
    emailSendgridContactCreatedTimestamp: userDataInDb[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP],
    emailVerified: userDataInDb[PublicUserKeys.EMAIL_VERIFIED],
    firstName: userDataInDb[PublicUserKeys.FIRST_NAME],
    id: userDataInDb[PublicUserKeys.ID],
    lastModifiedTimestamp: userDataInDb[PublicUserKeys.LAST_AUTHENTICATED_TIMESTAMP],
    lastName: userDataInDb[PublicUserKeys.LAST_NAME],
    onboardingWelcomeEmailSent: userDataInDb[PublicUserKeys.ONBOARDING_WELCOME_EMAIL_SENT],
    ...updatedUserData
  };
  const sgCreateOrUpdateContactData: SgCreateOrUpdateContactData = {
    emailUserData: updatedEmailUserData,
    isNewContact: true,
  };

  const oldEmailUserData: EmailUserData = {
    ...updatedEmailUserData,
    email: oldEmailInDb
  };

  // Add the new contact to sendgrid and delete the old one
  // Only run SG contact update in production
  if (currentEnvironmentType === EnvironmentTypes.PRODUCTION) {
    logger.log('Production detected, creating SG contact from email verification');
    await createOrUpdateSgContact(sgCreateOrUpdateContactData);
    await deleteSgContact(oldEmailUserData);
  }

  return true;

}

/////// DEPLOYABLE FUNCTIONS ///////
const callableOptions: CallableOptions = {
  enforceAppCheck: true
};

export const onCallUpdateEmail = onCall(callableOptions, async (request: CallableRequest<EmailUpdateData>): Promise<boolean> => {
  const emailUpdateData = request.data;
  logger.log('Update email request received with this data', emailUpdateData);
  
  const emailUpdated = await updateEmailInAuthAndDb(emailUpdateData);

  return emailUpdated;
});