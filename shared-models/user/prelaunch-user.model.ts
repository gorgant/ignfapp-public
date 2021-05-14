export enum PrelaunchUserKeys {
  EMAIL = 'email'
}


export interface PrelaunchUser {
  id: string;
  [PrelaunchUserKeys.EMAIL]: string;
  lastModifiedTimestamp: number;
  firstName: string;
  createdTimestamp: number;
  emailVerified?: boolean;
  prelaunchEmailSent?: boolean;
}

export interface PrelaunchUserFormData {
  firstName: string;
  email: string;
}