import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getSgMail } from "../config";
import { EmailSenderAddresses, EmailSenderNames, EmailIdentifiers, AdminEmailAddresses } from "../../../../shared-models/email/email-vars.model";
import { currentEnvironmentType } from "../../config/environments-config";
import { EnvironmentTypes } from "../../../../shared-models/environments/env-vars.model";
import { MailDataRequired } from "@sendgrid/helpers/classes/mail";

import { EmailData } from "@sendgrid/helpers/classes/email-address";
import { OptInCountComparisonData } from '../../../../shared-models/email/opt-in-count-comparison-data';


export const sendOptInMismatchEmail = async (optInComparisonData: OptInCountComparisonData ) => {
  
  logger.log('Sending Opt In Count Mismatch Email to admin');
  
  const sgMail = getSgMail();
  const fromEmail: string = EmailSenderAddresses.IGNFAPP_ADMIN;
  const fromName: string = EmailSenderNames.IGNFAPP_ADMIN;
  let recipientData: EmailData | EmailData[];
  const subject: string = '[Automated Error Service] Opt In Count Mismatch';
  let categories: string[];
  const emailString: string = `Administrators, There is a mismatch between contacts on Sendgrid and opt-in users in the app database. Sendgrid Opt In Count: ${optInComparisonData.sgOptInCount}, Sendgrid Opt Out Count: ${optInComparisonData.sgOptOutCount}, Database Opt In Count: ${optInComparisonData.databaseOptInCount}, Database Opt Out Count: ${optInComparisonData.databaseOptOutCount}. To fix the issue, consider exporting both databases and reconciling the difference.`
  const emailHtml: string = `<p>Administrators,</p>\
    <p>There is a mismatch between contacts on Sendgrid and opt-in users in the app database:</p>\
    <ul>\
      <li>Sendgrid Opt In Count: ${optInComparisonData.sgOptInCount}</li>\
      <li>Sendgrid Opt Out Count: ${optInComparisonData.sgOptOutCount}</li>\
      <li>Database Opt In Count: ${optInComparisonData.databaseOptInCount}</li>\
      <li>Database Opt Out Count: ${optInComparisonData.databaseOptOutCount}</li>\
    </ul>\
    <p>To fix the issue, consider exporting both databases and reconciling the difference.</p>\
    <p>Good luck!</p>\
    <p>Automated Error Service</p>\
    `
  
  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      recipientData = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailIdentifiers.AUTO_NOTICE_OPT_IN_MISMATCH];
      break;
    case EnvironmentTypes.SANDBOX:
      recipientData = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailIdentifiers.AUTO_NOTICE_OPT_IN_MISMATCH, EmailIdentifiers.TEST_SEND];
      break;
    default:
      recipientData = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailIdentifiers.AUTO_NOTICE_OPT_IN_MISMATCH, EmailIdentifiers.TEST_SEND];
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
    .catch(err => {logger.log(`Error sending email: ${msg} because:`, err); throw new HttpsError('internal', err);});

  logger.log('Email sent', msg);
}