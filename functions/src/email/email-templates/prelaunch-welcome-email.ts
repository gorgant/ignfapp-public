
import { getSgMail } from "../config";
import { EmailSenderAddresses, EmailSenderNames, EmailCategories, SendgridEmailTemplateIds, SendgridEmailUnsubscribeGroupIds, AdminEmailAddresses } from "../../../../shared-models/email/email-vars.model";
import { currentEnvironmentType } from "../../config/environments-config";
import { EnvironmentTypes } from "../../../../shared-models/environments/env-vars.model";
import { MailDataRequired } from "@sendgrid/helpers/classes/mail";
import * as functions from 'firebase-functions';
import { SocialUrls } from '../../../../shared-models/meta/social-urls.model';
import { EmailUserData } from "../../../../shared-models/email/email-user-data.model";
import { PublicCollectionPaths } from "../../../../shared-models/routes-and-paths/fb-collection-paths.model";
import { publicFirestore } from "../../config/db-config";

const db = publicFirestore;

const markIntroEmailSent = async (userData: EmailUserData) => {

  const prelaunchWelcomeEmailSentUpdate: Partial<EmailUserData> = {
    emailPrelaunchWelcomeSent: true
  }

  const fbRes = await db.collection(PublicCollectionPaths.PRELAUNCH_USERS).doc(userData.id).update(prelaunchWelcomeEmailSentUpdate)
    .catch(err => {functions.logger.log(`Failed to update subscriber data in public database`, err); return err;});

  functions.logger.log('Marked emailprelaunchWelcomeSent true', fbRes);
  return fbRes;
}

export const sendPrelaunchWelcomeEmail = async (userData: EmailUserData) => {
  functions.logger.log('Sending Prelaunch Welcome Email', userData.id);

  const sgMail = getSgMail();
  const fromEmail: string = EmailSenderAddresses.IGNFAPP_DEFAULT;
  const fromName: string = EmailSenderNames.IGNFAPP_DEFAULT;
  const toFirstName: string = userData.firstName as string;
  let toEmail: string;
  let bccEmail: string;
  const templateId: string = SendgridEmailTemplateIds.IGNFAPP_PRELAUNCH_WELCOME_EMAIL;
  const unsubscribeGroupId: number = SendgridEmailUnsubscribeGroupIds.IGNFAPP_PRELAUNCH_WAIT_LIST;
  let categories: string[];

  switch (currentEnvironmentType) {
    case EnvironmentTypes.PRODUCTION:
      toEmail = userData.email;
      categories = [EmailCategories.PRELAUNCH_WELCOME];
      bccEmail = AdminEmailAddresses.IGNFAPP_ADMIN;
      break;
    case EnvironmentTypes.SANDBOX:
      toEmail = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailCategories.PRELAUNCH_WELCOME, EmailCategories.TEST_SEND];
      bccEmail = '';
      break;
    default:
      toEmail = AdminEmailAddresses.IGNFAPP_ADMIN;
      categories = [EmailCategories.PRELAUNCH_WELCOME, EmailCategories.TEST_SEND];
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
      replyEmailAddress: fromEmail,
      youTubeChannelUrl: SocialUrls.IGNFAPP_YOUTUBE_MD,
      instagramUrl: SocialUrls.IGNFAPP_INSTAGRAM
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
