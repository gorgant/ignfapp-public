import { UserRegistrationFormFieldKeys } from "./subscribe-form.model";

export const SubscribeFormValidationMessages = {
  [UserRegistrationFormFieldKeys.FIRST_NAME]: [
    { type: 'required', message: 'First name is required.'},
  ],
  [UserRegistrationFormFieldKeys.EMAIL]: [
    { type: 'required', message: 'Email is required.'},
    { type: 'email', message: 'Not a valid email.'},
  ],
};