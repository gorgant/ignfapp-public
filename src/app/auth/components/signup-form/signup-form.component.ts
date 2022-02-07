import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AuthFormData, AuthResultsData } from 'shared-models/auth/auth-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { UserRegistrationFormFieldKeys } from 'shared-models/forms/user-registration-form-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { AuthStoreActions, AuthStoreSelectors, RootStoreState, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-signup-form',
  templateUrl: './signup-form.component.html',
  styleUrls: ['./signup-form.component.scss']
})
export class SignupFormComponent implements OnInit, OnDestroy {

  registerUserForm!: FormGroup;
  formValidationMessages = UserRegistrationFormValidationMessages;
  
  firstNameFieldValue = GlobalFieldValues.FIRST_NAME;
  emailFieldValue = GlobalFieldValues.EMAIL;
  passwordFieldValue = GlobalFieldValues.CREATE_PASSWORD;
  submitButtonValue = GlobalFieldValues.CREATE_ACCOUNT;
  passwordHint = GlobalFieldValues.LI_PASSWORD_HINT;
  trustedEmailSender = EmailSenderAddresses.IGNFAPP_DEFAULT;

  authSignUpProcessing$!: Observable<boolean>;
  authSignUpSubscription!: Subscription;
  authSignUpError$!: Observable<{} | undefined>;
  authSignUpSubmitted!: boolean;

  createUserProcessing$!: Observable<boolean>;
  createUserSubscription!: Subscription;
  createUserError$!: Observable<{} | undefined>;
  createUserSubmitted!: boolean;

  fetchUserProcessing$!: Observable<boolean>;
  fetchUserSubscription!: Subscription;
  fetchUserError$!: Observable<{} | undefined>;

  reloadAuthDataProcessing$!: Observable<boolean>;
  reloadAuthDataSubscription!: Subscription;
  reloadAuthDataError$!: Observable<{} | undefined>;
  reloadAuthDataSubmitted!: boolean;

  userData$!: Observable<PublicUser>;
  userFetched: boolean = false;

  constructor(
    private fb: FormBuilder,
    private store$: Store<RootStoreState.AppState>,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkAuthStatus();
  }

  private checkAuthStatus() {
    this.authSignUpProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectIsSigningUpUser));
    this.authSignUpError$ = this.store$.pipe(select(AuthStoreSelectors.selectSignUpError));

    this.createUserProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectIsCreatingUser));
    this.createUserError$ = this.store$.pipe(select(UserStoreSelectors.selectCreateUserError));

    this.fetchUserProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectIsFetchingUser));
    this.fetchUserError$ = this.store$.pipe(select(UserStoreSelectors.selectFetchUserError));
    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectUserData)) as Observable<PublicUser>;

    this.reloadAuthDataProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectIsReloadingAuthData));
    this.reloadAuthDataError$ = this.store$.pipe(select(AuthStoreSelectors.selectReloadAuthDataError));
  }

  private initForm(): void {
    this.registerUserForm = this.fb.group({
      [PublicUserKeys.FIRST_NAME]: ['', [Validators.required]],
      [PublicUserKeys.EMAIL]: ['', [Validators.required, Validators.email]],
      [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {

    const authFormData: AuthFormData = {
      email: this.email.value,
      firstName: this.firstName.value,
      password: this.password.value
    }

    this.store$.dispatch(AuthStoreActions.emailSignupRequested({authFormData}));
    this.postAuthActions();
  }

  // Update user data and navigate to dashboard
  private postAuthActions() {

    this.authSignUpSubscription = this.authSignUpProcessing$
      .pipe(
        withLatestFrom(
          this.authSignUpError$,
          this.store$.pipe(select(AuthStoreSelectors.selectAuthResultsData))
        )
      )
      .subscribe(([authProcessing, authError, authData]) => {

        if (authProcessing) {
          this.authSignUpSubmitted = true;
        }

        // If error in auth, cancel operation
        if (authError) {
          console.log('Error signing up user in Auth, resetting form');
          this.authSignUpSubscription.unsubscribe();
          this.authSignUpSubmitted = false;
          this.registerUserForm.reset();
          return;
        }

        // If auth succeeds, create user in Firebase
        if (this.authSignUpSubmitted && !authProcessing && authData) {
          console.log('Auth sign up successful, creating user in database');
          this.authSignUpSubscription.unsubscribe(); // Clear subscription no longer needed
          this.createUserInFirebase(authData);
          this.postCreateUserActions(authData.id as string);
        }
      })
  };

  private createUserInFirebase(authData: AuthResultsData) {
    const partialNewUserData: Partial<PublicUser> = {
      email: authData.email,
      firstName: this.firstName.value,
      id: authData.id
    }
    this.store$.dispatch(UserStoreActions.createUserRequested({partialNewUserData}));
  }

  // Fetch user and navigate to requested route
  private postCreateUserActions(userId: string) {

    this.createUserSubscription = this.createUserProcessing$
      .pipe(
        withLatestFrom(this.createUserError$)
      )
      .subscribe(([creatingUser, creationError]) => {

        if (creatingUser) {
          this.createUserSubmitted = true;
        }

        // If error creating user in database, cancel operation and delete auth user
        if (creationError) {
          console.log('Error creating user in database, deleting auth user');
          this.createUserSubscription.unsubscribe();
          this.createUserSubmitted = false;
          this.store$.dispatch(AuthStoreActions.deleteAuthUserRequested());
          this.store$.dispatch(AuthStoreActions.logout());
          return;
        }

        if (!creatingUser && this.createUserSubmitted) {
          console.log('User creation successful, fetching user data');
          this.store$.dispatch(UserStoreActions.fetchUserRequested({userId}));
          this.createUserSubscription.unsubscribe();
          this.confirmUserEmailVerified();
        }
      })
  }

  private confirmUserEmailVerified() {
    // Keep this subscription open until component destroyed since user needs to take an action in a separate window if not confirmed
    // Once email is verified, server will update user which will trigger this subscription
    this.fetchUserSubscription = this.userData$
      .pipe(
        withLatestFrom(
          this.fetchUserProcessing$,
          this.fetchUserError$
        )
      )
      .subscribe(([userData, fetchProcessing, fetchError]) => {

        // If error fetching user, cancel operation and log out user
        if (fetchError) {
          console.log('Error fetching user in database, logging out user');
          this.fetchUserSubscription.unsubscribe();
          this.store$.dispatch(AuthStoreActions.logout());
          return;
        }

        if (!fetchProcessing && userData) {
          
          console.log('User data fetched, checking for email verification status');
          
          // If email is verified, proceed to dashboard (otherwise email verification request is provided)
          if (userData.emailVerified) {
            console.log('Email verified, reloading auth data');
            this.store$.dispatch(AuthStoreActions.reloadAuthDataRequested());
            this.reloadAuthData();
            
          } else {
            // FYI Prompt is shown in parent container
            console.log(`User has not verified email. Requesting verification for ${userData.email}`);
          }

        }

      })
  }

  // Auth data needs to be reloaded after email verification is complete in order for user page to update
  private reloadAuthData(): void {
    
    this.reloadAuthDataSubscription = this.reloadAuthDataProcessing$
      .pipe(
        withLatestFrom(this.reloadAuthDataError$)
      )
      .subscribe(([reloadProcessing, reloadError]) => {
        
        if (reloadProcessing) {
          this.reloadAuthDataSubmitted = true;
        }

        // If error updating user in database, cancel operation and log out user
        if (reloadError) {
          console.log('Error reloading auth data, logging out user');
          this.reloadAuthDataSubscription.unsubscribe();
          this.reloadAuthDataSubmitted = false;
          this.store$.dispatch(AuthStoreActions.logout());
          return;
        }

        if (!reloadProcessing && this.reloadAuthDataSubmitted) {
          console.log('Auth data reloaded, redirecting user to requested route');
          this.reloadAuthDataSubscription.unsubscribe();
          this.redirectUserToRequestedRoute();
        }
      })
  }

  // After the signup flow is complete, redirect user to the requested route or otherwise to Workouts
  private redirectUserToRequestedRoute(): void {
    this.router.navigate([PublicAppRoutes.WORKOUT]);
  }

  ngOnDestroy(): void {

    if (this.authSignUpSubscription) {
      this.authSignUpSubscription.unsubscribe();
    }

    if (this.createUserSubscription) {
      this.createUserSubscription.unsubscribe();
    }

    if (this.fetchUserSubscription) {
      this.fetchUserSubscription.unsubscribe();
    }

    if (this.reloadAuthDataSubscription) {
      this.reloadAuthDataSubscription.unsubscribe();
    }
  }

  // These getters are used for easy access in the HTML template
  get firstName() { return this.registerUserForm.get(PublicUserKeys.FIRST_NAME) as AbstractControl; }
  get email() { return this.registerUserForm.get(PublicUserKeys.EMAIL) as AbstractControl; }
  get password() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

}
