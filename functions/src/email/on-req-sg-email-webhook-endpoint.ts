import * as functions from 'firebase-functions';
import { EmailEvent } from '../../../shared-models/email/email-event.model';
import { updateEmailRecord } from './helpers/handlers';
import { EmailCategories } from '../../../shared-models/email/email-vars.model';
import { catchErrors } from '../config/global-helpers';


const isSandbox = (events: EmailEvent[], req: functions.Request, res: functions.Response): Promise<boolean> => {
  
  functions.logger.log('Opening exitIfSandbox function');

  const sandboxCheck = new Promise<boolean> ((resolve, reject) => {

    if (!events) {
      functions.logger.log('No events present');
      resolve(false);
      return;
    }

    events.forEach(event => {
      if (!event.category) {
        functions.logger.log('No event category present');
        resolve(false);
        return;
      }

      functions.logger.log('Scanning this event category list', event.category)

      // Since category can be a single string, first check for that
      if (typeof event.category === 'string' && event.category === EmailCategories.TEST_SEND) {
        functions.logger.log(`Sandbox mode based on this event category: ${event.category}, canceling function, received this data`, req.body);
        res.sendStatus(200);
        resolve(true);
        return;
      }

      // Otherwise must be array, so loop through that
      (event.category as string[]).forEach(category => {
        if (category === EmailCategories.TEST_SEND) {
          functions.logger.log(`Sandbox mode based on this event category: ${category}, canceling function, received this data`, req.body);
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

export const onReqSgEmailWebhookEndpoint = functions.https.onRequest(

  async (req, res) => {

    const events: EmailEvent[] = req.body;

    const isTestEmail = await isSandbox(events, req, res);

    // Prevents test data from using production webhook
    // Sendgrid only allows one webhook, so be sure to switch Sendgrid webhook setting to the sandbox endpoint before commenting this out: https://app.sendgrid.com/settings/mail_settings
    if (isTestEmail) {
      res.sendStatus(200);
      return;
    }
    functions.logger.log('No sandbox found');
    
    try {
      functions.logger.log('Sending webhook data to handler', events);
      catchErrors(updateEmailRecord(events))
        .catch(error => error);
      res.sendStatus(200);
    } catch (err) {
      res.status(400).send(err);
    }
  }
);