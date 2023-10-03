import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, throwError } from 'rxjs';
import { catchError, filter, switchMap, tap, withLatestFrom } from 'rxjs/operators';
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

  registerUserForm!: UntypedFormGroup;
  FORM_VALIDATION_MESSAGES = UserRegistrationFormValidationMessages;
  
  FIRST_NAME_FIELD_VALUE = GlobalFieldValues.FIRST_NAME;
  EMAIL_FIELD_VALUE = GlobalFieldValues.EMAIL;
  PASSWORD_FIELD_VALUE = GlobalFieldValues.CREATE_PASSWORD;
  SUBMIT_BUTTON_VALUE = GlobalFieldValues.CREATE_ACCOUNT;
  PASSWORD_HINT = GlobalFieldValues.LI_PASSWORD_HINT;
  TRUSTED_EMAIL_SENDER = EmailSenderAddresses.IGNFAPP_DEFAULT;

  private authSubscription!: Subscription;
  private authData$!: Observable<AuthResultsData>;
  private userData$!: Observable<PublicUser>;
  private authReloadProcessing$!: Observable<boolean>;

  private reloadAuthDataTriggered!: boolean;

  private store$ = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(UntypedFormBuilder);

  constructor() { }

  ngOnInit(): void {
    this.initForm();
    this.monitorUserStatus();
  }

  private monitorUserStatus() {
    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectPublicUserData)) as Observable<PublicUser>;
    this.authData$ = this.store$.pipe(select(AuthStoreSelectors.selectAuthResultsData)) as Observable<AuthResultsData>;
    this.authReloadProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectReloadAuthDataProcessing)) as Observable<boolean>;
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
    };

    this.store$.dispatch(AuthStoreActions.emailSignupRequested({authFormData}));
    this.postAuthActions();
  }

  // Create user in auth and DB and then navigate to dashboard
  private postAuthActions() {
    this.authSubscription = this.authData$
      .pipe(
        filter(authData => !!authData), // Only proceed once auth data is available
        switchMap(authData => {
          console.log('Auth data received', authData);
          console.log('New user detected in auth, creating new user in DB', authData);
          this.createUserInFirebase(authData!);
          return combineLatest([this.userData$, this.authData$, this.authReloadProcessing$]);
        }),
        filter(([userData, authData, authReloadProcessing]) => !!userData && !!authData && !authReloadProcessing), // Only proceed once user data is available
        tap(([userData, authData, authReloadProcessing]) => {
          if (!userData.emailVerified) {
            console.log(`User has not verified email. Waiting for verification for ${userData.email}`);
          }
          // Auth data needs to be reloaded after email verification is complete in order for user page to update
          if (userData.emailVerified && !authData.emailVerified && !this.reloadAuthDataTriggered) {
            console.log(`User email verified but auth not yet updated. Submitting auth refresh request.`);
            this.store$.dispatch(AuthStoreActions.reloadAuthDataRequested());
            this.reloadAuthDataTriggered = true;
          }
          if (userData.emailVerified && authData.emailVerified) {
            console.log('User email verified in db and auth, routing user to requested route.');
            this.redirectUserToRequestedRoute();
          }
        }),
        catchError(error => {
          console.log('Error authorizing user, logging out', error);
          this.store$.dispatch(AuthStoreActions.logout());
          return throwError(() => new Error(error));
        })
      )
      .subscribe(); 
  };

  private createUserInFirebase(authData: AuthResultsData) {
    const partialNewUserData: Partial<PublicUser> = {
      email: authData.email,
      firstName: this.firstName.value,
      id: authData.id
    }
    this.store$.dispatch(UserStoreActions.createPublicUserRequested({partialNewPublicUserData: partialNewUserData}));
  }

  // After the login flow is complete, redirect user to the requested route or otherwise to Workouts
  private redirectUserToRequestedRoute(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';

    if (returnUrl && returnUrl !== '/') {
      console.log('returnURL is not root, navigating to:', returnUrl);
      this.router.navigate([returnUrl]);
    } else {
      console.log('returnUrl is root, navigating to train');
      this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
    }
  }



  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // These getters are used for easy access in the HTML template
  get firstName() { return this.registerUserForm.get(PublicUserKeys.FIRST_NAME) as AbstractControl; }
  get email() { return this.registerUserForm.get(PublicUserKeys.EMAIL) as AbstractControl; }
  get password() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

}
