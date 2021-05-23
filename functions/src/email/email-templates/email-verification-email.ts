import { getSgMail, EmailWebsiteLinks } from "../config";
import { EmailSenderAddresses, EmailSenderNames, EmailCategories, SendgridEmailTemplateIds, AdminEmailAddresses } from "../../../../shared-models/email/email-vars.model";
import { currentEnvironmentType } from "../../config/environments-config";
import { EnvironmentTypes } from "../../../../shared-models/environments/env-vars.model";
import { MailDataRequired } from "@sendgrid/helpers/classes/mail";
import * as functions from 'firebase-functions';
import { EmailUserData } from "../../../../shared-models/email/email-user-data.model";
import { EmailData } from "@sendgrid/helpers/classes/email-address";


export const sendEmailVerificationEmail = async (userData: EmailUserData) => {
  
  functions.logger.log('Sending Email Verification Email to this user', userData.email);
  
  const sgMail = getSgMail();
  const fromEmail: string = EmailSenderAddresses.IGNFAPP_DEFAULT;
  const fromName: string = EmailSenderNames.IGNFAPP_DEFAULT;
  let recipientData: EmailData | EmailData[];
  let bccData: EmailData | EmailData[];
  const templateId: string = SendgridEmailTemplateIds.IGNFAPP_EMAIL_VERIFICATION;
  let categories: string[];
  // Add email, user ID, and prelaunchUser status for verification purposes
  const optInConfirmationUrl = `${EmailWebsiteLinks.EMAIL_VERIFICATION_URL_NO_PARAMS}/${userData.id}/${userData.email}/${userData.isPrelaunchUser ? userData.isPrelaunchUser : 'false'}`;
  
  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      recipientData = [
        {
          email: userData.email,
          name: userData.firstName
        }
      ];
      categories = [EmailCategories.EMAIL_VERIFICATION, EmailCategories.HEALTH_AND_FITNESS_NEWSLETTER];
      bccData = '';
      break;
    case EnvironmentTypes.SANDBOX:
      recipientData = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailCategories.EMAIL_VERIFICATION, EmailCategories.HEALTH_AND_FITNESS_NEWSLETTER, EmailCategories.TEST_SEND];
      bccData = '';
      break;
    default:
      recipientData = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailCategories.EMAIL_VERIFICATION, EmailCategories.HEALTH_AND_FITNESS_NEWSLETTER, EmailCategories.TEST_SEND];
      bccData = '';
      break;
  }

  const msg: MailDataRequired = {
    to: recipientData,
    from: {
      email: fromEmail,
      name: fromName,
    },
    bcc: bccData,
    templateId,
    dynamicTemplateData: {
      firstName: userData.firstName, // Will populate first name greeting if name exists
      optInConfirmationUrl // Unique to subscriber
    },
    categories
  };
  await sgMail.send(msg)
    .catch(err => {functions.logger.log(`Error sending email: ${msg} because:`, err); throw new functions.https.HttpsError('internal', err);});

  functions.logger.log('Email sent', msg);
}