import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
// import * as Axios from 'axios';
import axios, { AxiosRequestConfig } from 'axios';
import { PublicUser, PublicUserKeys } from '../../../shared-models/user/public-user.model';
import { UserRecord, getAuth } from 'firebase-admin/auth';
import { publicAppFirebaseInstance } from './app-config';
import { EmailUserData } from '../../../shared-models/email/email-user-data.model';
import { publicFirestore } from './db-config';
import { PublicCollectionPaths } from '../../../shared-models/routes-and-paths/fb-collection-paths.model';



// Firebase can't handle back slashes
export const createOrReverseFirebaseSafeUrl = (url: string, reverse?: boolean): string => {
  if (reverse) {
    const urlWithSlashes = url.replace(/~1/g,'/') // Revert to normal url
    return urlWithSlashes;
  }
  const removedProtocol = url.split('//').pop() as string;
  const replacedSlashes = removedProtocol.replace(/\//g,'~1');
  return replacedSlashes;
}

// Replace spaces with dashes and set lower case
export const convertToFriendlyUrlFormat = (stringWithSpaces: string): string => {
  return stringWithSpaces.split(' ').join('-').toLowerCase();
}

// Convert Hrs:Min:Sec string to milliseconds
export const convertHoursMinSecToMill = (hrsMinSecStamp: string): number => {
  
  const hrs: number = Number(hrsMinSecStamp.split(':')[0]);
  const min: number = Number(hrsMinSecStamp.split(':')[1]);
  const sec: number = Number(hrsMinSecStamp.split(':')[2]);

  return ((hrs*60*60 + min*60 + sec) * 1000);
}

/**
 * Rounds a number to the nearest digits desired
 * @param number Number to round
 * @param digitsToRoundTo Number of digits desired
 */

// Courtesy of: https://stackoverflow.com/questions/15762768/javascript-math-round-to-two-decimal-places
export const generateRoundedNumber = (number: number, digitsToRoundTo: number) => {
  let n = number;
  let digits = digitsToRoundTo; 
  let negative = false;
    if (digits === undefined) {
        digits = 0;
    }
        if( n < 0) {
        negative = true;
      n = n * -1;
    }
    const multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    n = parseFloat((Math.round(n) / multiplicator).toFixed(2));
    if( negative ) {    
        n = parseFloat((n * -1).toFixed(2));
    }
    return n;
}

/**
 * Submits an HTTP request
 * @param requestOptions Request options to include
 */

export const submitHttpRequest = async (config: AxiosRequestConfig): Promise<{}>  => {

  // const axios = Axios(.default);

  const response = await axios(config)
    .catch(err => {
      if (axios.isAxiosError(err)) {
        logger.log(`Error with request: ${err.code} ${err.message}`, err);
        throw new HttpsError('internal', `Error with request: ${err.code} ${err.message}`);
      } else {
        logger.log('unexpected error: ', err);
        throw new HttpsError('unknown', err);
      }
    }
  );

  const reponseData = response.data;

  logger.log('Body from response', reponseData);

  let parsedBody = reponseData;
      
  // Convert body to JSON object if it is a string
  if (typeof parsedBody === 'string' || parsedBody instanceof String) {
    parsedBody = JSON.parse(parsedBody as string);
  }



  return parsedBody;
}

export const fetchUserByEmail = async (email: string, userCollection: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>): Promise<PublicUser | undefined> => {

  const userCollectionRef = await userCollection
    .where(PublicUserKeys.EMAIL, '==', email)
    .get()
    .catch(err => {logger.log(`Failed to fetch publicUser in public database:`, err); throw new HttpsError('internal', err);});

  // Return empty if user doesn't exist
  if (userCollectionRef.empty) {
    logger.log(`publicUser with email '${email}' doesn't exist in database`);
    return undefined;
  }

  const existingUser = userCollectionRef.docs[0].data() as PublicUser;
  logger.log(`Found user with this data`, existingUser);

  return existingUser;
}

export const fetchDbUserById = async (id: string, userCollection: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>): Promise<PublicUser> => {
  const userDoc = await userCollection.doc(id).get()
    .catch(err => {logger.log(`Failed to fetch publicUser in public database:`, err); throw new HttpsError('internal', err);});
  return userDoc.data() as PublicUser; // Will return undefined if doesn't exist
}

export const fetchAuthUserById = async (userId: string): Promise<UserRecord> => {
  const userAuthData: UserRecord = await getAuth(publicAppFirebaseInstance).getUser(userId)
    .catch(err => {logger.log(`Error fetching user from Auth database:`, err); throw new HttpsError('internal', err);});
  return userAuthData;
}

export const convertPublicUserDataToEmailUserData = (userData: PublicUser): EmailUserData => {
  const emailUserData: EmailUserData = {
    createdTimestamp: userData[PublicUserKeys.CREATED_TIMESTAMP],
    email: userData[PublicUserKeys.EMAIL], 
    emailGroupUnsubscribes: userData[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES],
    emailGlobalUnsubscribe: userData[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE],
    emailLastSubSource: userData[PublicUserKeys.EMAIL_LAST_SUB_SOURCE],
    emailOptInConfirmed: userData[PublicUserKeys.EMAIL_OPT_IN_CONFIRMED],
    emailOptInTimestamp: userData[PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP], 
    emailSendgridContactId: userData[PublicUserKeys.EMAIL_SENDGRID_CONTACT_ID],
    emailSendgridContactListArray: userData[PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY],
    emailSendgridContactCreatedTimestamp: userData[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP],
    emailVerified: userData[PublicUserKeys.EMAIL_VERIFIED],
    firstName: userData[PublicUserKeys.FIRST_NAME],
    id: userData[PublicUserKeys.ID],
    lastModifiedTimestamp: userData[PublicUserKeys.LAST_AUTHENTICATED_TIMESTAMP],
    lastName: userData[PublicUserKeys.LAST_NAME],
    onboardingWelcomeEmailSent: userData[PublicUserKeys.ONBOARDING_WELCOME_EMAIL_SENT],
  };
  return emailUserData;
}

export const verifyAuthUidMatchesDocumentUserIdOrIsAdmin = async (request: CallableRequest, documentUserId: string): Promise<boolean> => {
  const authId = request.auth?.uid;

  if (!authId) {
    logger.log(`no authId found, permission to proceed denied`);
    throw new HttpsError('permission-denied', 'Caller does not have permission to modify this document');
  }

  if (authId === documentUserId) {
    logger.log(`authId matches documentUserId, permission to proceed granted.`);
    return true;
  }

  const publicUsersCollection = publicFirestore.collection(PublicCollectionPaths.PUBLIC_USERS);
  const userData = await fetchDbUserById(authId, publicUsersCollection);
  const isAdmin = userData.isAdmin;

  if (isAdmin) {
    logger.log(`User is admin, permission to proceed granted.`);
    return true;
  }

  throw new HttpsError('permission-denied', 'Caller does not have permission to modify this document');
}
