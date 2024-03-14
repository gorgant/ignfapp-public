import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getSgMail } from "../config";
import { EmailSenderAddresses, EmailSenderNames, SendgridEmailTemplateIds, EmailIdentifiers, AdminEmailAddresses } from "../../../../shared-models/email/email-vars.model";
import { currentEnvironmentType } from "../../config/environments-config";
import { EnvironmentTypes } from "../../../../shared-models/environments/env-vars.model";
import { MailDataRequired } from "@sendgrid/helpers/classes/mail";
import { ContactForm, ContactFormKeys } from "../../../../shared-models/user/contact-form.model";
import { EmailData } from "@sendgrid/helpers/classes/email-address";
import { PublicUserKeys } from '../../../../shared-models/user/public-user.model';


export const sendContactFormConfirmationEmail = async (contactForm: ContactForm) => {

  const sgMail = getSgMail();
  const fromEmail = EmailSenderAddresses.IGNFAPP_DEFAULT;
  const fromName = EmailSenderNames.IGNFAPP_DEFAULT;
  const toFirstName = contactForm[ContactFormKeys.SUBSCRIBER_DATA][PublicUserKeys.FIRST_NAME];
  const toEmail = contactForm[ContactFormKeys.SUBSCRIBER_DATA][PublicUserKeys.EMAIL];
  const contactFormMessage = contactForm[ContactFormKeys.MESSAGE];
  let recipientData: EmailData | EmailData[];
  let bccData: EmailData | EmailData[];
  const templateId = SendgridEmailTemplateIds.IGNFAPP_CONTACT_FORM_CONFIRMATION;
  let categories: string[];

  logger.log('Sending Contact Form Confirmation Email to:', toEmail);

  // Prevents test emails from going to the actual address used
  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      recipientData = [
        {
          email: toEmail,
          name: toFirstName
        }
      ];
      categories = [EmailIdentifiers.CONTACT_FORM_CONFIRMATION];
      bccData = AdminEmailAddresses.IGNFAPP_ADMIN;
      break;
    case EnvironmentTypes.SANDBOX:
      recipientData = AdminEmailAddresses.IGNFAPP_TEST_1;
      categories = [EmailIdentifiers.CONTACT_FORM_CONFIRMATION, EmailIdentifiers.TEST_SEND];
      bccData = '';
      break;
    default:
      recipientData = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailIdentifiers.CONTACT_FORM_CONFIRMATION, EmailIdentifiers.TEST_SEND];
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
      contactFormMessage: contactFormMessage, // Message sent by the user,
      replyEmailAddress: fromEmail
    },
    categories
  };
  await sgMail.send(msg)
    .catch(err => {logger.log(`Error sending email: ${msg} because:`, err); throw new HttpsError('internal', err);});

  logger.log('Email sent', msg);
}