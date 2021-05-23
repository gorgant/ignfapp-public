import * as functions from 'firebase-functions';
import { EmailPubMessage } from '../../../shared-models/email/email-pub-message.model';
import { PublicTopicNames } from '../../../shared-models/routes-and-paths/fb-function-names.model';
import { sendOnboardingWelcomeEmail } from './email-templates/onboarding-welcome-email';
import { EmailCategories } from '../../../shared-models/email/email-vars.model';
import { sendEmailVerificationEmail } from './email-templates/email-verification-email';
import { sendContactFormConfirmationEmail } from './email-templates/contact-form-email';
import { sendWebpageDataLoadFailureEmail } from './email-templates/webpage-data-load-failure-email';
import { sendPrelaunchWelcomeEmail } from './email-templates/prelaunch-welcome-email';

const executeActions = async (emailData: EmailPubMessage) => {

  if (!emailData.emailCategory) {
    const errMsg: string = `No email category found in pubsub message`;
    functions.logger.log(errMsg);
    throw new functions.https.HttpsError('internal', errMsg);
  }

  const emailCategory = emailData.emailCategory;

  switch(emailCategory) {
    case EmailCategories.EMAIL_VERIFICATION:
      if (!emailData.userData) {
        const errMsg: string = `No user data in message`
        functions.logger.log(errMsg);
        throw new functions.https.HttpsError('internal', errMsg);
      }
      return sendEmailVerificationEmail(emailData.userData);
    case EmailCategories.PRELAUNCH_WELCOME:
      if (!emailData.userData) {
        const errMsg: string = `No user data in message`;
        functions.logger.log(errMsg);
        throw new functions.https.HttpsError('internal', errMsg);
      }
      return sendPrelaunchWelcomeEmail(emailData.userData);
    case EmailCategories.ONBOARDING_GUIDE:
      if (!emailData.userData) {
        const errMsg: string = `No user data in message`;
        functions.logger.log(errMsg);
        throw new functions.https.HttpsError('internal', errMsg);
      }
      return sendOnboardingWelcomeEmail(emailData.userData);
    case EmailCategories.CONTACT_FORM_CONFIRMATION:
      if (!emailData.contactForm) {
        const errMsg: string = `No contact form provided, failed to send contact form confirmation`
        functions.logger.log(errMsg);
        throw new functions.https.HttpsError('internal', errMsg);
      }
      return sendContactFormConfirmationEmail(emailData.contactForm);
    case EmailCategories.WEBPAGE_DATA_LOAD_FAILURE:
      if (!emailData.webpageLoadFailureData) {
        const errMsg: string = `No webpage load failiure data provided, failed to send webpageDataLoadFailure email;`
        functions.logger.log(errMsg);
        throw new functions.https.HttpsError('internal', errMsg);
      }
      return sendWebpageDataLoadFailureEmail(emailData.webpageLoadFailureData);
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

  return executeActions(emailData);

});
