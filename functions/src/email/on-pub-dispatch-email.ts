import { HttpsError } from 'firebase-functions/v2/https';
import { CloudEvent, logger } from 'firebase-functions/v2';
import { EmailPubMessage } from '../../../shared-models/email/email-pub-message.model';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { EmailIdentifiers } from '../../../shared-models/email/email-vars.model';
import { EmailLogEntry } from '../../../shared-models/email/email-log-entry.model';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';
import { sendOnboardingWelcomeEmail } from './email-templates/onboarding-welcome-email';
import { sendEmailVerificationEmail } from './email-templates/email-verification-email';
import { sendContactFormConfirmationEmail } from './email-templates/contact-form-email';
import { sendNewUserDetectedEmail } from './email-templates/new-user-detected-email';
import { publicFirestore } from '../config/db-config';
import { Timestamp } from '@google-cloud/firestore';
import { MessagePublishedData, PubSubOptions, onMessagePublished } from 'firebase-functions/v2/pubsub';
import { sendgridApiSecret } from '../config/api-key-config';
import { sendUpdateEmailConfirmationEmail } from './email-templates/update-email-confirmation-email';

// Store the email record in the database
const addEmailLogEntry = async (emailData: EmailPubMessage) => {
  
  if (!emailData.userData) {
    logger.log(`No user data provided, skipping email log entry`);
    return;
  }

  const autoNoticeString = 'auto-notice';
  if (emailData.emailIdentifier.includes(autoNoticeString)) {
    logger.log(`"${autoNoticeString}" detected in email category, skipping email log entry`);
    return;
  }

  const emailLogEntry: EmailLogEntry = {
    emailCategory: emailData.emailIdentifier,
    recipientEmail: emailData.userData.email,
    recipientId: emailData.userData.id,
    sentTimestamp: Timestamp.now() as any,
  }

  await publicFirestore.collection(PublicCollectionPaths.EMAIL_LOG).doc().set(emailLogEntry);
}

const executeActions = async (emailData: EmailPubMessage) => {

  if (!emailData.emailIdentifier) {
    const errMsg: string = `No email category found in pubsub message`;
    logger.log(errMsg);
    throw new HttpsError('internal', errMsg);
  }

  const emailIdentifier = emailData.emailIdentifier;

  switch(emailIdentifier) {
    
    case EmailIdentifiers.AUTO_NOTICE_NEW_USER_SIGNUP:
        if (!emailData.userData) {
          const errMsg: string = `No user data provided, failed to send ${EmailIdentifiers.AUTO_NOTICE_NEW_USER_SIGNUP} email`;
          logger.log(errMsg);
          throw new HttpsError('internal', errMsg);
        }
        return sendNewUserDetectedEmail(emailData.userData);
    
    case EmailIdentifiers.CONTACT_FORM_CONFIRMATION:
      if (!emailData.contactForm) {
        const errMsg: string = `No contact form provided, failed to send ${EmailIdentifiers.CONTACT_FORM_CONFIRMATION} email`;
        logger.log(errMsg);
        throw new HttpsError('internal', errMsg);
      }
      return sendContactFormConfirmationEmail(emailData.contactForm);

    case EmailIdentifiers.EMAIL_VERIFICATION:
      if (!emailData.userData) {
        const errMsg: string = `No user data provided, failed to send ${EmailIdentifiers.EMAIL_VERIFICATION} email`;
        logger.log(errMsg);
        throw new HttpsError('internal', errMsg);
      }
      return sendEmailVerificationEmail(emailData.userData);
    
    case EmailIdentifiers.ONBOARDING_WELCOME:
      if (!emailData.userData) {
        const errMsg: string = `No user data provided, failed to send ${EmailIdentifiers.ONBOARDING_WELCOME} email`;
        logger.log(errMsg);
        throw new HttpsError('internal', errMsg);
      }
      return sendOnboardingWelcomeEmail(emailData.userData);

    case EmailIdentifiers.UPDATE_EMAIL_CONFIRMATION:
      if (!emailData.userData) {
        const errMsg: string = `No user data provided, failed to send ${EmailIdentifiers.UPDATE_EMAIL_CONFIRMATION} email`;
        logger.log(errMsg);
        throw new HttpsError('internal', errMsg);
      }
      return sendUpdateEmailConfirmationEmail(emailData.userData);
    
    default:
      const defaultErrorMsg: string = `No matching email category for ${emailIdentifier}`;
      logger.log(defaultErrorMsg);
      throw new HttpsError('internal', defaultErrorMsg);
  }

  

}

/////// DEPLOYABLE FUNCTIONS ///////
const pubSubOptions: PubSubOptions = {
  topic: PublicTopicNames.DISPATCH_EMAIL_TOPIC,
  secrets: [sendgridApiSecret]
};

// Listen for pubsub message
export const onPubDispatchEmail = onMessagePublished(pubSubOptions, async (event: CloudEvent<MessagePublishedData<EmailPubMessage>>) => {
  const emailData = event.data.message.json;
  logger.log(`${PublicTopicNames.DISPATCH_EMAIL_TOPIC} requested with this data:`, emailData);

  await executeActions(emailData);
  await addEmailLogEntry(emailData);

});
