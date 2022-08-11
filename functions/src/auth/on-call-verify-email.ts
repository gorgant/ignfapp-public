import * as functions from 'firebase-functions';
import { publicFirestore } from '../config/db-config';
import { PublicUser } from '../../../shared-models/user/public-user.model';
import { EmailVerificationData } from '../../../shared-models/email/email-verification-data';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { PrelaunchUser } from '../../../shared-models/user/prelaunch-user.model';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { currentEnvironmentType } from '../config/environments-config';
import { EmailCategories } from '../../../shared-models/email/email-vars.model';
import { createOrUpdateSgContact } from '../email/helpers/create-or-update-sg-contact';
import { EnvironmentTypes } from '../../../shared-models/environments/env-vars.model';
import { dispatchEmail } from '../email/helpers/dispatch-email';
import { ignfappPublicApp } from '../config/app-config';
import { UserRecord } from 'firebase-functions/v1/auth';
import { fetchAuthUserById } from '../config/global-helpers';
import { Timestamp } from '@google-cloud/firestore';;

// Trigger email send
const dispatchWelcomeEmail = async(userData: EmailUserData, emailVerificationData: EmailVerificationData) => {
  const emailCategory = emailVerificationData.isPrelaunchUser ? EmailCategories.PRELAUNCH_WELCOME : EmailCategories.ONBOARDING_GUIDE;
  await dispatchEmail(userData, emailCategory); // Dispatch the welcome email to the user
  await dispatchEmail(userData, EmailCategories.AUTO_NOTICE_NEW_USER_SIGNUP); // Alert the team that a user has signed up!
}

const verifyEmailAndUpdateUser = async (emailVerificationData: EmailVerificationData): Promise<boolean> => {

  const userCollectionPath: string = emailVerificationData.isPrelaunchUser ? PublicCollectionPaths.PRELAUNCH_USERS : PublicCollectionPaths.PUBLIC_USERS;

  const userDoc: FirebaseFirestore.DocumentSnapshot = await publicFirestore.collection(userCollectionPath).doc(emailVerificationData.userId).get()
    .catch(err => {functions.logger.log(`Error fetching user from public database:`, err); throw new functions.https.HttpsError('internal', err);});
  
  if (!userDoc.exists) {
    functions.logger.log('User does not exist');
    return false;
  }

  const userData: PublicUser | PrelaunchUser = userDoc.data() as PublicUser | PrelaunchUser;

  if (userData.id !== emailVerificationData.userId) {
    functions.logger.log('User id in payload does not match id in database');
    return false;
  }


  // Fetch auth data from Auth rather than FB database
  const userAuthData: UserRecord = await fetchAuthUserById(emailVerificationData.userId);

  if (userAuthData.emailVerified && userData.emailVerified) {
    functions.logger.log('User email already verified, no action taken')
    return true;
  }

  // Mark email verified in Firebase auth
  await ignfappPublicApp.auth().updateUser(userData.id, {emailVerified: true})
    .catch(err => {functions.logger.log(`Error updating user emailVerified in auth:`, err); throw new functions.https.HttpsError('internal', err);});

  functions.logger.log(`emailVerified marked TRUE in Auth`);

  const updateUserData: Partial<PublicUser | PrelaunchUser> = {
    emailVerified: true, // Adding to user record triggers user subscription on client, which provides easy trigger for user auth check
    emailOptInConfirmed: true,
    emailOptInTimestamp: Timestamp.now() as any,
    lastModifiedTimestamp: Timestamp.now() as any,
    emailSendgridContactCreatedTimestamp: userData.emailSendgridContactCreatedTimestamp ? userData.emailSendgridContactCreatedTimestamp : Timestamp.now() as any,
  };

  // Mark sub opted in on public database
  await publicFirestore.collection(userCollectionPath).doc(emailVerificationData.userId).update(updateUserData)
    .catch(err => {functions.logger.log(`Error updating user on public database:`, err); throw new functions.https.HttpsError('internal', err);});
  
  functions.logger.log(`Marked user "${emailVerificationData.userId}" as opted in and email verified`);
  
  // Provide complete user data to the email
  const emailUserData: EmailUserData = {
    ...userData,
    ...updateUserData
  }

  await dispatchWelcomeEmail(emailUserData, emailVerificationData);
  
  // Only run SG contact update in production
  if (currentEnvironmentType === EnvironmentTypes.PRODUCTION) {
    functions.logger.log('Production detected, creating SG contact from email verification');
    await createOrUpdateSgContact(emailUserData);
  }

  return true;

}

/////// DEPLOYABLE FUNCTIONS ///////

export const onCallVerifyEmail = functions.https.onCall( async (emailVerificationData: EmailVerificationData ): Promise<boolean> => {

  functions.logger.log('Verify email request received with this data', emailVerificationData);
  
  const emailVerified = await verifyEmailAndUpdateUser(emailVerificationData);

  return emailVerified;
});