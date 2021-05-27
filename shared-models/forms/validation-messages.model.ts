import { UserRegistrationFormFieldKeys } from "./user-registration-form-vals.model";

export const UserRegistrationFormValidationMessages = {
  [UserRegistrationFormFieldKeys.FIRST_NAME]: [
    { type: 'required', message: 'First name is required.'},
  ],
  [UserRegistrationFormFieldKeys.EMAIL]: [
    { type: 'required', message: 'Email is required.'},
    { type: 'email', message: 'Not a valid email.'},
  ],
  [UserRegistrationFormFieldKeys.PASSWORD]: [
    { type: 'required', message: 'Password is required.'},
    { type: 'minlength', message: 'Password must be at least six characters.' }
  ],
};