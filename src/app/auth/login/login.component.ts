import { Component, OnInit, inject, signal } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthResultsData } from 'shared-models/auth/auth-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { AuthStoreSelectors, RootStoreState, UserStoreSelectors } from 'src/app/root-store';
import { RouterLink } from '@angular/router';
import { LoginFormComponent } from '../login-form/login-form.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LoginWithThirdPartyComponent } from '../login-with-third-party/login-with-third-party.component';
import { NgClass, AsyncPipe } from '@angular/common';
import { AuthHeaderComponent } from '../auth-header/auth-header.component';
import { ProcessingSpinnerComponent } from 'src/app/shared/components/processing-spinner/processing-spinner.component';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [AuthHeaderComponent, NgClass, LoginWithThirdPartyComponent, MatButtonModule, MatIconModule, LoginFormComponent, RouterLink, ProcessingSpinnerComponent, AsyncPipe]
})
export class LoginComponent implements OnInit {

  SIGNUP_PATH = PublicAppRoutes.AUTH_SIGNUP;
  TRUSTED_EMAIL_SENDER = EmailSenderAddresses.IGNFAPP_DEFAULT;

  AUTH_PROCESSING_BLURB = GlobalFieldValues.LI_AUTH_PROCESSING;
  CREATE_ACCOUNT_BUTTON_VALUE = GlobalFieldValues.LI_CREATE_ACCOUNT;
  OR_BLURB = GlobalFieldValues.OR_CAPS;
  SIGN_IN_WITH_EMAIL_BUTTON_VALUE = GlobalFieldValues.LI_SIGN_IN_WITH_EMAIL;
  CHECK_INBOX_BLURB_1 = GlobalFieldValues.CHECK_INBOX_1;
  CHECK_INBOX_BLURB_2 = GlobalFieldValues.CHECK_INBOX_2;
  CHECK_INBOX_BLURB_3 = GlobalFieldValues.CHECK_INBOX_3;
  CHECK_SPAM_BLURB_1 = GlobalFieldValues.CHECK_SPAM_1;
  CHECK_SPAM_BLURB_2 = GlobalFieldValues.CHECK_SPAM_2;

  authOrUserUpdateProcessing$!: Observable<boolean>;
  userData$!: Observable<PublicUser>;
  authData$!: Observable<AuthResultsData>;

  useEmailLogin = signal(false);

  private store$ = inject(Store);

  constructor() { }

  ngOnInit(): void {
    this.checkAuthStatus();
  }

  onUseEmail() {
    this.useEmailLogin.set(true);
  }

  private checkAuthStatus() {
    this.authOrUserUpdateProcessing$ = combineLatest(
      [
        this.store$.select(AuthStoreSelectors.selectEmailSignupProcessing),
        this.store$.select(AuthStoreSelectors.selectEmailAuthProcessing),
        this.store$.select(AuthStoreSelectors.selectFacebookAuthProcessing),
        this.store$.select(AuthStoreSelectors.selectGoogleAuthProcessing),
        this.store$.select(UserStoreSelectors.selectCreatePublicUserProcessing),
        this.store$.select(UserStoreSelectors.selectUpdatePublicUserProcessing),
        this.store$.select(UserStoreSelectors.selectFetchPublicUserProcessing)
      ]
    ).pipe(
        map(([signupProcessing, emailAuthProcessing, facebookAuthProcessing, googleAuthProcessing, creatingUser, updatingUser, fetchingUser]) => {
          if (signupProcessing || emailAuthProcessing || facebookAuthProcessing || googleAuthProcessing || creatingUser || updatingUser || fetchingUser) {
            return true
          }
          return false
        })
    );
    
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;
    this.authData$ = this.store$.select(AuthStoreSelectors.selectAuthResultsData) as Observable<AuthResultsData>;
  }



}
