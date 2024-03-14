import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getSgMail, EmailWebsiteLinks } from "../config";
import { EmailSenderAddresses, EmailSenderNames, EmailIdentifiers, SendgridEmailTemplateIds, AdminEmailAddresses } from "../../../../shared-models/email/email-vars.model";
import { currentEnvironmentType } from "../../config/environments-config";
import { EnvironmentTypes } from "../../../../shared-models/environments/env-vars.model";
import { MailDataRequired } from "@sendgrid/helpers/classes/mail";
import { EmailUserData } from "../../../../shared-models/email/email-user-data.model";
import { EmailData } from "@sendgrid/helpers/classes/email-address";
import { EmailVerificationUrlParamKeys } from '../../../../shared-models/email/email-verification-data';
import { PublicUserKeys } from '../../../../shared-models/user/public-user.model';


export const sendEmailVerificationEmail = async (userData: EmailUserData) => {
  const sgMail = getSgMail();
  const fromEmail = EmailSenderAddresses.IGNFAPP_DEFAULT;
  const fromName = EmailSenderNames.IGNFAPP_DEFAULT;
  const toFirstName = userData[PublicUserKeys.FIRST_NAME];
  const toEmail = userData[PublicUserKeys.EMAIL];
  let recipientData: EmailData | EmailData[];
  let bccData: EmailData | EmailData[];
  const templateId: string = SendgridEmailTemplateIds.IGNFAPP_EMAIL_VERIFICATION;
  let categories: string[];
  
  logger.log('Sending Email Verification Email to this user', toEmail);
  
  // Add email, user ID, and other params for verification purposes
  const urlBuilder = new URL(EmailWebsiteLinks.EMAIL_VERIFICATION_URL_NO_PARAMS);
  urlBuilder.searchParams.append(EmailVerificationUrlParamKeys.USER_ID, userData[PublicUserKeys.ID]);
  urlBuilder.searchParams.append(EmailVerificationUrlParamKeys.EMAIL, userData[PublicUserKeys.EMAIL]);
  const optInConfirmationUrl = urlBuilder.href;

  logger.log('Producing this verification url', optInConfirmationUrl);
  
  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      recipientData = [
        {
          email: toEmail,
          name: toFirstName
        }
      ];
      categories = [EmailIdentifiers.EMAIL_VERIFICATION];
      bccData = '';
      break;
    case EnvironmentTypes.SANDBOX:
      recipientData = AdminEmailAddresses.IGNFAPP_TEST_1;
      categories = [EmailIdentifiers.EMAIL_VERIFICATION, EmailIdentifiers.TEST_SEND];
      bccData = '';
      break;
    default:
      recipientData = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailIdentifiers.EMAIL_VERIFICATION, EmailIdentifiers.TEST_SEND];
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
      firstName: toFirstName, // Will populate first name greeting if name exists
      optInConfirmationUrl // Unique to subscriber
    },
    categories
  };
  await sgMail.send(msg)
    .catch(err => {logger.log(`Error sending email: ${msg} because:`, err); throw new HttpsError('internal', err);});

  logger.log('Email sent', msg);
}