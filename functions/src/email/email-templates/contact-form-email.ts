import { getSgMail } from "../config";
import { EmailSenderAddresses, EmailSenderNames, SendgridEmailTemplateIds, EmailCategories, AdminEmailAddresses } from "../../../../shared-models/email/email-vars.model";
import { currentEnvironmentType } from "../../config/environments-config";
import { EnvironmentTypes } from "../../../../shared-models/environments/env-vars.model";
import { MailDataRequired } from "@sendgrid/helpers/classes/mail";
import * as functions from 'firebase-functions';
import { ContactForm } from "../../../../shared-models/user/contact-form.model";


export const sendContactFormConfirmationEmail = async (contactForm: ContactForm) => {

  functions.logger.log('Sending Contact Form Confirmation Email to this user', contactForm.userData.email);

  const sgMail = getSgMail();
  const fromEmail = EmailSenderAddresses.IGNFAPP_DEFAULT;
  const fromName = EmailSenderNames.IGNFAPP_DEFAULT;
  const toFirstName = contactForm.userData.firstName;
  let toEmail: string;
  let bccEmail: string;
  const templateId = SendgridEmailTemplateIds.IGNFAPP_CONTACT_FORM_CONFIRMATION;
  let categories: string[];

  // Prevents test emails from going to the actual address used
  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      toEmail = contactForm.userData.email;
      categories = [EmailCategories.CONTACT_FORM_CONFIRMATION];
      bccEmail = AdminEmailAddresses.IGNFAPP_ADMIN;
      break;
    case EnvironmentTypes.SANDBOX:
      toEmail = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailCategories.CONTACT_FORM_CONFIRMATION, EmailCategories.TEST_SEND];
      bccEmail = '';
      break;
    default:
      toEmail = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailCategories.CONTACT_FORM_CONFIRMATION, EmailCategories.TEST_SEND];
      bccEmail = '';
      break;
  }

  const msg: MailDataRequired = {
    to: {
      email: toEmail,
      name: toFirstName
    },
    from: {
      email: fromEmail,
      name: fromName,
    },
    bcc: bccEmail,
    templateId,
    dynamicTemplateData: {
      firstName: toFirstName, // Will populate first name greeting if name exists
      contactFormMessage: contactForm.message, // Message sent by the user,
      replyEmailAddress: fromEmail
    },
    categories
  };
  await sgMail.send(msg)
    .catch(err => {functions.logger.log(`Error sending email: ${msg} because:`, err); throw new functions.https.HttpsError('internal', err);});

  functions.logger.log('Email sent', msg);
}