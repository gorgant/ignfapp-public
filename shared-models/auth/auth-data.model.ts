import { PublicUserKeys } from "../user/public-user.model";

export enum AuthFormKeys {
  EMAIL = 'email',
  FIRST_NAME = 'firstName',
  PASSWORD = 'password',
}

export interface AuthFormData {
  [AuthFormKeys.EMAIL]: string;
  [AuthFormKeys.PASSWORD]: string;
  [AuthFormKeys.FIRST_NAME]?: string;
}

export interface AuthResultsData {
  [PublicUserKeys.ID]: string;
  [PublicUserKeys.EMAIL]: string;
  [PublicUserKeys.EMAIL_VERIFIED]: boolean;
  [PublicUserKeys.AVATAR_URL]?: string;
  [PublicUserKeys.DISPLAY_NAME]?: string;
  isNewUser?: boolean;
}