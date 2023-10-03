import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, throwError } from 'rxjs';
import { catchError, filter, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AuthResultsData } from 'shared-models/auth/auth-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicImagePaths } from 'shared-models/routes-and-paths/image-paths.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from 'shared-models/user/user-update.model';
import { AuthStoreActions, AuthStoreSelectors, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';

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
  
  private authSubscription!: Subscription;
  private authData$!: Observable<AuthResultsData>
  private userData$!: Observable<PublicUser>;
  private authReloadProcessing$!: Observable<boolean>;
  
  private reloadAuthDataTriggered!: boolean;

  private store$ = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() { }

  ngOnInit(): void {
    this.monitorUserStatus();
  }

  private monitorUserStatus() {
    this.userData$ = this.store$.pipe(select(UserStoreSelectors.selectPublicUserData)) as Observable<PublicUser>;
    this.authData$ = this.store$.pipe(select(AuthStoreSelectors.selectAuthResultsData)) as Observable<AuthResultsData>;
    this.authReloadProcessing$ = this.store$.pipe(select(AuthStoreSelectors.selectReloadAuthDataProcessing)) as Observable<boolean>;
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

  // After the auth is complete, update the app and database accordingly
  private postAuthActions() {
    this.authSubscription = this.authData$
      .pipe(
        filter(authData => !!authData), // Only proceed once auth data is available
        switchMap(authData => {
          console.log('Auth data received', authData);

          // Create new user or update existing user
          if (authData!.isNewUser) {
            console.log('New user detected in auth, creating new user in DB');
            this.createUserInFirebase(authData!);
          } else {
            console.log('Existing user detected in auth, updating user in DB');
            this.updateUserInFirebase(authData!);
          }
          return combineLatest([this.userData$, this.authData$, this.authReloadProcessing$]);
        }),
        filter(([userData, authData, authReloadProcessing]) => !!userData && !!authData && !authReloadProcessing), // Only proceed once user data is available
        tap(([userData, authData, authReloadProcessing]) => {
          if (!userData.emailVerified) {
            console.log(`User has not verified email. Waiting for verification for ${userData.email}`);
          }
          // Auth data needs to be reloaded after email verification is complete in order for user page to update
          if (userData.emailVerified && !authData.emailVerified && !this.reloadAuthDataTriggered) {
            console.log(`User email verified but auth not yet updated. Submitting auth refresh request.`);
            this.store$.dispatch(AuthStoreActions.reloadAuthDataRequested());
            this.reloadAuthDataTriggered = true;
          }
          if (userData.emailVerified && authData.emailVerified) {
            console.log('User email verified in db and auth, routing user to requested route.');
            this.redirectUserToRequestedRoute();
          }
        }),
        catchError(error => {
          console.log('Error authorizing user, logging out', error);
          this.store$.dispatch(AuthStoreActions.logout());
          return throwError(() => new Error(error));
        })
      )
      .subscribe();
  }

  // After the login flow is complete, redirect user to the requested route or otherwise to Workouts
  private redirectUserToRequestedRoute(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';

    if (returnUrl && returnUrl !== '/') {
      console.log('returnURL is not root, navigating to:', returnUrl);
      this.router.navigate([returnUrl]);
    } else {
      console.log('returnUrl is root, navigating to train');
      this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
    }
  }

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

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

}
