export enum AuthKeys {
  EMAIL = 'email',
  PASSWORD = 'password',
  FIRST_NAME = 'firstName'
}

export interface AuthData {
  [AuthKeys.EMAIL]: string;
  [AuthKeys.PASSWORD]: string;
  [AuthKeys.FIRST_NAME]?: string;
}
