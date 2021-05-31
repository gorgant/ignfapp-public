import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { take, switchMap, map, catchError } from 'rxjs/operators';
import { AuthData } from 'shared-models/auth/auth-data.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { UserRegistrationFormFieldKeys, UserRegistrationFormFieldValues, UserRegistrationButtonValues } from 'shared-models/forms/user-registration-form-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-signup-form',
  templateUrl: './signup-form.component.html',
  styleUrls: ['./signup-form.component.scss']
})
export class SignupFormComponent implements OnInit {

  registerUserForm!: FormGroup;
  formFieldKeys = UserRegistrationFormFieldKeys;
  formValidationMessages = UserRegistrationFormValidationMessages;
  firstNameFieldValue = UserRegistrationFormFieldValues.FIRST_NAME;
  emailFieldValue = UserRegistrationFormFieldValues.EMAIL;
  passwordFieldValue = UserRegistrationFormFieldValues.CREATE_PASSWORD;
  submitButtonValue = UserRegistrationButtonValues.CREATE_ACCOUNT;
  trustedEmailSender = EmailSenderAddresses.IGNFAPP_DEFAULT;

  registrationProcessing: boolean = false;

  newUser$!: Observable<PublicUser | undefined>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.registerUserForm = this.fb.group({
      [UserRegistrationFormFieldKeys.FIRST_NAME]: ['', [Validators.required]],
      [UserRegistrationFormFieldKeys.EMAIL]: ['', [Validators.required, Validators.email]],
      [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {

    this.registrationProcessing = true;

    console.log('Submitted these values', this.registerUserForm.value);

    const authData: AuthData = {
      email: this.email.value,
      firstName: this.firstName.value,
      password: this.password.value
    }

    this.newUser$ = this.authService.registerUserWithEmailAndPassword(authData)
      .pipe(
        take(1),
        switchMap(partialPublicUser => {
          return this.userService.createOrUpdatePublicUser(partialPublicUser);
        }),
        map(publicUser => {
          this.registrationProcessing = false;
          console.log('Public user created and available in component', publicUser);
          return publicUser;
        }),
        catchError(err => {
          this.registrationProcessing = false;
          console.log('Error detected while creating user', err);
          return of(undefined);
        })
      )
  }

  // These getters are used for easy access in the HTML template
  get firstName() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.FIRST_NAME) as AbstractControl; }
  get email() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.EMAIL) as AbstractControl; }
  get password() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

}
