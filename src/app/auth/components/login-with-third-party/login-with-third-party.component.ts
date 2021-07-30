import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { AuthResultsData } from 'shared-models/auth/auth-data.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicImagePaths } from 'shared-models/routes-and-paths/image-paths.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from 'shared-models/user/user-update.model';
import { AuthStoreActions, AuthStoreSelectors, RootStoreState, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-login-with-third-party',
  templateUrl: './login-with-third-party.component.html',
  styleUrls: ['./login-with-third-party.component.scss']
})
export class LoginWithThirdPartyComponent implements OnInit {

  trustedEmailSender = EmailSenderAddresses.IGNFAPP_DEFAULT;
  googleLogoSvg = PublicImagePaths.GOOGLE_ICON;
  facebookLogoSvg = PublicImagePaths.FACEBOOK_ICON;
  
  authStatus$!: Observable<boolean>;
  authOrUserUpdateProcessing$!: Observable<boolean>;
  authResultsData$!: Observable<AuthResultsData>;
  userFetched: boolean = false;

  userData$!: Observable<PublicUser>;

  authSubscription!: Subscription;
  userSubscription!: Subscription;

  constructor(
    private store: Store<RootStoreState.AppState>,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.checkAuthStatus();
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
    this.authResultsData$ = this.store.pipe(select(AuthStoreSelectors.selectAuthResultsData)) as Observable<AuthResultsData>;
    this.userData$ = this.store.pipe(select(UserStoreSelectors.selectUserData)) as Observable<PublicUser>;
  }

  onGoogleLogin() {
    this.store.dispatch(AuthStoreActions.googleAuthRequested());
    this.postAuthActions();
  }

  onFacebookLogin() {
    console.log('Dispatching facebook login');
    this.store.dispatch(AuthStoreActions.facebookAuthRequested());
    this.postAuthActions();
  }

  // Update user data and navigate to dashboard
  private postAuthActions() {
    console.log('Dispatching post-auth actions');
    this.authSubscription = this.authStatus$
      .pipe(
        withLatestFrom(
          this.store.pipe(select(AuthStoreSelectors.selectAuthResultsData)),
          this.store.pipe(select(UserStoreSelectors.selectIsCreatingUser))
        )
      )
      .subscribe(([isAuth, authResultsData, isCreatingUser]) => {
        if (isAuth && authResultsData && !isCreatingUser) {

          // Either create or update user data
          if (authResultsData.isNewUser) {
            console.log('New user detected, creating new user in DB');
            this.createNewUser(authResultsData);
          } else {
            console.log('Existing user detected, updating user in DB');
            this.updateExistingUser(authResultsData);
          }
        }
    })
  };

  private createNewUser(authResultsData: AuthResultsData) {
    const partialNewUserData: Partial<PublicUser> = {
      email: authResultsData.email,
      firstName: authResultsData.displayName,
      id: authResultsData.id,
      avatarUrl: authResultsData.avatarUrl
    }
    this.store.dispatch(UserStoreActions.createUserRequested({partialNewUserData}));
    this.postUserUpdateActions(partialNewUserData.id as string);
  }

  private updateExistingUser(authResultsData: AuthResultsData) {
    const userData: Partial<PublicUser> = {
      id: authResultsData?.id,
      email: authResultsData?.email
    }
    const userUpdateData: UserUpdateData = {
      userData,
      updateType: UserUpdateType.AUTHENTICATION
    }
    this.store.dispatch(UserStoreActions.updateUserRequested({userUpdateData}));
    this.postUserUpdateActions(userData.id as string);
  }

  private postUserUpdateActions(userId: string) {
    console.log('Dispatching post-user-update actions with this user id: ', userId);
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

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    
  }

}
