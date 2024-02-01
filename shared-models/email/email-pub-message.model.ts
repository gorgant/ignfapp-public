import { EmailIdentifiers } from './email-vars.model';
import { ContactForm } from '../user/contact-form.model';
import { WebpageLoadFailureData } from '../diagnostics/webpage-load-failure-data.model';
import { EmailUserData } from './email-user-data.model';

export interface EmailPubMessage {
  emailIdentifier: EmailIdentifiers;
  userData?: EmailUserData;
  contactForm?: ContactForm;
}
