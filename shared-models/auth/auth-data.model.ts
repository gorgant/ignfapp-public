import { PublicUserKeys } from "../user/public-user.model";

export enum AuthFormKeys {
  EMAIL = 'email',
  PASSWORD = 'password',
  FIRST_NAME = 'firstName'
}

export interface AuthFormData {
  [AuthFormKeys.EMAIL]: string;
  [AuthFormKeys.PASSWORD]: string;
  [AuthFormKeys.FIRST_NAME]?: string;
}

export interface AuthResultsData {
  [PublicUserKeys.ID]: string;
  [PublicUserKeys.EMAIL]: string;
}