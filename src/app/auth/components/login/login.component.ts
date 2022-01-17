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

  signupPath = PublicAppRoutes.SIGNUP;
  trustedEmailSender = EmailSenderAddresses.IGNFAPP_DEFAULT;

  authProcessingBlurb = GlobalFieldValues.LI_AUTH_PROCESSING;
  createAccountButtonValue = GlobalFieldValues.LI_CREATE_ACCOUNT;
  orBlurb = GlobalFieldValues.OR_CAPS;
  signInWithEmailButtonValue = GlobalFieldValues.LI_SIGN_IN_WITH_EMAIL;
  checkInboxBlurb1 = GlobalFieldValues.CHECK_INBOX_1;
  checkInboxBlurb2 = GlobalFieldValues.CHECK_INBOX_2;
  checkInboxBlurb3 = GlobalFieldValues.CHECK_INBOX_3;
  checkSpamBlurb1 = GlobalFieldValues.CHECK_SPAM_1;
  checkSpamBlurb2 = GlobalFieldValues.CHECK_SPAM_2;

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
        this.store$.pipe(select(AuthStoreSelectors.selectIsSigningUpUser)),
        this.store$.pipe(select(AuthStoreSelectors.selectIsAuthenticatingUser)),
        this.store$.pipe(select(UserStoreSelectors.selectIsCreatingUser)),
        this.store$.pipe(select(UserStoreSelectors.selectIsUpdatingUser))
      ]
    ).pipe(
        map(([signingUp, authenticating, creatingUser, updatingUser]) => {
          if (signingUp || authenticating || creatingUser || updatingUser) {
            return true
          }
          return false
        })
    );
    
    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectUserData)) as Observable<PublicUser>;
  }



}
