import * as functions from 'firebase-functions';
import { EmailPubMessage } from '../../../shared-models/email/email-pub-message.model';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { EmailCategories } from '../../../shared-models/email/email-vars.model';
import { EmailLogEntry } from '../../../shared-models/email/email-log-entry.model';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { sendOnboardingWelcomeEmail } from './email-templates/onboarding-welcome-email';
import { sendEmailVerificationEmail } from './email-templates/email-verification-email';
import { sendContactFormConfirmationEmail } from './email-templates/contact-form-email';
import { sendWebpageDataLoadFailureEmail } from './email-templates/webpage-data-load-failure-email';
import { sendPrelaunchWelcomeEmail } from './email-templates/prelaunch-welcome-email';
import { sendNewUserDetectedEmail } from './email-templates/new-user-detected-email';
import { publicFirestore } from '../config/db-config';
import { DateTime } from 'luxon';

// Store the email record in the database
const addEmailLogEntry = async (emailData: EmailPubMessage) => {
  
  if (!emailData.userData) {
    functions.logger.log(`No user data provided, skipping email log entry`);
    return;
  }

  const autoNoticeString = 'auto-notice';
  if (emailData.emailCategory.includes(autoNoticeString)) {
    functions.logger.log(`"${autoNoticeString}" detected in email category, skipping email log entry`);
    return;
  }

  const emailLogEntry: EmailLogEntry = {
    emailCategory: emailData.emailCategory,
    recipientEmail: emailData.userData.email,
    recipientId: emailData.userData.id,
    sentTimestamp: DateTime.now().toMillis()
  }

  await publicFirestore.collection(PublicCollectionPaths.EMAIL_LOG).doc().set(emailLogEntry);
}

const executeActions = async (emailData: EmailPubMessage) => {

  if (!emailData.emailCategory) {
    const errMsg: string = `No email category found in pubsub message`;
    functions.logger.log(errMsg);
    throw new functions.https.HttpsError('internal', errMsg);
  }

  const emailCategory = emailData.emailCategory;

  switch(emailCategory) {
    
    case EmailCategories.AUTO_NOTICE_NEW_USER_SIGNUP:
        if (!emailData.userData) {
          const errMsg: string = `No user data provided, failed to send ${EmailCategories.AUTO_NOTICE_NEW_USER_SIGNUP} email`;
          functions.logger.log(errMsg);
          throw new functions.https.HttpsError('internal', errMsg);
        }
        return sendNewUserDetectedEmail(emailData.userData);
    
    case EmailCategories.AUTO_NOTICE_WEBPAGE_DATA_LOAD_FAILURE:
      if (!emailData.webpageLoadFailureData) {
        const errMsg: string = `No webpage load failiure data provided, failed to send ${EmailCategories.AUTO_NOTICE_WEBPAGE_DATA_LOAD_FAILURE} email`;
        functions.logger.log(errMsg);
        throw new functions.https.HttpsError('internal', errMsg);
      }
      return sendWebpageDataLoadFailureEmail(emailData.webpageLoadFailureData);
    
    case EmailCategories.CONTACT_FORM_CONFIRMATION:
      if (!emailData.contactForm) {
        const errMsg: string = `No contact form provided, failed to send ${EmailCategories.CONTACT_FORM_CONFIRMATION} email`;
        functions.logger.log(errMsg);
        throw new functions.https.HttpsError('internal', errMsg);
      }
      return sendContactFormConfirmationEmail(emailData.contactForm);

    case EmailCategories.EMAIL_VERIFICATION:
      if (!emailData.userData) {
        const errMsg: string = `No user data provided, failed to send ${EmailCategories.EMAIL_VERIFICATION} email`;
        functions.logger.log(errMsg);
        throw new functions.https.HttpsError('internal', errMsg);
      }
      return sendEmailVerificationEmail(emailData.userData);
    
    case EmailCategories.ONBOARDING_GUIDE:
      if (!emailData.userData) {
        const errMsg: string = `No user data provided, failed to send ${EmailCategories.ONBOARDING_GUIDE} email`;
        functions.logger.log(errMsg);
        throw new functions.https.HttpsError('internal', errMsg);
      }
      return sendOnboardingWelcomeEmail(emailData.userData);
    
    case EmailCategories.PRELAUNCH_WELCOME:
      if (!emailData.userData) {
        const errMsg: string = `No user data provided, failed to send ${EmailCategories.PRELAUNCH_WELCOME} email`;
        functions.logger.log(errMsg);
        throw new functions.https.HttpsError('internal', errMsg);
      }
      return sendPrelaunchWelcomeEmail(emailData.userData);
    
    default:
      const defaultErrorMsg: string = `No matching email category for ${emailCategory}`;
      functions.logger.log(defaultErrorMsg);
      throw new functions.https.HttpsError('internal', defaultErrorMsg);
  }

  

}

/////// DEPLOYABLE FUNCTIONS ///////

// Listen for pubsub message
export const onPubDispatchEmail = functions.pubsub.topic(PublicTopicNames.DISPATCH_EMAIL_TOPIC).onPublish( async (message, context) => {
  const emailData = message.json as EmailPubMessage;
  functions.logger.log('Trigger email request received with this data:', emailData);
  functions.logger.log('Context from pubsub:', context);

  await executeActions(emailData);
  await addEmailLogEntry(emailData);

});
