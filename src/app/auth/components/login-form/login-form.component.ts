import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AuthFormData, AuthResultsData } from 'shared-models/auth/auth-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { UserRegistrationFormFieldKeys } from 'shared-models/forms/user-registration-form-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from 'shared-models/user/user-update.model';
import { AuthStoreActions, AuthStoreSelectors, RootStoreState, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';
import { ResetPasswordDialogueComponent } from '../reset-password-dialogue/reset-password-dialogue.component';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit, OnDestroy {

  authUserForm!: FormGroup;
  formValidationMessages = UserRegistrationFormValidationMessages;
  
  emailFieldValue = GlobalFieldValues.EMAIL;
  passwordFieldValue = GlobalFieldValues.PASSWORD;
  forgotPasswordBlurb = GlobalFieldValues.RP_FORGOT_PASSWORD;
  checkInboxBlurb = GlobalFieldValues.RP_CHECK_INBOX;
  logInButtonValue = GlobalFieldValues.LOGIN;

  authProcessing$!: Observable<boolean>;
  authSubscription!: Subscription;
  authError$!: Observable<{} | undefined>;
  authSubmitted!: boolean;

  userUpdateProcessing$!: Observable<boolean>;
  userUpdateSubscription!: Subscription;
  userUpdateError$!: Observable<{} | undefined>;
  userUpdateSubmitted!: boolean;

  fetchUserProcessing$!: Observable<boolean>;
  fetchUserSubscription!: Subscription;
  fetchUserError$!: Observable<{} | undefined>;

  reloadAuthDataProcessing$!: Observable<boolean>;
  reloadAuthDataSubscription!: Subscription;
  reloadAuthDataError$!: Observable<{} | undefined>;
  reloadAuthDataSubmitted!: boolean;

  userData$!: Observable<PublicUser>;
  userFetched: boolean = false;
  
  showResetMessage: boolean = false;
  
  
  constructor(
    private fb: FormBuilder,
    private store$: Store<RootStoreState.AppState>,
    private router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkAuthStatus();
  }

  private checkAuthStatus() {

    this.authProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectIsAuthenticatingUser));
    this.authError$ = this.store$.pipe(select(AuthStoreSelectors.selectAuthError));

    this.userUpdateProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectIsUpdatingUser));
    this.userUpdateError$ = this.store$.pipe(select(UserStoreSelectors.selectUpdateUserError));

    this.fetchUserProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectIsFetchingUser));
    this.fetchUserError$ = this.store$.pipe(select(UserStoreSelectors.selectFetchUserError));
    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectUserData)) as Observable<PublicUser>;

    this.reloadAuthDataProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectIsReloadingAuthData));
    this.reloadAuthDataError$ = this.store$.pipe(select(AuthStoreSelectors.selectReloadAuthDataError));

  }

  private initForm(): void {
    this.authUserForm = this.fb.group({
      [PublicUserKeys.EMAIL]: ['', [Validators.required, Validators.email]],
      [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {

    const authFormData: AuthFormData = {
      email: this.email.value,
      password: this.password.value
    }

    this.store$.dispatch(AuthStoreActions.emailAuthRequested({authData: authFormData}));
    this.postAuthActions();
  }

  // Update user data
  private postAuthActions() {

    this.authSubscription = this.authProcessing$
      .pipe(
        withLatestFrom(
          this.authError$,
          this.store$.pipe(select(AuthStoreSelectors.selectAuthResultsData))
        )
      )
      .subscribe(([authProcessing, authError, authData]) => {

        if (authProcessing) {
          this.authSubmitted = true;
        }

        // If error in auth, cancel operation
        if (authError) {
          console.log('Error authorizing user, resetting form');
          this.authSubscription.unsubscribe();
          this.authSubmitted = false;
          this.authUserForm.reset();
          return;
        }

        // If auth succeeds, proceed to next step
        if (this.authSubmitted && !authProcessing && authData) {
          console.log('User auth successful, updating user in database');
          this.authSubscription.unsubscribe(); // Clear subscription no longer needed
          this.updateUserInFirebase(authData);
          this.postUpdateUserActions(authData.id as string);
        }
      })
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
    this.store$.dispatch(UserStoreActions.updateUserRequested({userUpdateData}));
  }

  // Fetch user and navigate to requested route
  private postUpdateUserActions(userId: string) {

    this.userUpdateSubscription = this.userUpdateProcessing$
      .pipe(
        withLatestFrom(this.userUpdateError$)
      )
      .subscribe(([updateProcessing, updateError]) => {

        if (updateProcessing) {
          this.userUpdateSubmitted = true;
        }

        // If error updating user in database, cancel operation and log out user
        if (updateError) {
          console.log('Error updating user in database, logging out user');
          this.userUpdateSubscription.unsubscribe();
          this.userUpdateSubmitted = false;
          this.store$.dispatch(AuthStoreActions.logout());
          return;
        }

        if (!updateProcessing && this.userUpdateSubmitted) {
          console.log('User update successful, fetching user data');
          this.store$.dispatch(UserStoreActions.fetchUserRequested({userId}));
          this.userUpdateSubscription.unsubscribe();
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
          this.fetchUserError$,
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

  // After the login flow is complete, redirect user to the requested route or otherwise to Workouts
  private redirectUserToRequestedRoute(): void {

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';

    if (returnUrl && returnUrl !== '/') {
      this.router.navigate([returnUrl]);
    } else {
      this.router.navigate([PublicAppRoutes.WORKOUT]);
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
        this.showResetMessage = true;
      }
    })

  }

  // Makes login screen visible again after completing a password reset
  onRestoreLoginScreen() {
    this.showResetMessage = false;
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    if (this.userUpdateSubscription) {
      this.userUpdateSubscription.unsubscribe();
    }

    if (this.fetchUserSubscription) {
      this.fetchUserSubscription.unsubscribe();
    }

    if (this.reloadAuthDataSubscription) {
      this.reloadAuthDataSubscription.unsubscribe();
    }

  }

  // These getters are used for easy access in the HTML template
  get email() { return this.authUserForm.get(PublicUserKeys.EMAIL) as AbstractControl; }
  get password() { return this.authUserForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

}
