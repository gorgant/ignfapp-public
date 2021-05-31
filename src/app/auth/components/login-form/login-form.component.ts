import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { AuthData } from 'shared-models/auth/auth-data.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { UserRegistrationButtonValues, UserRegistrationFormFieldKeys, UserRegistrationFormFieldValues } from 'shared-models/forms/user-registration-form-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {

  authUserForm!: FormGroup;
  formFieldKeys = UserRegistrationFormFieldKeys;
  formValidationMessages = UserRegistrationFormValidationMessages;
  emailFieldValue = UserRegistrationFormFieldValues.EMAIL;
  passwordFieldValue = UserRegistrationFormFieldValues.CREATE_PASSWORD;
  submitButtonValue = UserRegistrationButtonValues.LOGIN;
  logoutButtonValue = UserRegistrationButtonValues.LOGOUT;
  trustedEmailSender = EmailSenderAddresses.IGNFAPP_DEFAULT;

  loginProcessing: boolean = false;

  newUser$: Subject<PublicUser> = new Subject();
  authStatus$!: Observable<boolean>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.authStatus$ = this.authService.userAuthStatus$;
  }

  initForm(): void {
    this.authUserForm = this.fb.group({
      [UserRegistrationFormFieldKeys.EMAIL]: ['', [Validators.required, Validators.email]],
      [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {

    this.loginProcessing = true;

    console.log('Submitted these values', this.authUserForm.value);

    const authData: AuthData = {
      email: this.email.value,
      password: this.password.value
    }

    this.authService.loginWithEmail(authData)
      .pipe(
        switchMap(partialPublicUser => {
          return this.userService.createOrUpdatePublicUser(partialPublicUser);
        }),
        map(publicUser => {
          this.loginProcessing = false;
          return publicUser
        }),
        catchError(err => {
          this.loginProcessing = false;
          console.log('Error detected while authenticating user', err);
          return of(err);
        })
      ).subscribe(publicUser => {
        this.newUser$.next(publicUser);
      })
  }

  onLogout() {
    console.log('Logging out user');
    this.newUser$.next(undefined);
    this.authService.logout();
  }

  // These getters are used for easy access in the HTML template
  get email() { return this.authUserForm.get(UserRegistrationFormFieldKeys.EMAIL) as AbstractControl; }
  get password() { return this.authUserForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

}
