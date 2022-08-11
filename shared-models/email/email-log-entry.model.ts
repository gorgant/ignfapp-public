import { EmailCategories } from "./email-vars.model";
import { Timestamp } from '@angular/fire/firestore';


export interface EmailLogEntry {
  emailCategory: EmailCategories;
  recipientEmail: string;
  recipientId: string;
  sentTimestamp: number | Timestamp;
}