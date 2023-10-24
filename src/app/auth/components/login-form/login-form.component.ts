import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, throwError } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
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

  private authData$!: Observable<AuthResultsData>;
  private authError$!: Observable<{} | null>;
  private authReloadProcessing$!: Observable<boolean>;
  private authSubscription!: Subscription;

  private userData$!: Observable<PublicUser>;
  
  private reloadAuthDataTriggered = signal(false);
  showResetMessage = signal(false);

  private store$ = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private uiService = inject(UiService);

  authUserForm = this.fb.group({
    [PublicUserKeys.EMAIL]: ['', [Validators.required, Validators.email]],
    [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required, Validators.minLength(6)]],
  });
  
  constructor() { }

  ngOnInit(): void {
    this.checkAuthStatus();
  }

  private checkAuthStatus() {
    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectPublicUserData)) as Observable<PublicUser>;
    this.authData$ = this.store$.pipe(select(AuthStoreSelectors.selectAuthResultsData)) as Observable<AuthResultsData>;
    this.authError$ = this.store$.pipe(select(AuthStoreSelectors.selectAuthenticateUserError));
    this.authReloadProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectReloadAuthDataProcessing)) as Observable<boolean>;
  }

  onSubmit(): void {

    const authFormData: AuthFormData = {
      email: this.email.value,
      password: this.password.value
    }

    this.store$.dispatch(AuthStoreActions.emailAuthRequested({authData: authFormData}));
    this.postAuthActions();
  }

  // After the auth is complete, update the app and database accordingly
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
          console.log('Auth data received in component', authData);
          this.updateUserInFirebase(authData);
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
  }

  private updateUserInFirebase(authData: AuthResultsData) {
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


  // After the login flow is complete, redirect user to the requested route or otherwise to Workouts
  private redirectUserToRequestedRoute(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';

    if (returnUrl && returnUrl !== '/') {
      this.router.navigate([returnUrl]);
    } else {
      this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
    }
  }

  onResetPassword() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.width = '300px';
    dialogConfig.data = this.email.value;
    console.log('Reset password requested with this config', dialogConfig);

    const dialogRef = this.dialog.open(ResetPasswordDialogueComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(submitted => {
      if (submitted) {
        this.showResetMessage.set(true);
      }
    })

  }

  // Makes login screen visible again after completing a password reset
  onRestoreLoginScreen() {
    this.showResetMessage.set(false);
  }

  private resetComponentActionState() {
    this.reloadAuthDataTriggered.set(false);
    this.showResetMessage.set(false);
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  // These getters are used for easy access in the HTML template
  get email() { return this.authUserForm.get(PublicUserKeys.EMAIL) as AbstractControl; }
  get password() { return this.authUserForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

}
