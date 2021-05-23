import { getSgMail } from "../config";
import { EmailSenderAddresses, EmailSenderNames, EmailCategories, AdminEmailAddresses } from "../../../../shared-models/email/email-vars.model";
import { currentEnvironmentType } from "../../config/environments-config";
import { EnvironmentTypes } from "../../../../shared-models/environments/env-vars.model";
import { MailDataRequired } from "@sendgrid/helpers/classes/mail";
import * as functions from 'firebase-functions';
import { SubCountMatchData } from "../../../../shared-models/email/sub-count-match-data";


export const sendSubCountMismatchEmail = async (countMatchData: SubCountMatchData ) => {
  
  functions.logger.log('Sending Subscriber Count Mismatch Email to admin');
  
  const sgMail = getSgMail();
  const fromEmail: string = EmailSenderAddresses.IGNFAPP_ADMIN;
  const fromName: string = EmailSenderNames.IGNFAPP_ADMIN;
  const toFirstName: string = 'Administrator';
  let toEmail: string;
  const subject: string = '[Automated Error Service] Subscriber Count Mismatch';
  let categories: string[];
  const emailString: string = `Administrators, There is a mismatch between contacts on Sendgrid and subscribed users in the app database. Sendgrid Count: ${countMatchData.sendGridSubCount}. Database Count: ${countMatchData.databaseSubCount}. Database OptOut Count: ${countMatchData.databaseUnsubCount}. To fix the issue, consider exporting both databases and reconciling the difference.`
  const emailHtml: string = `<p>Administrators,</p>\
    <p>There is a mismatch between contacts on Sendgrid and subscribed users in the app database:</p>\
    <ul>\
      <li>Sendgrid Count: ${countMatchData.sendGridSubCount}</li>\
      <li>Database Count: ${countMatchData.databaseSubCount}</li>\
      <li>Database OptOut Count: ${countMatchData.databaseUnsubCount}</li>\
    </ul>\
    <p>To fix the issue, consider exporting both databases and reconciling the difference.</p>\
    <p>Good luck!</p>\
    <p>Automated Error Service</p>\
    `
  
  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      toEmail = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailCategories.SUBSCRIBER_COUNT_MISMATCH];
      break;
    case EnvironmentTypes.SANDBOX:
      toEmail = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailCategories.SUBSCRIBER_COUNT_MISMATCH, EmailCategories.TEST_SEND];
      break;
    default:
      toEmail = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailCategories.SUBSCRIBER_COUNT_MISMATCH, EmailCategories.TEST_SEND];
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
    subject,
    text: emailString,
    html: emailHtml,
    categories
  };
  await sgMail.send(msg)
    .catch(err => {functions.logger.log(`Error sending email: ${msg} because:`, err); throw new functions.https.HttpsError('internal', err);});

  functions.logger.log('Email sent', msg);
}