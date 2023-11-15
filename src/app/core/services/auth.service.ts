import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, authState, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, User, reload, deleteUser } from '@angular/fire/auth';
import { Functions, httpsCallableData }  from '@angular/fire/functions';
import { UiService } from 'src/app/core/services/ui.service';
import { from, Observable, Subject, throwError } from 'rxjs';
import { take, map, catchError, switchMap, takeUntil, filter, shareReplay } from 'rxjs/operators';
import { AuthFormData, AuthResultsData } from 'shared-models/auth/auth-data.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { EmailVerificationData } from 'shared-models/email/email-verification-data';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';
import { AuthCredential, createUserWithEmailAndPassword, FacebookAuthProvider, getAdditionalUserInfo } from 'firebase/auth';
import { PasswordConfirmationData } from 'shared-models/auth/password-confirmation-data.model';
import { Store } from '@ngrx/store';
import { PersonalSessionFragmentStoreActions, PlanSessionFragmentStoreActions, TrainingPlanStoreActions, TrainingRecordStoreActions, TrainingSessionStoreActions, UserStoreActions } from 'src/app/root-store';
import { EmailUpdateData } from 'shared-models/email/email-update-data.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private ngUnsubscribe$: Subject<void> = new Subject();
  
  private functions = inject(Functions);
  private router = inject(Router);
  private uiService = inject(UiService);
  private auth = inject(Auth);
  private store$ = inject(Store);
  private authCheckInitialized = false;

  constructor() {

    // If auth credentials are ever removed (eg. on a separate browser), immediately route user to login (disable for prod prelaunch mode)
    authState(this.auth)
      .subscribe(authState => {
        // Disable this for email verification route
        if (!authState && !this.router.url.includes(PublicAppRoutes.AUTH_EMAIL_VERIFICATION) && this.authCheckInitialized) {
          console.log('Auth state auto logout initialized')
          this.router.navigate([PublicAppRoutes.AUTH_LOGIN]);
          this.logout();
        }
        this.authCheckInitialized = true; // prevents this logout from triggering on the initial load, which was canceling out the returnUrl param from the Authguard
      });
  }

  // Confirm User Password
  confirmPassword(passwordConfirmationData: PasswordConfirmationData): Observable<boolean> {

    const userCredentials = this.getUserCredentials(passwordConfirmationData.email, passwordConfirmationData.password);

    const authResponse = from(
      authState(this.auth).pipe(
        take(1),
        switchMap(authUser => {
          const reauthResults = reauthenticateWithCredential(authUser!, userCredentials);
          return reauthResults;
        }),
        map(reauthResults => {
          if (!reauthResults) {
            console.log('Password confirmation failed');
            throw new Error('Password confirmation failed');
          }
          console.log('Password confirmed');
          return true;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error confirming password in auth', error);
          return throwError(() => new Error(error));
        })
      )
    );

    return authResponse;
  }

  deleteAuthUser(): Observable<boolean> {
    const authResponse = from(
      authState(this.auth).pipe(
        take(1),
        switchMap(authUser => {
          const deleteResults = deleteUser(authUser as User);
          return deleteResults;
        }),
        map(empty => {
          console.log('User deleted');
          return true;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error deleting user in auth', error);
          return throwError(() => new Error(error));
        })
      )
    );

    return authResponse;
  }

  // Detect cached user data
  fetchCachedUserData(): Observable<AuthResultsData | null> {
    return authState(this.auth)
      .pipe(
        takeUntil(this.unsubTrigger$),
        map(creds => {
          if (creds) {
            console.log('Fetched cached user data', creds);
            const authResultsData: AuthResultsData = {
              id: creds.uid,
              email: creds.email as string,
              emailVerified: creds.emailVerified
            }
            return authResultsData;
          }
          return null;
        }),
        shareReplay(),
      );
  }

  

  loginWithEmail(authData: AuthFormData): Observable<AuthResultsData> {

    const authResponse = from(
      signInWithEmailAndPassword(this.auth, authData.email, authData.password)
    );

    console.log('Submitting auth request to FB');

    return authResponse.pipe(
      take(1),
      map(creds => {
        // Create a partial user object to log last authenticated
        const authResultsData: AuthResultsData = {
          email: creds.user?.email as string,
          emailVerified: creds.user.emailVerified,
          id: creds.user?.uid as string,
        };
        console.log('User authorized, returning partial user data', authResultsData);
        return authResultsData;
      }),
      catchError(error => {
        this.uiService.showSnackBar(error.message, 10000);
        console.log('Error authenticating user', error);
        return throwError(() => new Error(error));
      })
    );

  }

  loginWithFacebook(): Observable<AuthResultsData> {

    const authResponse = from(
      signInWithPopup(this.auth, new FacebookAuthProvider())
    );

    return authResponse.pipe(
      take(1),
      map(creds => {
        console.log('Retrieved these FB creds', creds);
        if (!creds.user) {
          throw new Error('No user found with those credentials.');
        }
        const authResultsData: AuthResultsData = {
          avatarUrl: creds.user?.photoURL as string,
          displayName: creds.user?.displayName?.split(' ')[0] as string,
          email: creds.user?.email as string,
          emailVerified: creds.user.emailVerified,
          id: creds.user?.uid,
          isNewUser: getAdditionalUserInfo(creds)?.isNewUser
        };
        console.log('Constructed this authResultsData', authResultsData);
        return authResultsData;
      }),
      catchError(error => {
        this.uiService.showSnackBar(error.message, 10000);
        console.log('Error authenticating user', error);
        return throwError(() => new Error(error));
      })
    );
  }

  loginWithGoogle(): Observable<AuthResultsData> {

    const authResponse = from(
      signInWithPopup(this.auth, new GoogleAuthProvider())
    );

    return authResponse.pipe(
      take(1),
      map(creds => {
        if (!creds.user) {
          throw new Error('No user found with those credentials.');
        }
        const authResultsData: AuthResultsData = {
          avatarUrl: creds.user?.photoURL as string,
          displayName: creds.user?.displayName?.split(' ')[0] as string,
          email: creds.user?.email as string,
          emailVerified: creds.user.emailVerified,
          id: creds.user?.uid,
          isNewUser: getAdditionalUserInfo(creds)?.isNewUser
        };
        return authResultsData;
      }),
      catchError(error => {
        this.uiService.showSnackBar(error.message, 10000);
        console.log('Error authenticating user', error);
        return throwError(() => new Error(error));
      })
    );
  }

  logout(): void {
    this.preLogoutActions();
    
    signOut(this.auth);
  }

  reloadAuthData(): Observable<AuthResultsData> {
    const authResponse = from(
      authState(this.auth).pipe(
        filter(user => !!user),
        switchMap(user => {
          return reload(user!);
        }),
        switchMap(empty => {
          return authState(this.auth);
        }),
        filter(user => !!user),
        map(user => {
          console.log('Auth data reloaded', user);
          const authResultsData: AuthResultsData = {
            avatarUrl: user?.photoURL as string,
            displayName: user?.displayName?.split(' ')[0] as string,
            email: user?.email as string,
            emailVerified: user?.emailVerified as boolean,
            id: user?.uid as string
          };
          return authResultsData;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error reloading auth data', error);
          return throwError(() => new Error(error));
        })
      )
    )

    return authResponse;
  }

  sendResetPasswordEmail(email: string): Observable<boolean> {
    const authResponse = from(
      sendPasswordResetEmail(this.auth, email)
    );

    return authResponse.pipe(
      take(1),
      map(creds => {
        this.uiService.showSnackBar(
          `Password reset link sent to ${email}. Please check your email for instructions.`, 10000
        );
        return true;
      }),
      catchError(error => {
        this.uiService.showSnackBar(error.message, 10000);
        console.log('Error sending reset password email', error);
        return throwError(() => new Error(error));
      })
    );
  }

  signupUserWithEmailAndPassword(authFormData: AuthFormData): Observable<AuthResultsData> {

    const authResponse = from(
      createUserWithEmailAndPassword(this.auth, authFormData.email, authFormData.password)
    );

    return authResponse.pipe(
      take(1),
      map(creds => {
        const authResultsData: AuthResultsData = {
          id: creds.user!.uid,
          email: authFormData.email,
          emailVerified: creds.user.emailVerified
        };
        console.log('Public user registered', authResultsData);
        return authResultsData;
      }),
      catchError(error => {
        this.uiService.showSnackBar(error.message, 10000);
        console.log('Error registering user', error);
        return throwError(() => new Error(error));
      })
    );
  };

  updateEmail(emailUpdateData: EmailUpdateData): Observable<boolean> {

    console.log('Submitting email to server for updating');

    const updateEmailHttpCall: (data: EmailUpdateData) => Observable<boolean> = httpsCallableData(
      this.functions,
      PublicFunctionNames.ON_CALL_UPDATE_EMAIL
    );
    const res = updateEmailHttpCall(emailUpdateData)
      .pipe(
        take(1),
        map(emailUpdated => {
          console.log('Email update outcome:', emailUpdated);
          if (!emailUpdated) {
            throw new Error(`Error updating email: ${emailUpdated}`);
          }
          return emailUpdated;
        }),
        catchError(error => {
          console.log('Error updating email', error);
          return throwError(() => new Error(error));
        })
      );

    return res;
  }

  verifyEmail(emailVerificationData: EmailVerificationData): Observable<boolean> {

    console.log('Submitting email to server for verification');

    const verifyEmailHttpCall: (data: EmailVerificationData) => Observable<boolean> = httpsCallableData(
      this.functions,
      PublicFunctionNames.ON_CALL_VERIFY_EMAIL
    );
    const res = verifyEmailHttpCall(emailVerificationData)
      .pipe(
        take(1),
        map(emailVerified => {
          console.log('Email verification outcome:', emailVerified);
          if (!emailVerified) {
            throw new Error(`Error confirming subscriber: ${emailVerified}`);
          }
          return emailVerified;
        }),
        catchError(error => {
          console.log('Error confirming subscriber', error);
          return throwError(() => new Error(error));
        })
      );

    return res;
  }

  get unsubTrigger$() {
    return this.ngUnsubscribe$;
  }

  private getUserCredentials(email: string, password: string): AuthCredential {

    const credentials = EmailAuthProvider.credential(
      email,
      password
    );
    
    return credentials;
  }

  private preLogoutActions(): void {
    this.ngUnsubscribe$.next(); // Send signal to Firebase subscriptions to unsubscribe
    this.ngUnsubscribe$.complete(); // Send signal to Firebase subscriptions to unsubscribe
    this.ngUnsubscribe$ = new Subject<void>(); // Reinitialize the unsubscribe subject in case page isn't refreshed after logout (which means auth wouldn't reset)
    this.store$.dispatch(UserStoreActions.purgePublicUserData());
    this.store$.dispatch(TrainingSessionStoreActions.purgeTrainingSessionData());
    this.store$.dispatch(TrainingRecordStoreActions.purgeTrainingRecordData());
    this.store$.dispatch(TrainingPlanStoreActions.purgeTrainingPlanData());
    this.store$.dispatch(PlanSessionFragmentStoreActions.purgePlanSessionFragmentData());
    this.store$.dispatch(PersonalSessionFragmentStoreActions.purgePersonalSessionFragmentData());
  }

}
