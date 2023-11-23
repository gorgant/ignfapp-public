import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AuthFormData, AuthResultsData } from 'shared-models/auth/auth-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UserRegistrationFormFieldKeys } from 'shared-models/forms/user-registration-form-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from 'shared-models/user/user-update.model';
import { AuthStoreActions, AuthStoreSelectors, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';
import { ResetPasswordDialogueComponent } from '../reset-password-dialogue/reset-password-dialogue.component';
import { UiService } from 'src/app/core/services/ui.service';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit, OnDestroy {

  FORM_VALIDATION_MESSAGES = UserRegistrationFormValidationMessages;
  
  EMAIL_FIELD_VALUE = GlobalFieldValues.EMAIL;
  PASSWORD_FIELD_VALUE = GlobalFieldValues.PASSWORD;
  FORGOT_PASSWORD_BLURB = GlobalFieldValues.RP_FORGOT_PASSWORD;
  CHECK_INBOX_BLURB = GlobalFieldValues.RP_CHECK_INBOX;
  LOG_IN_BUTTON_VALUE = GlobalFieldValues.LOGIN;

  private authData$!: Observable<AuthResultsData | null>;
  private userData$!: Observable<PublicUser | null>;

  private $emailAuthRequested = signal(false);
  private emailAuthError$!: Observable<{} | null>;
  private emailAuthProcessing$!: Observable<boolean>;
  private emailAuthSubscription!: Subscription;
  
  private $reloadAuthDataSubmitted = signal(false);
  private $reloadAuthDataCycleInit = signal(false);
  private $reloadAuthDataCycleComplete = signal(false);
  private reloadAuthDataError$!: Observable<{} | null>;
  private reloadAuthDataProcessing$!: Observable<boolean>;
  
  private $updateUserSubmitted = signal(false);
  private $updateUserCycleInit = signal(false);
  private $updateUserCycleComplete = signal(false);
  private updateUserError$!: Observable<{} | null>;
  private updateUserProcessing$!: Observable<boolean>;

  combinedAuthenticateUserError$!: Observable<any>;
  
  $showResetMessage = signal(false);

  private store$ = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private uiService = inject(UiService);

  authForm = this.fb.group({
    [PublicUserKeys.EMAIL]: ['', [Validators.required, Validators.email]],
    [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required]],
  });
  

  constructor() { }

  ngOnInit(): void {
    this.checkAuthStatus();
  }

  private checkAuthStatus() {
    this.authData$ = this.store$.select(AuthStoreSelectors.selectAuthResultsData);
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData);

    this.emailAuthError$ = this.store$.select(AuthStoreSelectors.selectEmailAuthError);
    this.emailAuthProcessing$ = this.store$.select(AuthStoreSelectors.selectEmailAuthProcessing);

    this.reloadAuthDataError$ = this.store$.select(AuthStoreSelectors.selectReloadAuthDataError);
    this.reloadAuthDataProcessing$ = this.store$.select(AuthStoreSelectors.selectReloadAuthDataProcessing);

    this.updateUserError$ = this.store$.select(UserStoreSelectors.selectUpdatePublicUserError);
    this.updateUserProcessing$ = this.store$.select(UserStoreSelectors.selectUpdatePublicUserProcessing);

    this.combinedAuthenticateUserError$ = combineLatest(
      [
        this.emailAuthError$,
        this.reloadAuthDataError$,
        this.updateUserError$
      ]
    ).pipe(
        map(([authError, reloadError, updateError]) => {
          if (authError || reloadError || updateError) {
            return authError || reloadError || updateError;
          }
          return null;
        })
    );
    
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
    return errorMessage;
  }

  // 1) Fetch authData 2) use authData to create or update user, 3) ensure user is verified in db and in auth, 4) route user to requested page
  onSubmit(): void {

    if (!this.email.dirty || !this.password.dirty) {
      this.uiService.showSnackBar(`You must provide your login details to proceed!`, 10000);
      return;
    }

    this.emailAuthSubscription = this.combinedAuthenticateUserError$
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
            this.$emailAuthRequested.set(true);
            const authFormData: AuthFormData = {
              email: this.email.value,
              password: this.password.value
            }
            this.store$.dispatch(AuthStoreActions.emailAuthRequested({authData: authFormData}));
          }
          return this.emailAuthProcessing$;
        }),
        withLatestFrom(this.authData$),
        filter(([authProcessing, authData]) => !!authData), // Only proceed once authData is available
        switchMap(([authProcessing, authData]) => {
          console.log('User authenticated', authData);
          if (!this.$updateUserSubmitted()) {
            this.$updateUserSubmitted.set(true);
            const userData: Partial<PublicUser> = {
              id: authData?.id,
              email: authData?.email
            }
            const userUpdateData: UserUpdateData = {
              userData,
              updateType: UserUpdateType.AUTHENTICATION
            }
            this.store$.dispatch(UserStoreActions.updatePublicUserRequested({userUpdateData}));
          }
          return this.updateUserProcessing$;
        }),
        withLatestFrom(this.userData$),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(([updateProcessing, userData]) => {
          if (updateProcessing) {
            this.$updateUserCycleInit.set(true);
          }
          if (!updateProcessing && this.$updateUserCycleInit()) {
            console.log('updateUser successful, proceeding with pipe.');
            this.$updateUserCycleComplete.set(true);
            this.$updateUserCycleInit.set(false);
          }
        }),
        filter(([updateProcessing, userData]) => !updateProcessing && this.$updateUserCycleComplete() && !!userData),
        switchMap(([updateProcessing, userData]: [boolean, PublicUser]) => {
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

  onResetPassword() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.width = '100%';
    dialogConfig.minHeight = '300px';
    dialogConfig.data = this.email.value;
    console.log('Reset password requested with this config', dialogConfig);

    const dialogRef = this.dialog.open(ResetPasswordDialogueComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(submitted => {
      if (submitted) {
        this.$showResetMessage.set(true);
      }
    })

  }

  // Makes login screen visible again after completing a password reset
  onRestoreLoginScreen() {
    this.$showResetMessage.set(false);
  }

  private resetComponentActionState() {
    this.emailAuthSubscription?.unsubscribe();
    this.$emailAuthRequested.set(false);
    
    this.$reloadAuthDataSubmitted.set(false);
    this.$reloadAuthDataCycleInit.set(false);
    this.$reloadAuthDataCycleComplete.set(false);
    
    this.$updateUserSubmitted.set(false);
    this.$updateUserCycleInit.set(false);
    this.$updateUserCycleComplete.set(false);

    this.$showResetMessage.set(false);

    this.store$.dispatch(AuthStoreActions.purgeAuthErrors());
    this.store$.dispatch(UserStoreActions.purgePublicUserErrors());
  }

  ngOnDestroy() {
    this.emailAuthSubscription?.unsubscribe();
  }

  // These getters are used for easy access in the HTML template
  get email() { return this.authForm.get(PublicUserKeys.EMAIL) as AbstractControl; }
  get password() { return this.authForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

}
