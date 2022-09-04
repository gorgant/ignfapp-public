import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AuthResultsData } from 'shared-models/auth/auth-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
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

  TRUSTED_EMAIL_SENDER = EmailSenderAddresses.IGNFAPP_DEFAULT;
  GOOGLE_LOGO_SVG = PublicImagePaths.GOOGLE_ICON;
  FACEBOOK_LOGO_SVG = PublicImagePaths.FACEBOOK_ICON;

  CONTINUE_WITH_GOOGLE_BUTTON_VALUE = GlobalFieldValues.LI_CONTINUE_WITH_GOOGLE;
  CONTINUE_WITH_FACEBOOK_BUTTON_VALUE = GlobalFieldValues.LI_CONTINUE_WITH_FACEBOOK;
  
  authProcessing$!: Observable<boolean>;
  authSubscription!: Subscription;
  authError$!: Observable<{} | null>;
  authSubmitted!: boolean;

  createUserProcessing$!: Observable<boolean>;
  createUserSubscription!: Subscription;
  createUserError$!: Observable<{} | null>;
  createUserSubmitted!: boolean;

  userUpdateProcessing$!: Observable<boolean>;
  userUpdateSubscription!: Subscription;
  userUpdateError$!: Observable<{} | null>;
  userUpdateSubmitted!: boolean;

  fetchUserProcessing$!: Observable<boolean>;
  fetchUserSubscription!: Subscription;
  fetchUserError$!: Observable<{} | null>;

  reloadAuthDataProcessing$!: Observable<boolean>;
  reloadAuthDataSubscription!: Subscription;
  reloadAuthDataError$!: Observable<{} | null>;
  reloadAuthDataSubmitted!: boolean;

  userData$!: Observable<PublicUser>;
  userFetched: boolean = false;

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.checkAuthStatus();
  }

  private checkAuthStatus() {
    
    this.authProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectAuthenticateUserProcessing));
    this.authError$ = this.store$.pipe(select(AuthStoreSelectors.selectAuthenticateUserError));

    this.createUserProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectCreatePublicUserProcessing));
    this.createUserError$ = this.store$.pipe(select(UserStoreSelectors.selectCreatePublicUserError));

    this.userUpdateProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectUpdatePublicUserProcessing));
    this.userUpdateError$ = this.store$.pipe(select(UserStoreSelectors.selectUpdatePublicUserError));

    this.fetchUserProcessing$ = this.store$.pipe(select(UserStoreSelectors.selectFetchPublicUserProcessing));
    this.fetchUserError$ = this.store$.pipe(select(UserStoreSelectors.selectFetchPublicUserError));
    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectPublicUserData)) as Observable<PublicUser>;

    this.reloadAuthDataProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectReloadAuthDataProcessing));
    this.reloadAuthDataError$ = this.store$.pipe(select(AuthStoreSelectors.selectReloadAuthDataError));

  }

  onGoogleLogin() {
    console.log('Dispatching Google login');
    this.store$.dispatch(AuthStoreActions.googleAuthRequested());
    this.postAuthActions();
  }

  onFacebookLogin() {
    console.log('Dispatching Facebook login');
    this.store$.dispatch(AuthStoreActions.facebookAuthRequested());
    this.postAuthActions();
  }

  // Update user data and navigate to dashboard
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
          return;
        }

        // If auth succeeds, proceed to next step
        if (this.authSubmitted && !authProcessing && authData) {
          console.log('User auth successful, updating user in database');
          this.authSubscription.unsubscribe(); // Clear subscription no longer needed
          
          if (authData.isNewUser) {
            console.log('New user detected in auth, creating new user in DB');
            this.createUserInFirebase(authData);
            this.postCreateUserActions(authData.id);
          } else {
            console.log('Existing user detected in auth, updating user in DB');
            this.updateUserInFirebase(authData);
            this.postUpdateUserActions(authData.id);
          }
        }
      })
  };

  private createUserInFirebase(authData: AuthResultsData) {
    const partialNewUserData: Partial<PublicUser> = {
      email: authData.email,
      firstName: authData.displayName,
      id: authData.id,
      avatarUrl: authData.avatarUrl
    }
    this.store$.dispatch(UserStoreActions.createPublicUserRequested({partialNewPublicUserData: partialNewUserData}));
  }

  private updateUserInFirebase(authResultsData: AuthResultsData) {
    const userData: Partial<PublicUser> = {
      id: authResultsData?.id,
      email: authResultsData?.email
    }
    const userUpdateData: UserUpdateData = {
      userData,
      updateType: UserUpdateType.AUTHENTICATION
    }
    this.store$.dispatch(UserStoreActions.updatePublicUserRequested({userUpdateData}));
  }

  // Fetch user and navigate to requested route
  private postCreateUserActions(userId: string) {

    this.createUserSubscription = this.createUserProcessing$
      .pipe(
        withLatestFrom(this.createUserError$)
      )
      .subscribe(([creatingUser, creationError]) => {

        if (creatingUser) {
          this.createUserSubmitted = true;
        }

        // If error creating user in database, cancel operation and delete auth user
        if (creationError) {
          console.log('Error creating user in database, deleting auth user');
          this.createUserSubscription.unsubscribe();
          this.createUserSubmitted = false;
          this.store$.dispatch(AuthStoreActions.deleteAuthUserRequested());
          this.store$.dispatch(AuthStoreActions.logout());
          return;
        }

        if (!creatingUser && this.createUserSubmitted) {
          console.log('User creation successful, fetching user data');
          this.store$.dispatch(UserStoreActions.fetchPublicUserRequested({publicUserId: userId}));
          this.createUserSubscription.unsubscribe();
          this.confirmUserEmailVerified();
        }
      })
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
          this.store$.dispatch(UserStoreActions.fetchPublicUserRequested({publicUserId: userId}));
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
      this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    if (this.userUpdateSubscription) {
      this.userUpdateSubscription.unsubscribe();
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

}
