import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { AuthFormData } from 'shared-models/auth/auth-data.model';
import { UserRegistrationButtonValues, UserRegistrationFormFieldKeys, UserRegistrationFormFieldValues } from 'shared-models/forms/user-registration-form-vals.model';
import { UserRegistrationFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser } from 'shared-models/user/public-user.model';
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
  formFieldKeys = UserRegistrationFormFieldKeys;
  formValidationMessages = UserRegistrationFormValidationMessages;
  emailFieldValue = UserRegistrationFormFieldValues.EMAIL;
  passwordFieldValue = UserRegistrationFormFieldValues.PASSWORD;
  submitButtonValue = UserRegistrationButtonValues.LOGIN;

  authStatus$!: Observable<boolean>;
  authOrUserUpdateProcessing$!: Observable<boolean>;
  userFetched: boolean = false;
  
  userData$!: Observable<PublicUser>;
  
  authSubscription!: Subscription;
  userSubscription!: Subscription;
  
  useEmailLogin: boolean = false;
  showResetMessage: boolean = false;

  constructor(
    private fb: FormBuilder,
    private store: Store<RootStoreState.AppState>,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkAuthStatus();
  }

  private checkAuthStatus() {
    this.authStatus$ = this.store.pipe(select(AuthStoreSelectors.selectIsLoggedIn));
    this.authOrUserUpdateProcessing$ = combineLatest(
      [
        this.store.pipe(select(AuthStoreSelectors.selectIsAuthenticatingUser)),
        this.store.pipe(select(UserStoreSelectors.selectIsUpdatingUser))
      ]
    ).pipe(
        map(([authenticating, updatingUser]) => {
          if (authenticating || updatingUser) {
            return true
          }
          return false
        })
    );
    this.userData$ = this.store.pipe(select(UserStoreSelectors.selectUserData)) as Observable<PublicUser>;
  }

  private initForm(): void {
    this.authUserForm = this.fb.group({
      [UserRegistrationFormFieldKeys.EMAIL]: ['', [Validators.required, Validators.email]],
      [UserRegistrationFormFieldKeys.PASSWORD]: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onUseEmail() {
    this.useEmailLogin = true;
  }

  onSubmit(): void {

    const authFormData: AuthFormData = {
      email: this.email.value,
      password: this.password.value
    }

    this.store.dispatch(AuthStoreActions.emailAuthRequested({authData: authFormData}));
    this.postAuthActions();
  }

  // Update user data and navigate to dashboard
  private postAuthActions() {
    this.authSubscription = this.authStatus$
      .pipe(
        withLatestFrom(this.store.pipe(select(AuthStoreSelectors.selectAuthResultsData)))
      )
    
      .subscribe(([isAuth, authResultsData]) => {
        if(isAuth) {
          const userData: Partial<PublicUser> = {
            id: authResultsData?.id,
            email: authResultsData?.email
          }
          const userUpdateData: UserUpdateData = {
            userData,
            updateType: UserUpdateType.AUTHENTICATION
          }
          this.store.dispatch(UserStoreActions.updateUserRequested({userUpdateData}))
          this.postUserUpdateActions(userData.id as string);
        }
      });
  }

  private postUserUpdateActions(userId: string) {
    this.userSubscription = this.userData$
      .pipe(
        withLatestFrom(this.authOrUserUpdateProcessing$)
      )
      .subscribe(([user, authProcessing]) => {
        // Need to check for user here bc there's a short gap in signupProcessing btw auth and user creation
        if (user && !authProcessing && !this.userFetched) {
          this.store.dispatch(UserStoreActions.fetchUserRequested({userId})); // Establish a realtime link to user data in store to mointor email verification status
          this.userFetched = true;
        }
        
        // If email is verified, proceed to dashboard (otherwise email verification request is provided)
        if (user?.emailVerified) {
          console.log('Email verified, routing user to dashboard');
          this.router.navigate([PublicAppRoutes.DASHBOARD]);
        }

        if (user && !user?.emailVerified) {
          // FYI Prompt is shown in parent container
          console.log(`User has not verified email. Requesting verification for ${user.email}`);
        }
      })
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

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }

  }

  // These getters are used for easy access in the HTML template
  get email() { return this.authUserForm.get(UserRegistrationFormFieldKeys.EMAIL) as AbstractControl; }
  get password() { return this.authUserForm.get(UserRegistrationFormFieldKeys.PASSWORD) as AbstractControl; }

}
