import { PublicUserKeys } from "../user/public-user.model";
import { UserRegistrationFormFieldKeys } from "./user-registration-form-vals.model";

export const UserRegistrationFormValidationMessages = {
  [PublicUserKeys.FIRST_NAME]: [
    { type: 'required', message: 'First name is required.'},
  ],
  [PublicUserKeys.EMAIL]: [
    { type: 'required', message: 'Email is required.'},
    { type: 'email', message: 'Not a valid email.'},
  ],
  [UserRegistrationFormFieldKeys.PASSWORD]: [
    { type: 'required', message: 'Password is required.'},
    { type: 'minlength', message: 'Password must be at least eight characters.' }
  ],
};

export const UserProfileFormValidationMessages = {
  [PublicUserKeys.FIRST_NAME]: [
    { type: 'required', message: 'First name is required.'},
  ],
  [PublicUserKeys.LAST_NAME]: [
    { type: 'required', message: 'Last name is required.'},
  ],
  [PublicUserKeys.DISPLAY_NAME]: [
    { type: 'required', message: 'Display name is required.'},
  ],
  [PublicUserKeys.EMAIL]: [
    { type: 'required', message: 'Email is required.'},
  ],
  [UserRegistrationFormFieldKeys.PASSWORD]: [
    { type: 'required', message: 'Password is required.'},
  ],
}
