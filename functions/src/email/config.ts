import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as sendGridMail from '@sendgrid/mail';
import { PublicAppRoutes } from '../../../shared-models/routes-and-paths/app-routes.model';
import { sendgridApiSecret } from '../config/api-key-config';
import { publicAppUrl } from '../config/app-config';

// Initialize SG and export
export const getSgMail = () => {
  logger.log('Initializing Sendgrid Mail service');
  const sendgrid = sendGridMail;
  const sgSecret = sendgridApiSecret.value();
  if (!sgSecret) {
    const err = `Error initializing Sendgrid Mail service. No sendgridSecret value available.`;
    logger.log(err); throw new HttpsError('failed-precondition', err);
  }
  sendGridMail.setApiKey(sgSecret);
  return sendgrid;
}


// Useful links for emails
const appUrl = publicAppUrl;
const emailVerificationSlugWithSlahPrefeix = PublicAppRoutes.AUTH_EMAIL_VERIFICATION;
const emailVerificationUrlNoParams = `https://${appUrl}${emailVerificationSlugWithSlahPrefeix}`;


export const EmailWebsiteLinks = {
  EMAIL_VERIFICATION_URL_NO_PARAMS: emailVerificationUrlNoParams,
};

const sendgridBaseApiUrl = 'https://api.sendgrid.com/v3';
export const sendgridMarketingContactsApiUrl = `${sendgridBaseApiUrl}/marketing/contacts`;
export const sendgridMarketingListsApiUrl = `${sendgridBaseApiUrl}/marketing/lists`;
