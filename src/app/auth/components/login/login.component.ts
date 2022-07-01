import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { AuthStoreSelectors, RootStoreState, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  SIGNUP_PATH = PublicAppRoutes.SIGNUP;
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

  authStatus$!: Observable<boolean>;
  authOrUserUpdateProcessing$!: Observable<boolean>;
  
  userData$!: Observable<PublicUser>;

  useEmailLogin: boolean = false;

  constructor(
    private store$: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit(): void {
    this.checkAuthStatus();
  }

  onUseEmail() {
    this.useEmailLogin = true;
  }

  private checkAuthStatus() {
    this.authStatus$ = this.store$.pipe(select(AuthStoreSelectors.selectIsLoggedIn));
    this.authOrUserUpdateProcessing$ = combineLatest(
      [
        this.store$.pipe(select(AuthStoreSelectors.selectSignupProcessing)),
        this.store$.pipe(select(AuthStoreSelectors.selectAuthenticateUserProcessing)),
        this.store$.pipe(select(UserStoreSelectors.selectCreateUserProcessing)),
        this.store$.pipe(select(UserStoreSelectors.selectUpdateUserProcessing)),
        this.store$.pipe(select(UserStoreSelectors.selectFetchUserProcessing))
      ]
    ).pipe(
        map(([signingUp, authenticating, creatingUser, updatingUser, fetchingUser]) => {
          if (signingUp || authenticating || creatingUser || updatingUser || fetchingUser) {
            return true
          }
          return false
        })
    );
    
    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectUserData)) as Observable<PublicUser>;
  }



}
