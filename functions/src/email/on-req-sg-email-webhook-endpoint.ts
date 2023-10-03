import { Request, onRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { EmailEvent } from '../../../shared-models/email/email-event.model';
import { updateEmailRecord } from './helpers/handlers';
import { EmailIdentifiers } from '../../../shared-models/email/email-vars.model';
import { Response } from 'express';


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

// TODO: Figure out if I need to whitelist the Sendgrid domain before enforcing appCheck here
// const callableOptions: CallableOptions = {
//   enforceAppCheck: true
// };

export const onReqSgEmailWebhookEndpoint = onRequest( async (req, res) => {

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