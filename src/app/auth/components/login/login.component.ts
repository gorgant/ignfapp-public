import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  authStatus$!: Observable<boolean>;
  authOrUserUpdateProcessing$!: Observable<boolean>;
  
  userData$!: Observable<PublicUser>;

  useEmailLogin: boolean = false;

  constructor(
    private store: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit(): void {
    this.checkAuthStatus();
  }

  onUseEmail() {
    this.useEmailLogin = true;
  }

  private checkAuthStatus() {
    this.authStatus$ = this.store.pipe(select(AuthStoreSelectors.selectIsLoggedIn));
    this.authOrUserUpdateProcessing$ = combineLatest(
      [
        this.store.pipe(select(AuthStoreSelectors.selectIsSigningUpUser)),
        this.store.pipe(select(AuthStoreSelectors.selectIsAuthenticatingUser)),
        this.store.pipe(select(UserStoreSelectors.selectIsCreatingUser)),
        this.store.pipe(select(UserStoreSelectors.selectIsUpdatingUser))
      ]
    ).pipe(
        map(([signingUp, authenticating, creatingUser, updatingUser]) => {
          if (signingUp || authenticating || creatingUser || updatingUser) {
            return true
          }
          return false
        })
    );
    
    this.userData$ = this.store.pipe(select(UserStoreSelectors.selectUserData)) as Observable<PublicUser>;
  }



}
