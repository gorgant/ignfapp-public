import * as functions from 'firebase-functions';
import * as Axios from 'axios';
import { sendgridContactsApiUrl, sendgridSecret } from "../config";
import { SendgridSearchContactsResponse } from '../../../../shared-models/email/sendgrid-job-response.model';
import { submitHttpRequest } from '../../config/global-helpers';

// Queries sendgrid for a specific email address and returns the user ID
export const getSgContactIdByEmail = async (email: string): Promise<string | null> => {

  const requestUrl = `${sendgridContactsApiUrl}/search`;
  const requestBody = { 
    query: `email LIKE '${email}'` // accepts most SQL queries such as AND CONTAINS...
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
    return null;
  }

  const subId = searchResponse.result[0].id;
  functions.logger.log('Found contact with this id:', subId);
  
  return subId;

}