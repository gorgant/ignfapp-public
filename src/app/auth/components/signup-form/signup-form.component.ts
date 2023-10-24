import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Validators, AbstractControl, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, throwError } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { AuthFormData, AuthResultsData } from 'shared-models/auth/auth-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { UserRegistrationFormFieldKeys } from 'shared-models/forms/user-registration-form-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { AuthStoreActions, AuthStoreSelectors, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-signup-form',
  templateUrl: './signup-form.component.html',
  styleUrls: ['./signup-form.component.scss']
})
export class SignupFormComponent implements OnInit, OnDestroy {

  FORM_VALIDATION_MESSAGES = UserRegistrationFormValidationMessages;
  
  FIRST_NAME_FIELD_VALUE = GlobalFieldValues.FIRST_NAME;
  EMAIL_FIELD_VALUE = GlobalFieldValues.EMAIL;
  PASSWORD_FIELD_VALUE = GlobalFieldValues.CREATE_PASSWORD;
  SUBMIT_BUTTON_VALUE = GlobalFieldValues.CREATE_ACCOUNT;
  PASSWORD_HINT = GlobalFieldValues.LI_PASSWORD_HINT;
  TRUSTED_EMAIL_SENDER = EmailSenderAddresses.IGNFAPP_DEFAULT;

  private authData$!: Observable<AuthResultsData>;
  private authError$!: Observable<{} | null>;
  private authReloadProcessing$!: Observable<boolean>;
  private authSubscription!: Subscription;
  
  private userData$!: Observable<PublicUser>;

  private reloadAuthDataTriggered = signal(false);

  private store$ = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private uiService = inject(UiService);

  registerUserForm = this.fb.group({
    [PublicUserKeys.FIRST_NAME]: ['', [Validators.required]],
    [PublicUserKeys.EMAIL]: ['', [Validators.required, Validators.email]],
    [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() { }

  ngOnInit(): void {
    this.monitorUserStatus();
  }

  private monitorUserStatus() {
    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectPublicUserData)) as Observable<PublicUser>;
    this.authData$ = this.store$.pipe(select(AuthStoreSelectors.selectAuthResultsData)) as Observable<AuthResultsData>;
    this.authError$ = this.store$.pipe(select(AuthStoreSelectors.selectAuthenticateUserError));
    this.authReloadProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectReloadAuthDataProcessing)) as Observable<boolean>;
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
    this.authSubscription = this.authError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.authSubscription?.unsubscribe();
            this.resetComponentActionState();
            this.store$.dispatch(AuthStoreActions.logout());
          }
          return combineLatest([this.authData$, this.authError$]);
        }),
        filter(([authData, processingError]) => !processingError ), // Halts function if processingError detected
        filter(([authData, processingError]) => !!authData), // Only proceed once auth data is available
        switchMap(([authData, processingError]) => {
          console.log('Auth data received', authData);
          console.log('New user detected in auth, creating new user in DB', authData);
          this.createUserInFirebase(authData);
          return combineLatest([this.userData$, this.authData$, this.authReloadProcessing$]);
        }),
        filter(([userData, authData, authReloadProcessing]) => !!userData && !!authData && !authReloadProcessing), // Only proceed once user data is available
        tap(([userData, authData, authReloadProcessing]) => {
          if (!userData.emailVerified) {
            console.log(`User has not verified email. Waiting for verification for ${userData.email}`);
          }
          // Auth data needs to be reloaded after email verification is complete in order for user page to update
          if (userData.emailVerified && !authData.emailVerified && !this.reloadAuthDataTriggered()) {
            console.log(`User email verified but auth not yet updated. Submitting auth refresh request.`);
            this.store$.dispatch(AuthStoreActions.reloadAuthDataRequested());
            this.reloadAuthDataTriggered.set(true);
          }
          if (userData.emailVerified && authData.emailVerified) {
            console.log('User email verified in db and auth, routing user to requested route.');
            this.redirectUserToRequestedRoute();
          }
        }),
        catchError(error => {
          console.log('Error in component:', error);
          this.authSubscription?.unsubscribe();
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetComponentActionState();
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

  private resetComponentActionState() {
    this.reloadAuthDataTriggered.set(false);
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  // These getters are used for easy access in the HTML template
  get firstName() { return this.registerUserForm.get(PublicUserKeys.FIRST_NAME) as AbstractControl; }
  get email() { return this.registerUserForm.get(PublicUserKeys.EMAIL) as AbstractControl; }
  get password() { return this.registerUserForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

}
