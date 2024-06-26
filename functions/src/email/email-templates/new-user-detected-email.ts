import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getSgMail } from "../config";
import { EmailSenderAddresses, EmailSenderNames, EmailIdentifiers, AdminEmailAddresses } from "../../../../shared-models/email/email-vars.model";
import { currentEnvironmentType } from "../../config/environments-config";
import { EnvironmentTypes } from "../../../../shared-models/environments/env-vars.model";
import { MailDataRequired } from "@sendgrid/helpers/classes/mail";

import { EmailUserData } from "../../../../shared-models/email/email-user-data.model";
import { EmailData } from "@sendgrid/helpers/classes/email-address";
import { PublicUserKeys } from '../../../../shared-models/user/public-user.model';


export const sendNewUserDetectedEmail = async (newUserData: EmailUserData ) => {
  
  
  
  const sgMail = getSgMail();
  const fromEmail: string = EmailSenderAddresses.IGNFAPP_ADMIN;
  const fromName: string = EmailSenderNames.IGNFAPP_ADMIN;
  let recipientData: EmailData | EmailData[];
  const subject: string = 'We Got a New User!';
  let categories: string[];
  const emailString: string = `Hey Team, Guess what? A new user just signed up! First Name: ${newUserData[PublicUserKeys.FIRST_NAME]}. Email: ${newUserData[PublicUserKeys.EMAIL]}. Uid: ${newUserData[PublicUserKeys.ID]}. Keep up the good work! Automated Notification Service`
  const emailHtml: string = `<p>Hey Team,</p>\
    <p>Guess what? A new user just signed up!</p>\
    <ul>\
      <li>Name: ${newUserData[PublicUserKeys.FIRST_NAME]}</li>\
      <li>Email: ${newUserData[PublicUserKeys.EMAIL]}</li>\
      <li>Uid: ${newUserData[PublicUserKeys.ID]}</li>\
    </ul>\
    <p>Keep up the good work!</p>\
    <p>Automated Notification Service</p>\
    `
  logger.log(`Sending Prelaunch Signup Detected Email for ${newUserData[PublicUserKeys.EMAIL]} to admin`);
  
  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      recipientData = [
        {
          email: AdminEmailAddresses.IGNFAPP_GREG,
          name: 'Greg'
        },
        {
          email: AdminEmailAddresses.IGNFAPP_MD,
          name: 'MD'
        }
      ];
      categories = [EmailIdentifiers.AUTO_NOTICE_NEW_USER_SIGNUP];
      break;
    case EnvironmentTypes.SANDBOX:
      recipientData = [
        {
          email: AdminEmailAddresses.IGNFAPP_GREG,
          name: 'Greg'
        }
      ]
      categories = [EmailIdentifiers.AUTO_NOTICE_NEW_USER_SIGNUP, EmailIdentifiers.TEST_SEND];
      break;
    default:
      recipientData = [
        {
          email: AdminEmailAddresses.IGNFAPP_GREG,
          name: 'Greg'
        }
      ]
      categories = [EmailIdentifiers.AUTO_NOTICE_NEW_USER_SIGNUP, EmailIdentifiers.TEST_SEND];
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