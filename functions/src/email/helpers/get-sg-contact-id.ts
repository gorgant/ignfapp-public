import * as functions from 'firebase-functions';
import * as Axios from 'axios';
import { sendgridMarketingContactsApiUrl, sendgridSecret } from "../config";
import { SendgridSearchContactsResponse } from '../../../../shared-models/email/sendgrid-job-response.model';
import { submitHttpRequest } from '../../config/global-helpers';
import { EmailUserData } from '../../../../shared-models/email/email-user-data.model';

// Queries sendgrid for a specific email address and returns the user ID
export const getSgContactId = async (userData: EmailUserData): Promise<string | undefined> => {

  // First check if contact ID data already exists
  if (userData.emailSendgridContactId) {
    return userData.emailSendgridContactId;
  }

  const requestUrl = `${sendgridMarketingContactsApiUrl}/search`;
  const requestBody = { 
    query: `email LIKE '${userData.email}'` // accepts most SQL queries such as AND CONTAINS...
  };
  const requestOptions: Axios.AxiosRequestConfig = {
    method: 'POST',
    url: requestUrl,
    headers: 
      { 
        'content-type': 'application/json',
        authorization: `Bearer ${sendgridSecret}` 
      },
    data: requestBody
  };

  functions.logger.log('Searching SG for contact with these options', requestOptions);

  const searchResponse: SendgridSearchContactsResponse = await submitHttpRequest(requestOptions) as SendgridSearchContactsResponse;
  
  if (searchResponse.contact_count < 1) {
    functions.logger.log('No contacts found, aborting getSendgridContactId with null value');
    return undefined;
  }

  const subId = searchResponse.result[0].id;
  functions.logger.log('Found contact with this id:', subId);
  
  return subId;

}