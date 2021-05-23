import { EmailCategories } from './email-vars.model';
import { ContactForm } from '../user/contact-form.model';
import { Order } from '../orders/order.model';
import { WebpageLoadFailureData } from '../diagnostics/webpage-load-failure-data.model';
import { EmailUserData } from './email-user-data.model';

export interface EmailPubMessage {
  emailCategory: EmailCategories;
  userData?: EmailUserData;
  contactForm?: ContactForm;
  order?: Order;
  webpageLoadFailureData?: WebpageLoadFailureData;
}
