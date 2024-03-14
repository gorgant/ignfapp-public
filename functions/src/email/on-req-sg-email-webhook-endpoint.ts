import { Request, onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { EmailEvent } from '../../../shared-models/email/email-event.model';
import { handleSgWebhookEvents } from './helpers/handle-sg-webhook-events';
import { EmailIdentifiers, SgWebhookSignatureVerificationKeys } from '../../../shared-models/email/email-vars.model';
import { Response } from 'express';
import { EventWebhook, EventWebhookHeader } from '@sendgrid/eventwebhook';

const isValidWebhookData = async (events: EmailEvent[]): Promise<boolean> => {

  if (!events) {
    logger.log('No events present, canceling function');
    return false;
  }

  // Event should contain a category, which is either a string or an array of strings
  for (const event of events) {

    // Confirm there is an event category property
    if (!event.category) {
      logger.log('No event category present, canceling function');
      return false;
    }

    // Since category can be a single string, first check for that
    if (typeof event.category === 'string' && event.category === EmailIdentifiers.TEST_SEND) {
      logger.log(`Sandbox mode detected with this event category: ${event.category}, canceling function`);
      return false;
    }
    
    // Otherwise must be array, so loop through that
    for (const category of event.category) {
      if (category === EmailIdentifiers.TEST_SEND) {
        logger.log(`Sandbox mode detected based on this event category: ${category}, canceling function`);
        return false;
      }
    }

  }

  return true;
}

const isValidSgWebhookRequest = (req: Request, res: Response<any>): boolean => {
  const sgWebhookHelpers = new EventWebhook;

  const webhookKey = SgWebhookSignatureVerificationKeys.PRIMARY_KEY;

  // For more info on SG webhook verification process, see: https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
  const sgWebhookPublicKey = sgWebhookHelpers.convertPublicKeyToECDSA(webhookKey);
  const sgWebhookPayload = req.rawBody; // Use the raw body rather than the parsed body
  const sgWebhookSignature = req.header(EventWebhookHeader.SIGNATURE());
  const sgWebhookTimestamp = req.header(EventWebhookHeader.TIMESTAMP());

  if (!sgWebhookPayload || !sgWebhookSignature || !sgWebhookTimestamp) {
    logger.log('Sg webhook request missing SG verification data, terminating function');
    res.status(403).send('Webhook request missing SG verification data, terminating function');
    return false;
  };

  const validWebhookRequest = sgWebhookHelpers.verifySignature(sgWebhookPublicKey, sgWebhookPayload, sgWebhookSignature, sgWebhookTimestamp);

  return validWebhookRequest;
}


/////// DEPLOYABLE FUNCTIONS ///////

export const onReqSgEmailWebhookEndpoint = onRequest( async (req, res) => {

  const validSgWebhookRequest = isValidSgWebhookRequest(req, res);

  if (!validSgWebhookRequest) {
    logger.log('Sg webhook request verification failed, terminating function');
    res.status(403).send('Sg webhook request verification failed, terminating function');
    return;
  };

  logger.log('SG webhook request verified');

  const reqBody = req.body;

  logger.log('Webhook request received with this body', req.body);
    
  const events: EmailEvent[] = reqBody;

  const validWebhookData = await isValidWebhookData(events);

  if (!validWebhookData) {
    res.status(200).send();
    return;
  }
  
  try {
    await handleSgWebhookEvents(events);
    res.status(200).send();
  } catch (err) {
    logger.error(`Failed to update email record`, err); 
    res.status(400).send(err);
  }

});