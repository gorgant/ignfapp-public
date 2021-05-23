
import { getSgMail } from "../config";
import { EmailSenderAddresses, EmailSenderNames, EmailCategories, SendgridEmailTemplateIds, SendgridEmailUnsubscribeGroupIds, AdminEmailAddresses } from "../../../../shared-models/email/email-vars.model";
import { currentEnvironmentType } from "../../config/environments-config";
import { EnvironmentTypes } from "../../../../shared-models/environments/env-vars.model";
import { MailDataRequired } from "@sendgrid/helpers/classes/mail";
import * as functions from 'firebase-functions';
import { EmailUserData } from "../../../../shared-models/email/email-user-data.model";
import { PublicCollectionPaths } from "../../../../shared-models/routes-and-paths/fb-collection-paths.model";
import { publicFirestore } from "../../config/db-config";
import { EmailData } from "@sendgrid/helpers/classes/email-address";

const db = publicFirestore;

const markIntroEmailSent = async (userData: EmailUserData) => {

  const onboardingWelcomeEmailSent: Partial<EmailUserData> = {
    onboardingWelcomeEmailSent: true
  }

  const fbRes = await db.collection(PublicCollectionPaths.PUBLIC_USERS).doc(userData.id).update(onboardingWelcomeEmailSent)
    .catch(err => {functions.logger.log(`Failed to update subscriber data in public database`, err); return err;});

  functions.logger.log('Marked onboardingWelcomeEmailSent true', fbRes);
  return fbRes;
}

export const sendOnboardingWelcomeEmail = async (userData: EmailUserData) => {
  functions.logger.log('Sending Onboarding Welcome Email', userData.id);

  const sgMail = getSgMail();
  const fromEmail: string = EmailSenderAddresses.IGNFAPP_DEFAULT;
  const fromName: string = EmailSenderNames.IGNFAPP_DEFAULT;
  const toFirstName: string = userData.firstName as string;
  let recipientData: EmailData | EmailData[];
  let bccData: EmailData | EmailData[];
  const templateId: string = SendgridEmailTemplateIds.IGNFAPP_ONBOARDING_WELCOME_EMAIL;
  const unsubscribeGroupId: number = SendgridEmailUnsubscribeGroupIds.IGNFAPP_ONBOARDING_GUIDE;
  let categories: string[];

  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      recipientData = [
        {
          email: userData.email,
          name: userData.firstName
        }
      ];
      categories = [EmailCategories.ONBOARDING_GUIDE];
      bccData = '';
      break;
    case EnvironmentTypes.SANDBOX:
      recipientData = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailCategories.ONBOARDING_GUIDE, EmailCategories.TEST_SEND];
      bccData = '';
      break;
    default:
      recipientData = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailCategories.ONBOARDING_GUIDE, EmailCategories.TEST_SEND];
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
      replyEmailAddress: fromEmail,
    },
    trackingSettings: {
      subscriptionTracking: {
        enable: true, // Enable tracking in order to catch the unsubscribe webhook
      },
    },
    asm: {
      groupId: unsubscribeGroupId, // Set the unsubscribe group
    },
    categories
  };
  const sendgridResponse = await sgMail.send(msg)
    .catch(err => {functions.logger.log(`Error sending email: ${msg} because:`, err); throw new functions.https.HttpsError('internal', err);});
  
  // If email is successful, mark intro email sent
  if (sendgridResponse) {
    await markIntroEmailSent(userData);
  }

  functions.logger.log('Email sent', msg);
  return sendgridResponse;
}
