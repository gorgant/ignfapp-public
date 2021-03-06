import { getSgMail } from "../config";
import { EmailSenderAddresses, EmailSenderNames, EmailCategories, AdminEmailAddresses } from "../../../../shared-models/email/email-vars.model";
import { currentEnvironmentType } from "../../config/environments-config";
import { EnvironmentTypes } from "../../../../shared-models/environments/env-vars.model";
import { MailDataRequired } from "@sendgrid/helpers/classes/mail";
import { WebpageLoadFailureData } from '../../../../shared-models/diagnostics/webpage-load-failure-data.model';
import * as functions from 'firebase-functions';
import { EmailData } from "@sendgrid/helpers/classes/email-address";


export const sendWebpageDataLoadFailureEmail = async (webpageLoadFailureData: WebpageLoadFailureData ) => {
  
  functions.logger.log('Sending Webpage Data Load Failure Email to admin');
  
  const sgMail = getSgMail();
  const fromEmail: string = EmailSenderAddresses.IGNFAPP_ADMIN;
  const fromName: string = EmailSenderNames.IGNFAPP_ADMIN;
  let recipientData: EmailData | EmailData[];  const subject: string = '[Automated Error Service] Webpage Data Load Failure';
  let categories: string[];
  const emailString: string = `Administrators, An error occurred when attempting to load a webpage. Domain: ${webpageLoadFailureData.domain}. Url Path: ${webpageLoadFailureData.urlPath}. Error Message: ${webpageLoadFailureData.errorMessage}. To fix the issue, consider deleting the webpageCache for that route in the public database and then manually loading the webpage. Good luck! Automated Error Service.`
  const emailHtml: string = `<p>Administrators,</p>\
    <p>An error occurred when attempting to load a webpage:</p>\
    <ul>\
      <li>Domain: ${webpageLoadFailureData.domain}</li>\
      <li>Url Path: ${webpageLoadFailureData.urlPath}</li>\
      <li>Error Message: ${webpageLoadFailureData.errorMessage}</li>\
    </ul>\
    <p>To fix the issue, consider deleting the webpageCache for that route in the public database and then manually loading the webpage.</p>\
    <p>Good luck!</p>\
    <p>Automated Error Service</p>\
    `
  
  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      recipientData = AdminEmailAddresses.IGNFAPP_GREG;
      categories = [EmailCategories.AUTO_NOTICE_WEBPAGE_DATA_LOAD_FAILURE];
      break;
    case EnvironmentTypes.SANDBOX:
      recipientData = AdminEmailAddresses.IGNFAPP_GREG;
      categories = [EmailCategories.AUTO_NOTICE_WEBPAGE_DATA_LOAD_FAILURE, EmailCategories.TEST_SEND];
      break;
    default:
      recipientData = AdminEmailAddresses.IGNFAPP_GREG;
      categories = [EmailCategories.AUTO_NOTICE_WEBPAGE_DATA_LOAD_FAILURE, EmailCategories.TEST_SEND];
      break;
  }

  const msg: MailDataRequired = {
    to: recipientData,
    from: {
      email: fromEmail,
      name: fromName,
    },
    subject,
    text: emailString,
    html: emailHtml,
    categories
  };
  await sgMail.send(msg)
    .catch(err => {functions.logger.log(`Error sending email: ${msg} because:`, err); throw new functions.https.HttpsError('internal', err);});

  functions.logger.log('Email sent', msg);
}