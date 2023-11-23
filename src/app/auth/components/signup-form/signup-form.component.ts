import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Validators, AbstractControl, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AuthFormData, AuthResultsData } from 'shared-models/auth/auth-data.model';
import { PASSWORD_MIN_LENGTH } from 'shared-models/auth/password-vars.model';
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
  
  private authData$!: Observable<AuthResultsData | null>;
  private userData$!: Observable<PublicUser | null>;

  private $emailAuthRequested = signal(false);
  private emailSignupError$!: Observable<{} | null>;
  private emailSignupProcessing$!: Observable<boolean>;
  private emailSignupSubscription!: Subscription;
  
  private $reloadAuthDataSubmitted = signal(false);
  private $reloadAuthDataCycleInit = signal(false);
  private $reloadAuthDataCycleComplete = signal(false);
  private reloadAuthDataError$!: Observable<{} | null>;
  private reloadAuthDataProcessing$!: Observable<boolean>;
  
  private $createUserSubmitted = signal(false);
  private $createUserCycleInit = signal(false);
  private $createUserCycleComplete = signal(false);
  private createUserError$!: Observable<{} | null>;
  private createUserProcessing$!: Observable<boolean>;

  combinedEmailSignupError$!: Observable<any>;

  private store$ = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private uiService = inject(UiService);

  readonly PASSWORD_MIN_LENGTH = PASSWORD_MIN_LENGTH;

  authForm = this.fb.group({
    [PublicUserKeys.FIRST_NAME]: ['', [Validators.required]],
    [PublicUserKeys.EMAIL]: ['', [Validators.required, Validators.email]],
    [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required, Validators.minLength(this.PASSWORD_MIN_LENGTH)]],
  });

  constructor() { }

  ngOnInit(): void {
    this.monitorUserStatus();
  }

  private monitorUserStatus() {
    this.authData$ = this.store$.select(AuthStoreSelectors.selectAuthResultsData);
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData);

    this.emailSignupError$ = this.store$.select(AuthStoreSelectors.selectEmailSignupError);
    this.emailSignupProcessing$ = this.store$.select(AuthStoreSelectors.selectEmailSignupProcessing);

    this.reloadAuthDataError$ = this.store$.select(AuthStoreSelectors.selectReloadAuthDataError);
    this.reloadAuthDataProcessing$ = this.store$.select(AuthStoreSelectors.selectReloadAuthDataProcessing);

    this.createUserError$ = this.store$.select(UserStoreSelectors.selectCreatePublicUserError);
    this.createUserProcessing$ = this.store$.select(UserStoreSelectors.selectCreatePublicUserProcessing);

    this.combinedEmailSignupError$ = combineLatest(
      [
        this.emailSignupError$,
        this.reloadAuthDataError$,
        this.createUserError$
      ]
    ).pipe(
        map(([authError, reloadError, createError]) => {
          if (authError || reloadError || createError) {
            return authError || reloadError || createError;
          }
          return null;
        })
    );
  }

  get firstNameErrorMessage() {
    let errorMessage = '';
    if (this.firstName.hasError('required')) {
      return errorMessage = 'You must enter a value';
    }
    return errorMessage;
  }

  get emailErrorMessage() {
    let errorMessage = '';
    if (this.email.hasError('required')) {
      return errorMessage = 'You must enter a value';
    }
    if (this.email.hasError('email')) {
      return errorMessage =  'Not a valid email.';
    }
    return errorMessage;
  }

  get passwordErrorMessage() {
    let errorMessage = '';
    if (this.password.hasError('required')) {
      return errorMessage = 'You must enter a value';
    }
    if (this.password.hasError('minlength')) {
      return errorMessage = `Your password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
    return errorMessage;
  }

  // 1) Create authUser 2) use authUser data to create a user, 3) ensure user is verified in db and in auth, 4) route user to requested page
  onSubmit(): void {

    if (!this.firstName.dirty || !this.email.dirty || !this.password.dirty) {
      this.uiService.showSnackBar(`You must provide your login details to proceed!`, 10000);
      return;
    }

    this.emailSignupSubscription = this.combinedEmailSignupError$
      .pipe(
        map(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetComponentActionState();
            this.store$.dispatch(AuthStoreActions.logout());
          }
          return processingError;
        }),
        filter(processingError => !processingError), // Halts function if processingError detected
        switchMap(processingError => {
          if (!this.$emailAuthRequested()) {
            const authFormData: AuthFormData = {
              email: this.email.value,
              firstName: this.firstName.value,
              password: this.password.value
            };
            this.store$.dispatch(AuthStoreActions.emailSignupRequested({authFormData}));
          }
          return this.emailSignupProcessing$;
        }),
        withLatestFrom(this.authData$),
        filter(([authProcessing, authData]) => !!authData), // Only proceed once authData is available
        switchMap(([authProcessing, authData]) => {
          console.log('Auth user created', authData);
          if (!this.$createUserSubmitted()) {
            this.$createUserSubmitted.set(true);
            const partialNewUserData: Partial<PublicUser> = {
              email: authData!.email,
              firstName: this.firstName.value,
              id: authData!.id
            }
            this.store$.dispatch(UserStoreActions.createPublicUserRequested({partialNewUserData: partialNewUserData}));
          }
          return this.createUserProcessing$;
        }),
        withLatestFrom(this.userData$),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(([createProcessing, userData]) => {
          if (createProcessing) {
            this.$createUserCycleInit.set(true);
          }
          if (!createProcessing && this.$createUserCycleInit()) {
            console.log('createUser successful, proceeding with pipe.');
            this.$createUserCycleComplete.set(true);
            this.$createUserCycleInit.set(false);
          }
        }),
        filter(([createProcessing, userData]) => !createProcessing && this.$createUserCycleComplete() && !!userData),
        switchMap(([createProcessing, userData]: [boolean, PublicUser]) => {
          if (!userData?.emailVerified) {
            console.log(`User has not verified email. Waiting for verification for ${userData?.email}`);
          }
          return this.userData$;
        }),
        withLatestFrom(this.authData$),
        filter(([userData, authData]: [PublicUser, AuthResultsData]) => (userData[PublicUserKeys.EMAIL_VERIFIED] as boolean)),
        switchMap(([userData, authData]: [PublicUser, AuthResultsData]) => {
          if (userData.emailVerified && authData.emailVerified) {
            console.log('User email verified in db and auth, routing user to requested route.');
            this.redirectUserToRequestedRoute();
          }
          // Auth data needs to be reloaded after email verification is complete in order for user page to update
          if (!authData.emailVerified && !this.$reloadAuthDataSubmitted()) {
            this.$reloadAuthDataSubmitted.set(true);
            console.log(`User email verified but auth not yet updated. Submitting auth refresh request.`);
            this.store$.dispatch(AuthStoreActions.reloadAuthDataRequested());
          }
          return this.reloadAuthDataProcessing$;
        }),
        withLatestFrom(this.authData$),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(([reloadProcessing, authData]: [boolean, AuthResultsData]) => {
          if (reloadProcessing) {
            this.$reloadAuthDataCycleInit.set(true);
          }
          if (!reloadProcessing && this.$reloadAuthDataCycleInit()) {
            console.log('reloadAuthData successful, proceeding with pipe.');
            this.$reloadAuthDataCycleComplete.set(true);
            this.$reloadAuthDataCycleInit.set(false);
          }
        }),
        filter(([reloadProcessing, authData]: [boolean, AuthResultsData]) => !reloadProcessing && this.$reloadAuthDataCycleComplete() && authData.emailVerified),
        tap(([reloadProcessing, authData]: [boolean, AuthResultsData]) => {
          console.log('User email verified in db and auth, routing user to requested route.');
          this.redirectUserToRequestedRoute();
        }),
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetComponentActionState();
          this.store$.dispatch(AuthStoreActions.logout());
          return throwError(() => new Error(error));
        })
      ).subscribe();

  }

  // After the login flow is complete, redirect user to the requested route or otherwise to Workouts
  private redirectUserToRequestedRoute(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';

    if (returnUrl && returnUrl !== '/') {
      console.log('returnURL is not root, navigating to:', returnUrl);
      this.router.navigate([returnUrl]);
    } else {
      console.log(`returnUrl is root, navigating to ${[PublicAppRoutes.TRAIN_DASHBOARD]}`);
      this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
    }
  }

  private resetComponentActionState() {
    this.emailSignupSubscription?.unsubscribe();
    this.$emailAuthRequested.set(false);
    
    this.$reloadAuthDataSubmitted.set(false);
    this.$reloadAuthDataCycleInit.set(false);
    this.$reloadAuthDataCycleComplete.set(false);
    
    this.$createUserSubmitted.set(false);
    this.$createUserCycleInit.set(false);
    this.$createUserCycleComplete.set(false);

    this.store$.dispatch(AuthStoreActions.purgeAuthErrors());
    this.store$.dispatch(UserStoreActions.purgePublicUserErrors());
  }

  ngOnDestroy(): void {
    this.emailSignupSubscription?.unsubscribe();
  }

  // These getters are used for easy access in the HTML template
  get firstName() { return this.authForm.get(PublicUserKeys.FIRST_NAME) as AbstractControl; }
  get email() { return this.authForm.get(PublicUserKeys.EMAIL) as AbstractControl; }
  get password() { return this.authForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

}
