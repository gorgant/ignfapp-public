import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, throwError, catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs';
import { AuthResultsData } from 'shared-models/auth/auth-data.model';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { EmailSenderAddresses } from 'shared-models/email/email-vars.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicImagePaths } from 'shared-models/routes-and-paths/image-paths.model';
import { PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UserUpdateData, UserUpdateType } from 'shared-models/user/user-update.model';
import { UiService } from 'src/app/core/services/ui.service';
import { AuthStoreActions, AuthStoreSelectors, UserStoreActions, UserStoreSelectors } from 'src/app/root-store';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-login-with-third-party',
    templateUrl: './login-with-third-party.component.html',
    styleUrls: ['./login-with-third-party.component.scss'],
    standalone: true,
    imports: [MatButtonModule, MatIconModule]
})
export class LoginWithThirdPartyComponent implements OnInit {

  TRUSTED_EMAIL_SENDER = EmailSenderAddresses.IGNFAPP_DEFAULT;
  GOOGLE_LOGO_SVG = PublicImagePaths.GOOGLE_ICON;
  FACEBOOK_LOGO_SVG = PublicImagePaths.FACEBOOK_ICON;

  CONTINUE_WITH_GOOGLE_BUTTON_VALUE = GlobalFieldValues.LI_CONTINUE_WITH_GOOGLE;
  CONTINUE_WITH_FACEBOOK_BUTTON_VALUE = GlobalFieldValues.LI_CONTINUE_WITH_FACEBOOK;
  
  private authData$!: Observable<AuthResultsData | null>;
  private userData$!: Observable<PublicUser | null>;

  private authenticateUserSubscription!: Subscription;

  private facebookAuthError$!: Observable<{} | null>;
  private facebookAuthProcessing$!: Observable<boolean>;
  private googleAuthError$!: Observable<{} | null>;
  private googleAuthProcessing$!: Observable<boolean>;
  
  private $reloadAuthDataSubmitted = signal(false);
  private $reloadAuthDataCycleInit = signal(false);
  private $reloadAuthDataCycleComplete = signal(false);
  private reloadAuthDataError$!: Observable<{} | null>;
  private reloadAuthDataProcessing$!: Observable<boolean>;
  
  private $createOrUpdateUserSubmitted = signal(false);
  private $createOrUpdateUserCycleInit = signal(false);
  private $createOrUpdateUserCycleComplete = signal(false);
  private createUserError$!: Observable<{} | null>;
  private createUserProcessing$!: Observable<boolean>;
  private updateUserError$!: Observable<{} | null>;
  private updateUserProcessing$!: Observable<boolean>;

  combinedAuthenticateUserError$!: Observable<any>;

  private store$ = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private uiService = inject(UiService);



  constructor() { }

  ngOnInit(): void {
    this.monitorUserStatus();
  }

  private monitorUserStatus() {
    this.authData$ = this.store$.select(AuthStoreSelectors.selectAuthResultsData);
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData);

    this.facebookAuthError$ = this.store$.select(AuthStoreSelectors.selectFacebookAuthError);
    this.facebookAuthProcessing$ = this.store$.select(AuthStoreSelectors.selectFacebookAuthProcessing);
    
    this.googleAuthError$ = this.store$.select(AuthStoreSelectors.selectGoogleAuthError);
    this.googleAuthProcessing$ = this.store$.select(AuthStoreSelectors.selectGoogleAuthProcessing);

    this.reloadAuthDataError$ = this.store$.select(AuthStoreSelectors.selectReloadAuthDataError);
    this.reloadAuthDataProcessing$ = this.store$.select(AuthStoreSelectors.selectReloadAuthDataProcessing);

    this.createUserError$ = this.store$.select(UserStoreSelectors.selectCreatePublicUserError);
    this.createUserProcessing$ = this.store$.select(UserStoreSelectors.selectCreatePublicUserProcessing);

    this.updateUserError$ = this.store$.select(UserStoreSelectors.selectUpdatePublicUserError);
    this.updateUserProcessing$ = this.store$.select(UserStoreSelectors.selectUpdatePublicUserProcessing);

    this.combinedAuthenticateUserError$ = combineLatest(
      [
        this.facebookAuthError$,
        this.googleAuthError$,
        this.reloadAuthDataError$,
        this.updateUserError$
      ]
    ).pipe(
        map(([facebookAuthError, googleAuthError, reloadError, updateError]) => {
          if (facebookAuthError || googleAuthError || reloadError || updateError) {
            return facebookAuthError || googleAuthError || reloadError || updateError;
          }
          return null;
        })
    );
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

  // 1) Wait for authData 2) use authData to create or update user, 3) ensure user is verified in db and in auth, 4) route user to requested page
  private postAuthActions() {

    this.authenticateUserSubscription = this.combinedAuthenticateUserError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetComponentState();
            this.store$.dispatch(AuthStoreActions.logout());
          }
          return this.authData$;
        }),
        withLatestFrom(this.combinedAuthenticateUserError$),
        filter(([authData, processingError]) => !processingError && !!authData), // Only proceed once authData is available
        switchMap(([authData, processingError]) => {
          console.log('Auth data received in component', authData);

          // Create new user
          if (authData!.isNewUser && !this.$createOrUpdateUserSubmitted()) {
            console.log('New user detected in auth, creating new user in DB');
            this.createUserInFirebase(authData!);
          }

          // Otherwise, update existing user
          if (!authData!.isNewUser && !this.$createOrUpdateUserSubmitted()) {
            console.log('Existing user detected in auth, updating user in DB');
            this.updateUserInFirebase(authData!);
          }

          return combineLatest([this.createUserProcessing$, this.updateUserProcessing$])
        }),
        withLatestFrom(this.userData$, this.authData$),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(([[createProcessing, updateProcessing], userData, authData]) => {
          if (createProcessing || updateProcessing) {
            this.$createOrUpdateUserCycleInit.set(true);
          }
          if (!createProcessing && !updateProcessing && this.$createOrUpdateUserCycleInit()) {
            console.log('createUser or updateUser successful, proceeding with pipe.');
            this.$createOrUpdateUserCycleComplete.set(true);
            this.$createOrUpdateUserCycleInit.set(false);
          }
        }),
        filter(([[createProcessing, updateProcessing], userData, authData]) => !createProcessing && !updateProcessing && this.$createOrUpdateUserCycleComplete() && !!userData),
        tap(([[createProcessing, updateProcessing], userData, authData]) => {
          if (!userData?.emailVerified) {
            console.log(`User has not verified email. Waiting for verification for ${userData?.email}`);
          }
        }),
        filter(([[createProcessing, updateProcessing], userData, authData]) => (userData![PublicUserKeys.EMAIL_VERIFIED] as boolean)),
        switchMap(([[createProcessing, updateProcessing], userData, authData]: [[boolean, boolean], PublicUser, AuthResultsData]) => {
          if (userData!.emailVerified && authData!.emailVerified) {
            console.log('User email verified in db and auth, routing user to requested route.');
            this.redirectUserToRequestedRoute();
          }
          // Auth data needs to be reloaded after email verification is complete in order for user page to update
          if (!authData?.emailVerified && !this.$reloadAuthDataSubmitted()) {
            this.$reloadAuthDataSubmitted.set(true);
            console.log(`User email verified but auth not yet updated. Submitting auth refresh request.`);
            this.store$.dispatch(AuthStoreActions.reloadAuthDataRequested());
          }
          return this.reloadAuthDataProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap((reloadProcessing: boolean) => {
          if (reloadProcessing) {
            this.$reloadAuthDataCycleInit.set(true);
          }
          if (!reloadProcessing && this.$reloadAuthDataCycleInit()) {
            console.log('reloadAuthData successful, proceeding with pipe.');
            this.$reloadAuthDataCycleComplete.set(true);
            this.$reloadAuthDataCycleInit.set(false);
          }
        }),
        withLatestFrom(this.authData$),
        filter(([reloadProcessing, authData]: [boolean, AuthResultsData]) => !reloadProcessing && this.$reloadAuthDataCycleComplete() && authData.emailVerified),
        tap(([reloadProcessing, authData]: [boolean, AuthResultsData]) => {
          console.log('User email verified in db and auth, routing user to requested route.');
          this.redirectUserToRequestedRoute();
        }),
        catchError((error: any) => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetComponentState();
          this.store$.dispatch(AuthStoreActions.logout());
          return throwError(() => new Error(error));
        })
      ).subscribe();
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
    this.$createOrUpdateUserSubmitted.set(true);
    const partialNewUserData: Partial<PublicUser> = {
      email: authData.email,
      firstName: authData.displayName,
      id: authData.id,
      avatarUrl: authData.avatarUrl
    }
    this.store$.dispatch(UserStoreActions.createPublicUserRequested({partialNewUserData: partialNewUserData}));
    
  }

  private updateUserInFirebase(authResultsData: AuthResultsData) {
    this.$createOrUpdateUserSubmitted.set(true);
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

  private resetComponentState() {
    this.authenticateUserSubscription?.unsubscribe();
    
    this.$reloadAuthDataSubmitted.set(false);
    this.$createOrUpdateUserSubmitted.set(false);
    this.store$.dispatch(AuthStoreActions.purgeAuthErrors());
    this.store$.dispatch(UserStoreActions.purgePublicUserErrors());

    this.$createOrUpdateUserSubmitted.set(false);
    this.$createOrUpdateUserCycleInit.set(false);
    this.$createOrUpdateUserCycleComplete.set(false);

    this.$reloadAuthDataSubmitted.set(false);
    this.$reloadAuthDataCycleInit.set(false);
    this.$reloadAuthDataCycleComplete.set(false);
    
    this.store$.dispatch(AuthStoreActions.purgeAuthErrors());
    this.store$.dispatch(UserStoreActions.purgePublicUserErrors());
  }

  ngOnDestroy(): void {
    this.authenticateUserSubscription?.unsubscribe();
  }

}
