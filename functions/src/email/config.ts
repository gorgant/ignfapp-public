import * as functions from 'firebase-functions';
import { adminFirestore } from '../config/db-config';
import * as sendGridMail from '@sendgrid/mail';
import { publicAppUrl } from '../config/environments-config';
import { PublicAppRoutes } from '../../../shared-models/routes-and-paths/app-routes.model';

// Iniitialize Cloud Firestore Database
export const db = adminFirestore;
const settings = { timestampsInSnapshots: true };
db.settings(settings);

// ENV Variables
export const sendgridSecret: string = functions.config().sendgrid.secret;

// Initialize SG and export
export const getSgMail = () => {
  const sendgrid = sendGridMail;
  sendGridMail.setApiKey(sendgridSecret);
  return sendgrid;
}


// Useful links for emails
const appUrl = publicAppUrl;
const emailVerificationSlugWithSlahPrefeix = PublicAppRoutes.EMAIL_VERIFICATION;
const emailVerificationUrlNoParams = `https://${appUrl}${emailVerificationSlugWithSlahPrefeix}`;


export const EmailWebsiteLinks = {
  EMAIL_VERIFICATION_URL_NO_PARAMS: emailVerificationUrlNoParams,
};

const sendgridBaseApiUrl = 'https://api.sendgrid.com/v3';
export const sendgridContactsApiUrl = `${sendgridBaseApiUrl}/marketing/contacts`;
export const sendgridContactDatabaseApiUrl = `${sendgridBaseApiUrl}/contactdb`;
