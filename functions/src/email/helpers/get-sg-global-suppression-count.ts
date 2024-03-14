import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { sendgridGlobalSuppressionsQueryApiUrl } from '../config';
import { SendgridGlobalSupressionsQueryResponseObject } from '../../../../shared-models/email/sendgrid-objects.model';
import { submitHttpRequest } from '../../config/global-helpers';
import * as Axios from 'axios';
import { sendgridApiSecret } from '../../config/api-key-config';

/**
 * Query sendgrid API for gobal suppression count
 */
export const getSgGlobalSuppressionCount = async (): Promise<number> => {

  const requestUrl = `${sendgridGlobalSuppressionsQueryApiUrl}`;
  const requestOptions: Axios.AxiosRequestConfig = {
    method: 'GET',
    url: requestUrl,
    headers: 
      { 
        'content-type': 'application/json',
        authorization: `Bearer ${sendgridApiSecret.value()}` 
      }
  };

  logger.log('Getting getSgGlobalSuppressionCount with these options', requestOptions);

  const searchResponse = await submitHttpRequest(requestOptions)
    .catch(err => {logger.log(`Error with Sendgrid contact count request:`, err); throw new HttpsError('internal', err);});
  
  const globalSupressionCount = (searchResponse as SendgridGlobalSupressionsQueryResponseObject[]).length;
    logger.log('Found this many globalSuppressions in SG:', globalSupressionCount);
  
  return globalSupressionCount;

}