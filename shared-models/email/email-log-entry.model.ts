import { EmailCategories } from "./email-vars.model";

export interface EmailLogEntry {
  emailCategory: EmailCategories;
  recipientEmail: string;
  recipientId: string;
  sentTimestamp: number;
}