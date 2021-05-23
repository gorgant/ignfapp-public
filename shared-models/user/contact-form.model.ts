import { EmailUserData } from '../email/email-user-data.model';

export enum ContactFormKeys {
  MESSAGE = 'message',
  OPT_IN = 'optIn'
}

export interface ContactForm {
  id: string;
  createdDate: number;
  userData: EmailUserData;
  [ContactFormKeys.MESSAGE]: string;
  [ContactFormKeys.OPT_IN]: boolean;
}
