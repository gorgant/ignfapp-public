import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { RootStoreState, AuthStoreSelectors, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  loginPath = PublicAppRoutes.LOGIN;
  trustedEmailSender = EmailSenderAddresses.IGNFAPP_DEFAULT;

  authProcessingBlurb = GlobalFieldValues.LI_AUTH_PROCESSING;
  alreadyHaveAccountButtonValue = GlobalFieldValues.LI_ALREADY_HAVE_ACCOUNT;
  orBlurb = GlobalFieldValues.OR_CAPS;
  signUpWithEmailButtonValue = GlobalFieldValues.LI_SIGN_UP_WITH_EMAIL;
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
        this.store$.pipe(select(UserStoreSelectors.selectIsUpdatingUser)),
        this.store$.pipe(select(UserStoreSelectors.selectIsFetchingUser))
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
