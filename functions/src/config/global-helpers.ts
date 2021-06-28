import * as functions from 'firebase-functions';
import * as Axios from 'axios';
import { PublicUser, PublicUserKeys } from '../../../shared-models/user/public-user.model';
import { PrelaunchUser } from '../../../shared-models/user/prelaunch-user.model';



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
Sends a descriptive error response when running a callable function
*/
export const catchErrors = async (promise: Promise<any>) => {
  try {
    return await promise;
  } catch(err) {
    functions.logger.log('Unknown error', err);
    throw new functions.https.HttpsError('unknown', err)
  }
}

// These assertions provide error logging to console (rather than in Cloud Functions log)

/**
Validates data payload of a callable function
*/
export const assert = (data: any, key:string) => {
  if (!data || !data[key]) {
    functions.logger.log(`Error with assertion, the following data did not have ${key} property`, data);
    throw new functions.https.HttpsError('invalid-argument', `function called without ${key} data`);
  } else {
    return data[key];
  }
}

/**
Validates auth context for callable function 
*/
export const assertUID = (context: functions.https.CallableContext) => {
  if (!context.auth) {
    functions.logger.log(`Error with assertion, http function called without context.auth`);
    throw new functions.https.HttpsError('permission-denied', 'function called without context.auth');
  } else {
    return context.auth.uid;
  }
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

export const submitHttpRequest = async (config: Axios.AxiosRequestConfig): Promise<{}>  => {

  const axios = Axios.default;

  const response = await axios(config)
    .catch(err => {
      const error = err as Axios.AxiosError; 
      functions.logger.log(`Error with request: ${error.code} ${error.message}`, err); 
      throw new functions.https.HttpsError('internal', `Error with request: ${error.code} ${error.message}`);}
  );

  const reponseData = response.data;

  functions.logger.log('Body from response', reponseData);

  let parsedBody = reponseData;
      
  // Convert body to JSON object if it is a string
  if (typeof parsedBody === 'string' || parsedBody instanceof String) {
    parsedBody = JSON.parse(parsedBody as string);
  }



  return parsedBody;
}

export const fetchUserByEmail = async (email: string, userCollection: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>): Promise<PrelaunchUser | PublicUser | undefined> => {

  const userCollectionRef = await userCollection
  .where(PublicUserKeys.EMAIL, '==', email)
  .get()
  .catch(err => {functions.logger.log(`Failed to fetch prelaunchUser in public database:`, err); throw new functions.https.HttpsError('internal', err);});

  // Return empty if user doesn't exist
  if (userCollectionRef.empty) {
    functions.logger.log(`prelaunchUser with email '${email}' doesn't exist in database`);
    return undefined;
  }

  const existingUser = userCollectionRef.docs[0].data() as PrelaunchUser | PublicUser;
  functions.logger.log(`Found user with this data`, existingUser);

  return existingUser;
}

export const fetchUserById = async (id: string, userCollection: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>): Promise<PublicUser> => {
  const userDoc = await userCollection.doc(id).get()
    .catch(err => {functions.logger.log(`Failed to fetch publicUser in public database:`, err); throw new functions.https.HttpsError('internal', err);});
  return userDoc.data() as PublicUser; // Will return undefined if doesn't exist
}
