import { getSgMail } from "../config";
import { EmailSenderAddresses, EmailSenderNames, EmailCategories, AdminEmailAddresses } from "../../../../shared-models/email/email-vars.model";
import { currentEnvironmentType } from "../../config/environments-config";
import { EnvironmentTypes } from "../../../../shared-models/environments/env-vars.model";
import { MailDataRequired } from "@sendgrid/helpers/classes/mail";
import * as functions from 'firebase-functions';
import { EmailUserData } from "../../../../shared-models/email/email-user-data.model";
import { EmailData } from "@sendgrid/helpers/classes/email-address";


export const sendNewUserDetectedEmail = async (newUserData: EmailUserData ) => {
  
  functions.logger.log('Sending Prelaunch Signup Detected Email to admin');
  
  const sgMail = getSgMail();
  const fromEmail: string = EmailSenderAddresses.IGNFAPP_ADMIN;
  const fromName: string = EmailSenderNames.IGNFAPP_ADMIN;
  let recipientData: EmailData | EmailData[];
  const subject: string = 'We Got a New User!';
  let categories: string[];
  const emailString: string = `Hey Team, Guess what? A new user just signed up! First Name: ${newUserData.firstName}. Email: ${newUserData.email}. Uid: ${newUserData.id}. Keep up the good work! Automated Notification Service`
  const emailHtml: string = `<p>Hey Team,</p>\
    <p>Guess what? A new user just signed up!</p>\
    <ul>\
      <li>Name: ${newUserData.firstName}</li>\
      <li>Email: ${newUserData.email}</li>\
      <li>Uid: ${newUserData.id}</li>\
    </ul>\
    <p>Keep up the good work!</p>\
    <p>Automated Notification Service</p>\
    `
  
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
      categories = [EmailCategories.AUTO_NOTICE_NEW_USER_SIGNUP];
      break;
    case EnvironmentTypes.SANDBOX:
      recipientData = [
        {
          email: AdminEmailAddresses.IGNFAPP_GREG,
          name: 'Greg'
        }
      ]
      categories = [EmailCategories.AUTO_NOTICE_NEW_USER_SIGNUP, EmailCategories.TEST_SEND];
      break;
    default:
      recipientData = [
        {
          email: AdminEmailAddresses.IGNFAPP_GREG,
          name: 'Greg'
        }
      ]
      categories = [EmailCategories.AUTO_NOTICE_NEW_USER_SIGNUP, EmailCategories.TEST_SEND];
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