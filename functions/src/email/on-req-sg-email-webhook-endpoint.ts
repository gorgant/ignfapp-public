import { Request, onRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { EmailEvent } from '../../../shared-models/email/email-event.model';
import { updateEmailRecord } from './helpers/handlers';
import { EmailIdentifiers, SgWebhookSignatureVerificationKeys } from '../../../shared-models/email/email-vars.model';
import { Response } from 'express';
import { EventWebhook, EventWebhookHeader } from '@sendgrid/eventwebhook';



const isSandbox = (events: EmailEvent[], req: Request, res: Response<any>): Promise<boolean> => {
  
  logger.log('Opening exitIfSandbox function');

  const sandboxCheck = new Promise<boolean> ((resolve, reject) => {

    if (!events) {
      logger.log('No events present');
      resolve(false);
      return;
    }

    events.forEach(event => {
      if (!event.category) {
        logger.log('No event category present');
        resolve(false);
        return;
      }

      logger.log('Scanning this event category list', event.category)

      // Since category can be a single string, first check for that
      if (typeof event.category === 'string' && event.category === EmailIdentifiers.TEST_SEND) {
        logger.log(`Sandbox mode based on this event category: ${event.category}, canceling function, received this data`, req.body);
        res.sendStatus(200);
        resolve(true);
        return;
      }

      // Otherwise must be array, so loop through that
      (event.category as string[]).forEach(category => {
        if (category === EmailIdentifiers.TEST_SEND) {
          logger.log(`Sandbox mode based on this event category: ${category}, canceling function, received this data`, req.body);
          resolve(true);
          return;
        }
      });
      resolve(false);
      return;
    })

  });

  return sandboxCheck;
}


/////// DEPLOYABLE FUNCTIONS ///////

// I don't think AppCheck works on a request (since it's coming from outside Firebase)
// And anyhow, we verify the webhook another way below
// const callableOptions: CallableOptions = {
//   enforceAppCheck: true
// };

export const onReqSgEmailWebhookEndpoint = onRequest( async (req, res) => {

  const sgWebhookHelpers = new EventWebhook;

  // For more info on SG webhook verification process, see: https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
  const sgWebhookPublicKey = sgWebhookHelpers.convertPublicKeyToECDSA(SgWebhookSignatureVerificationKeys.PRIMARY_KEY);
  const sgWebhookPayload = req.rawBody; // Use the raw body rather than the parsed body
  const sgWebhookSignature = req.header(EventWebhookHeader.SIGNATURE());
  const sgWebhookTimestamp = req.header(EventWebhookHeader.TIMESTAMP());

  if (!sgWebhookPayload || !sgWebhookSignature || !sgWebhookTimestamp) {
    logger.log('Sg webhook request missing SG verification data, terminating function');
    res.status(403).send('Webhook request missing SG verification data, terminating function');
    return;
  };
  
  const validWebhookRequest = sgWebhookHelpers.verifySignature(sgWebhookPublicKey, sgWebhookPayload, sgWebhookSignature, sgWebhookTimestamp);

  if (!validWebhookRequest) {
    logger.log('Sg webhook request verification failed, terminating function');
    res.status(403).send('Sg webhook request verification failed, terminating function');
    return;
  };

  logger.log('SG webhook request verified', validWebhookRequest);
    
  const events: EmailEvent[] = req.body;

    const isTestEmail = await isSandbox(events, req, res);

    // Prevents test data from using production webhook
    // Sendgrid only allows one webhook, so be sure to switch Sendgrid webhook setting to the sandbox endpoint before commenting this out: https://app.sendgrid.com/settings/mail_settings
    if (isTestEmail) {
      res.sendStatus(200);
      return;
    }
    logger.log('No sandbox found');
    
    try {
      logger.log('Sending webhook data to handler', events);
      updateEmailRecord(events)
        .catch(err => {logger.log(`Failed to update email record based on the events`, err); throw new HttpsError('internal', err);});
      res.sendStatus(200);
    } catch (err) {
      res.status(400).send(err);
    }
  }
);