import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { sendgridMarketingContactsApiUrl } from '../config';

import { SendgridGetContactCountResponse } from '../../../../shared-models/email/sendgrid-objects.model';
import { submitHttpRequest } from '../../config/global-helpers';
import { sendgridApiSecret } from '../../config/api-key-config';
import { AxiosRequestConfig } from 'axios';

/**
 * Query sendgrid API for total contact count
 */
export const getSgContactCount = async (): Promise<number> => {

  const requestUrl = `${sendgridMarketingContactsApiUrl}/count`;
  const requestOptions: AxiosRequestConfig = {
    method: 'GET',
    url: requestUrl,
    headers: 
      { 
        'content-type': 'application/json',
        authorization: `Bearer ${sendgridApiSecret.value()}` 
      }
  };

  logger.log('Getting getSendgridContactCount with these options', requestOptions);

  const searchResponse = await submitHttpRequest(requestOptions)
    .catch(err => {logger.log(`Error with Sendgrid contact count request:`, err); throw new HttpsError('internal', err);});
  
  const contactCount = (searchResponse as SendgridGetContactCountResponse).contact_count;
  logger.log('Found this many contacts in SG:', contactCount);
  
  return contactCount;

}