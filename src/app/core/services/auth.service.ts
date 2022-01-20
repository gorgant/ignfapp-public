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

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private ngUnsubscribe$: Subject<void> = new Subject();

  constructor(
    private router: Router,
    private fns: Functions,
    private uiService: UiService,
    private newAuth: Auth
  ) {

    // If auth credentials are ever removed, immediately route user to login (disable for prod prelaunch mode)
    authState(this.newAuth).subscribe(authState => {
      if (!authState) {
        this.router.navigate([PublicAppRoutes.LOGIN]);
      }
    })
  }

  // Detect cached user data
  fetchCachedUserData(): Observable<AuthResultsData | undefined> {
    return authState(this.newAuth)
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
      createUserWithEmailAndPassword(this.newAuth, authFormData.email, authFormData.password)
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
      signInWithPopup(this.newAuth, new GoogleAuthProvider())
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
      signInWithPopup(this.newAuth, new FacebookAuthProvider())
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
      signInWithEmailAndPassword(this.newAuth, authData.email, authData.password)
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
    signOut(this.newAuth);
  }

  // Note email must also be updated separately in the Firestore database via the User Auth service
  updateEmail(emailUpdateData: EmailUpdateData): Observable<boolean> {

    const authResponse = from(
      authState(this.newAuth).pipe(
        take(1),
        switchMap(user => {
          const credentials = this.getUserCredentials(emailUpdateData.oldEmail, emailUpdateData.password);
          const reauthResults = reauthenticateWithCredential(user!, credentials); // This seems to trigger some sort of POST error in client, likely do to refreshed credentials, doesn't seem to be an issue
          console.log('User credentials approved');
          return forkJoin(
            [of(user as User), from(reauthResults)]
          )
        }),
        map(([user, userCreds]) => {
          updateEmail(user, emailUpdateData.newEmail);
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
      sendPasswordResetEmail(this.newAuth, email)
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
