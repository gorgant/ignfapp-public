import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { AuthFormData } from 'shared-models/auth/auth-data.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { UserRegistrationButtonValues, UserRegistrationFormFieldKeys, UserRegistrationFormFieldValues } from 'shared-models/forms/user-registration-form-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { AuthStoreActions, AuthStoreSelectors, RootStoreState } from 'src/app/root-store';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit, OnDestroy {

  authUserForm!: FormGroup;
  formFieldKeys = UserRegistrationFormFieldKeys;
  formValidationMessages = UserRegistrationFormValidationMessages;
  emailFieldValue = UserRegistrationFormFieldValues.EMAIL;
  passwordFieldValue = UserRegistrationFormFieldValues.CREATE_PASSWORD;
  submitButtonValue = UserRegistrationButtonValues.LOGIN;

  authStatus$!: Observable<boolean>;
  loginProcessing$!: Observable<boolean>;
  authData$!: Observable<PublicUser | Partial<PublicUser> | undefined>;
  authSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private store: Store<RootStoreState.AppState>,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkAuthStatus();
  }

  private checkAuthStatus() {
    this.authStatus$ = this.store.pipe(select(AuthStoreSelectors.selectIsLoggedIn));
    this.loginProcessing$ = this.store.pipe(select(AuthStoreSelectors.selectIsAuthenticatingUser));
    this.authData$ = this.store.pipe(select(AuthStoreSelectors.selectAuthResultsData));
  }

  private initForm(): void {
    this.authUserForm = this.fb.group({
      [UserRegistrationFormFieldKeys.EMAIL]: ['', [Validators.required, Validators.email]],
      [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {

    console.log('Submitted these values', this.authUserForm.value);

    const authFormData: AuthFormData = {
      email: this.email.value,
      password: this.password.value
    }

    this.store.dispatch(AuthStoreActions.emailAuthRequested({authData: authFormData}));
    this.postAuthActions();
  }

  // Update user data and navigate to dashboard
  postAuthActions() {
    this.authSubscription = this.authStatus$.subscribe(isAuth => {
      if(isAuth) {
        this.router.navigate([PublicAppRoutes.DASHBOARD]);
      }
    });
  }

  // These getters are used for easy access in the HTML template
  get email() { return this.authUserForm.get(UserRegistrationFormFieldKeys.EMAIL) as AbstractControl; }
  get password() { return this.authUserForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

}
