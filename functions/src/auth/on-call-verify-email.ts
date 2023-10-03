import { logger } from 'firebase-functions/v2';
import { CallableOptions, CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { publicFirestore } from '../config/db-config';
import { PublicUser, PublicUserKeys } from '../../../shared-models/user/public-user.model';
import { EmailVerificationData } from '../../../shared-models/email/email-verification-data';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { currentEnvironmentType } from '../config/environments-config';
import { EmailIdentifiers } from '../../../shared-models/email/email-vars.model';
import { createOrUpdateSgContact } from '../email/helpers/create-or-update-sg-contact';
import { EnvironmentTypes } from '../../../shared-models/environments/env-vars.model';
import { dispatchEmail } from '../email/helpers/dispatch-email';
import { UserRecord } from 'firebase-functions/v1/auth';
import { fetchAuthUserById } from '../config/global-helpers';
import { Timestamp } from '@google-cloud/firestore';
import { getAuth } from 'firebase-admin/auth';
import { publicAppFirebaseInstance } from '../config/app-config';
import { SgCreateOrUpdateContactData } from '../../../shared-models/email/sg-create-or-update-contact-data.model';

// Trigger email send
const dispatchWelcomeEmail = async(userData: EmailUserData) => {
  const emailCategory = EmailIdentifiers.ONBOARDING_WELCOME;
  await dispatchEmail(userData, emailCategory); // Dispatch the welcome email to the user
  await dispatchEmail(userData, EmailIdentifiers.AUTO_NOTICE_NEW_USER_SIGNUP); // Alert the team that a user has signed up!
}

const verifyEmailAndUpdateUser = async (emailVerificationData: EmailVerificationData): Promise<boolean> => {

  const userCollectionPath: string = PublicCollectionPaths.PUBLIC_USERS;

  const userDoc: FirebaseFirestore.DocumentSnapshot = await publicFirestore.collection(userCollectionPath).doc(emailVerificationData.userId).get()
    .catch(err => {logger.log(`Error fetching user from public database:`, err); throw new HttpsError('internal', err);});
  
  if (!userDoc.exists) {
    logger.log('User does not exist');
    return false;
  }

  // Verify user exists in DB
  const userDataInDb: PublicUser = userDoc.data() as PublicUser;
  if (userDataInDb.id !== emailVerificationData.userId) {
    logger.log('User id in payload does not match id in database');
    return false;
  }

  // Verify user exists in Auth
  const userDataInAuth: UserRecord = await fetchAuthUserById(emailVerificationData.userId);
  if (!userDataInAuth) {
    logger.log('User id in payload does not match id in auth');
    return false;
  }

  if (userDataInAuth.emailVerified && userDataInDb.emailVerified) {
    logger.log('User email already verified, no action taken')
    return true;
  }

  // Mark email verified in Firebase auth
  await getAuth(publicAppFirebaseInstance).updateUser(userDataInDb.id, {emailVerified: true})
    .catch(err => {logger.log(`Error updating user emailVerified in auth:`, err); throw new HttpsError('internal', err);});

  logger.log(`Email marked verified in auth`);

  const updatedUserData: Partial<PublicUser> = {
    emailVerified: true, // Adding to user record triggers user subscription on client, which provides easy trigger for user auth check
    emailOptInConfirmed: true,
    emailOptInTimestamp: Timestamp.now() as any,
    lastModifiedTimestamp: Timestamp.now() as any,
    emailSendgridContactCreatedTimestamp: userDataInDb.emailSendgridContactCreatedTimestamp ? userDataInDb.emailSendgridContactCreatedTimestamp : Timestamp.now() as any,
  };

  // Mark sub opted in on public database
  await publicFirestore.collection(userCollectionPath).doc(emailVerificationData.userId).update(updatedUserData)
    .catch(err => {logger.log(`Error updating user on public database:`, err); throw new HttpsError('internal', err);});
  
  logger.log(`Marked user "${emailVerificationData.userId}" as opted in and email verified`);
  
  // Provide complete user data to the email
  const emailUserData: EmailUserData = {
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

  await dispatchWelcomeEmail(emailUserData);
  
  // Only run SG contact update in production
  if (currentEnvironmentType === EnvironmentTypes.PRODUCTION) {
    logger.log('Production detected, creating SG contact from email verification');
    const sgCreateOrUpdateContactData: SgCreateOrUpdateContactData = {
      emailUserData,
      isNewContact: true,
    };
    await createOrUpdateSgContact(sgCreateOrUpdateContactData);
  }

  return true;

}

/////// DEPLOYABLE FUNCTIONS ///////
const callableOptions: CallableOptions = {
  enforceAppCheck: true
};

export const onCallVerifyEmail = onCall(callableOptions, async (request: CallableRequest<EmailVerificationData>): Promise<boolean> => {
  const emailVerificationData = request.data;
  logger.log('Verify email request received with this data', emailVerificationData);
  
  const emailVerified = await verifyEmailAndUpdateUser(emailVerificationData);

  return emailVerified;
});