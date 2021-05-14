export enum AuthKeys {
  EMAIL = 'email',
  PASSWORD = 'password',
}

export interface AuthData {
  [AuthKeys.EMAIL]: string;
  [AuthKeys.PASSWORD]: string;
}
