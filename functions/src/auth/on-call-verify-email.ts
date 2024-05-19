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
import { convertPublicUserDataToEmailUserData } from '../config/global-helpers';
import { Timestamp } from '@google-cloud/firestore';
import { SgCreateOrUpdateContactData } from '../../../shared-models/email/sg-create-or-update-contact-data.model';
import { EmailPubMessage } from '../../../shared-models/email/email-pub-message.model';
import { getAuth } from 'firebase-admin/auth';
import { publicAppFirebaseInstance } from '../config/app-config';

// Trigger email send
const dispatchWelcomeEmail = async(userData: EmailUserData) => {
  const welcomEmailPubMessage: EmailPubMessage = {
    emailUserData: userData,
    emailIdentifier: EmailIdentifiers.ONBOARDING_WELCOME
  };
  const newUserAutoNoticePubMessage: EmailPubMessage = {
    emailUserData: userData,
    emailIdentifier: EmailIdentifiers.AUTO_NOTICE_NEW_USER_SIGNUP
  };
  await dispatchEmail(welcomEmailPubMessage); // Dispatch the welcome email to the user
  await dispatchEmail(newUserAutoNoticePubMessage); // Alert the team that a user has signed up!
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

  if (userDataInDb.emailVerified) {
    logger.log('User email already verified, no action taken')
    return true;
  }

  const updatedUserData: Partial<PublicUser> = {
    [PublicUserKeys.EMAIL_VERIFIED]: true, // Adding to user record triggers user subscription on client, which provides easy trigger for user auth check
    [PublicUserKeys.EMAIL_OPT_IN_CONFIRMED]: true,
    [PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP]: Timestamp.now() as any,
    [PublicUserKeys.LAST_MODIFIED_TIMESTAMP]: Timestamp.now() as any,
    [PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP]: userDataInDb[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP] ? userDataInDb[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP] : Timestamp.now() as any,
  };

  // Mark sub opted in on public database
  await publicFirestore.collection(userCollectionPath).doc(emailVerificationData.userId).update(updatedUserData)
    .catch(err => {logger.log(`Error updating user on public database:`, err); throw new HttpsError('internal', err);});
  
  logger.log(`Marked user "${emailVerificationData.userId}" as opted in and email verified`);

  // Mark email verified in auth (required for email sign ups)
  await getAuth(publicAppFirebaseInstance).updateUser(userDataInDb.id, {emailVerified: true})
    .catch(err => {logger.log(`Error updating emailVerified in auth:`, err); throw new HttpsError('internal', err);});
  
  // Provide complete user data to the email
  const emailUserData = {
    ...convertPublicUserDataToEmailUserData(userDataInDb),
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
  logger.log('onCallVerifyEmail requested with this data', emailVerificationData);
  
  const emailVerified = await verifyEmailAndUpdateUser(emailVerificationData);

  return emailVerified;
});