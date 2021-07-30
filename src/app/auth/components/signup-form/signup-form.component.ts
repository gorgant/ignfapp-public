import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { AuthFormData, AuthResultsData } from 'shared-models/auth/auth-data.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { UserRegistrationFormFieldKeys, UserRegistrationFormFieldValues, UserRegistrationButtonValues } from 'shared-models/forms/user-registration-form-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { AuthStoreActions, AuthStoreSelectors, RootStoreState, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-signup-form',
  templateUrl: './signup-form.component.html',
  styleUrls: ['./signup-form.component.scss']
})
export class SignupFormComponent implements OnInit, OnDestroy {

  registerUserForm!: FormGroup;
  formFieldKeys = UserRegistrationFormFieldKeys;
  formValidationMessages = UserRegistrationFormValidationMessages;
  firstNameFieldValue = UserRegistrationFormFieldValues.FIRST_NAME;
  emailFieldValue = UserRegistrationFormFieldValues.EMAIL;
  passwordFieldValue = UserRegistrationFormFieldValues.CREATE_PASSWORD;
  submitButtonValue = UserRegistrationButtonValues.CREATE_ACCOUNT;
  trustedEmailSender = EmailSenderAddresses.IGNFAPP_DEFAULT;

  authStatus$!: Observable<boolean>;
  signupProcessing$!: Observable<boolean>;
  authResultsData$!: Observable<AuthResultsData>;
  authSubscription!: Subscription;
  newUser$!: Observable<PublicUser>;
  newUserSubscription!: Subscription;
  userFetched = false;

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
    this.signupProcessing$ = combineLatest(
      [
        this.store.pipe(select(AuthStoreSelectors.selectIsSigningUpUser)),
        this.store.pipe(select(UserStoreSelectors.selectIsCreatingUser))
      ]
    ).pipe(
        map(([signingUp, creatingUser]) => {
          if (signingUp || creatingUser) {
            return true
          }
          return false
        })
    );
    this.authResultsData$ = this.store.pipe(select(AuthStoreSelectors.selectAuthResultsData)) as Observable<AuthResultsData>;
    this.newUser$ = this.store.pipe(select(UserStoreSelectors.selectUserData)) as Observable<PublicUser>;
  }

  private initForm(): void {
    this.registerUserForm = this.fb.group({
      [UserRegistrationFormFieldKeys.FIRST_NAME]: ['', [Validators.required]],
      [UserRegistrationFormFieldKeys.EMAIL]: ['', [Validators.required, Validators.email]],
      [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {

    console.log('Submitted these values', this.registerUserForm.value);

    const authFormData: AuthFormData = {
      email: this.email.value,
      firstName: this.firstName.value,
      password: this.password.value
    }

    this.store.dispatch(AuthStoreActions.emailSignupRequested({authFormData}));
    this.postAuthActions();
  }

  // Update user data and navigate to dashboard
  private postAuthActions() {
    this.authSubscription = this.authStatus$
      .pipe(
        withLatestFrom(
          this.store.pipe(select(AuthStoreSelectors.selectAuthResultsData)),
          this.store.pipe(select(UserStoreSelectors.selectIsCreatingUser))
        )
      )
      .subscribe(([isAuth, authResultsData, isCreatingUser]) => {
        if (isAuth && authResultsData && !isCreatingUser) {
          console.log('User registered in FB Auth');
          const partialNewUserData: Partial<PublicUser> = {
            email: authResultsData.email,
            firstName: this.firstName.value,
            id: authResultsData.id
          }
          this.store.dispatch(UserStoreActions.createUserRequested({partialNewUserData}));
          this.postUserCreationActions(partialNewUserData.id as string);
        }
    })
  };

  // If user email is verified, route to dashboard
  private postUserCreationActions(userId: string) {
    this.newUserSubscription = this.newUser$
      .pipe(
        withLatestFrom(this.signupProcessing$)
      )
      .subscribe(([user, signupProcessing]) => {
        // Need to check for user here bc there's a short gap in signupProcessing btw auth and user creation
        if (user && !signupProcessing && !this.userFetched) {
          this.store.dispatch(UserStoreActions.fetchUserRequested({userId})); // Establish a realtime link to user data in store to mointor email verification status
          this.userFetched = true;
        }

        if (user?.emailVerified) {
            console.log('Email verified, routing user to dashboard');
            this.router.navigate([PublicAppRoutes.DASHBOARD]);
          }
        }
      )
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.newUserSubscription) {
      this.newUserSubscription.unsubscribe();
    }
  }

  // These getters are used for easy access in the HTML template
  get firstName() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.FIRST_NAME) as AbstractControl; }
  get email() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.EMAIL) as AbstractControl; }
  get password() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

}
