import { SubscribeFormFieldKeys } from "./subscribe-form.model";

export const SubscribeFormValidationMessages = {
  [SubscribeFormFieldKeys.FIRST_NAME]: [
    { type: 'required', message: 'First name is required.'},
  ],
  [SubscribeFormFieldKeys.EMAIL]: [
    { type: 'required', message: 'Email is required.'},
    { type: 'email', message: 'Not a valid email.'},
  ],
};