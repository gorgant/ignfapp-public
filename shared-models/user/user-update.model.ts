import { PublicUser } from "./public-user.model";

export interface UserUpdateData {
  userData: PublicUser | Partial<PublicUser>,
  updateType: UserUpdateType
}

export enum UserUpdateType {
  AUTHENTICATION = 'authentication',
  EMAIL_UPDATE = 'email-update',
  PASSWORD_UPDATE = 'password-update',
  BIO_UPDATE = 'bio-update'
}