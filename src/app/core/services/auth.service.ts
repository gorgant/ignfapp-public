import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, authState, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updateEmail, User } from '@angular/fire/auth';
import { Functions, httpsCallableData }  from '@angular/fire/functions';
import { UiService } from 'src/app/core/services/ui.service';
import { from, Observable, Subject, throwError, of, forkJoin } from 'rxjs';
import { take, map, catchError, switchMap } from 'rxjs/operators';
import { AuthFormData, AuthResultsData } from 'shared-models/auth/auth-data.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { EmailVerificationData } from 'shared-models/email/email-verification-data';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';
import { AuthCredential, createUserWithEmailAndPassword, FacebookAuthProvider, getAdditionalUserInfo } from 'firebase/auth';
import { EmailUpdateData } from 'shared-models/auth/email-update-data.model';
import { PasswordConfirmationData } from 'shared-models/auth/password-confirmation-data.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private ngUnsubscribe$: Subject<void> = new Subject();

  constructor(
    private router: Router,
    private fns: Functions,
    private uiService: UiService,
    private auth: Auth
  ) {

    // If auth credentials are ever removed, immediately route user to login (disable for prod prelaunch mode)
    authState(this.auth).subscribe(authState => {
      if (!authState) {
        this.router.navigate([PublicAppRoutes.LOGIN]);
      }
    })
  }

  // Confirm User Password
  confirmPassword(passwordConfirmationData: PasswordConfirmationData): Observable<boolean> {

    const userCredentials = this.getUserCredentials(passwordConfirmationData.email, passwordConfirmationData.password);

    const authResponse = from(
      authState(this.auth).pipe(
        take(1),
        switchMap(fbUser => {
          const reauthResults = reauthenticateWithCredential(fbUser!, userCredentials); // This seems to trigger some sort of POST error in client, likely do to refreshed credentials, doesn't seem to be an issue
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

  // Detect cached user data
  fetchCachedUserData(): Observable<AuthResultsData | undefined> {
    return authState(this.auth)
      .pipe(
        take(1),
        map(creds => {
          if (creds) {
            const authResultsData: AuthResultsData = {
              id: creds.uid,
              email: creds.email as string
            }
            return authResultsData;
          }
          return undefined;
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

  logout(): void {
    this.preLogoutActions();
    signOut(this.auth);
  }

  // Note email must also be updated separately in the Firestore database via the User Auth service
  // Note first confirm password using the separate function before updating email
  updateEmail(emailUpdateData: EmailUpdateData): Observable<boolean> {

    const authResponse = from(
      authState(this.auth).pipe(
        take(1),
        map((user) => {
          updateEmail(user as User, emailUpdateData.newEmail);
          console.log('Email updated in Auth');
          return true;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error updating user email in auth', error);
          return throwError(() => new Error(error));
        })
      )
    );

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

  verifyEmail(emailVerificationData: EmailVerificationData): Observable<boolean> {

    console.log('Submitting email to server for verification');

    const verifyEmailHttpCall: (data: EmailVerificationData) => Observable<boolean> = httpsCallableData(
      this.fns,
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
    // Reinitialize the unsubscribe subject in case page isn't refreshed after logout (which means auth wouldn't reset)
    this.ngUnsubscribe$ = new Subject<void>();
    
  }

}
