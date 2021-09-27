import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { UiService } from 'src/app/core/services/ui.service';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import { from, Observable, Subject, throwError, combineLatest, of } from 'rxjs';
import { take, map, catchError, switchMap } from 'rxjs/operators';
import { PublicUser } from 'shared-models/user/public-user.model';
import { AuthFormData, AuthResultsData } from 'shared-models/auth/auth-data.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { EmailVerificationData } from 'shared-models/email/email-verification-data';
import { AngularFireFunctions } from '@angular/fire/functions';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private ngUnsubscribe$: Subject<void> = new Subject();

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private fns: AngularFireFunctions,
    private uiService: UiService,
  ) { }

 

  // Detect cached user data
  fetchCachedUserData(): Observable<AuthResultsData | undefined> {
    return this.afAuth.authState
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

    const authResponse = from(this.afAuth.createUserWithEmailAndPassword(
      authFormData.email,
      authFormData.password
    ));

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
        return throwError(error);
      })
    );
  };

  loginWithGoogle(): Observable<AuthResultsData> {

    const authResponse = from(this.afAuth.signInWithPopup(
      new firebase.default.auth.GoogleAuthProvider()
    ));

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
          isNewUser: creds.additionalUserInfo?.isNewUser
        };
        return authResultsData;
      }),
      catchError(error => {
        this.uiService.showSnackBar(error.message, 10000);
        console.log('Error authenticating user', error);
        return throwError(error);
      })
    );
  }

  loginWithFacebook(): Observable<AuthResultsData> {

    const authResponse = from(this.afAuth.signInWithPopup(
      new firebase.default.auth.FacebookAuthProvider()
    ));

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
          isNewUser: creds.additionalUserInfo?.isNewUser
        };
        console.log('Constructed this authResultsData', authResultsData);
        return authResultsData;
      }),
      catchError(error => {
        this.uiService.showSnackBar(error.message, 10000);
        console.log('Error authenticating user', error);
        return throwError(error);
      })
    );
  }

  loginWithEmail(authData: AuthFormData): Observable<AuthResultsData> {

    const authResponse = from(this.afAuth.signInWithEmailAndPassword(
      authData.email,
      authData.password
    ));

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
        return throwError(error);
      })
    );

  }

  logout(): void {
    this.preLogoutActions();
    this.afAuth.signOut();
  }

  updateEmail(publicUser: PublicUser, password: string, newEmail: string): Observable<{userData: PublicUser, userId: string}> {
    
    return from(this.afAuth.currentUser)
      .pipe(
        take(1),
        switchMap(user => {
          const credentials = this.getUserCredentials(publicUser.email, password);
          const reauthResults = (user?.reauthenticateWithCredential(credentials) as Promise<firebase.default.auth.UserCredential>);
          return combineLatest([of(user), from(reauthResults)])
        }),
        switchMap(([user, userCreds]) => {
          return user!.updateEmail(newEmail);
        }),
        map(empt => {
          const newUserData: PublicUser = {
            ...publicUser,
            email: newEmail
          };
          this.uiService.showSnackBar(`Email successfully updated: ${newEmail}`, 5000);
          // TODO: Also update user in publicUsers FB collection (separate action)
          return {userData: newUserData, userId: publicUser.id};
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error updating email', error);
          return throwError(error);
        })
      );
  }

  updatePassword(publicUser: PublicUser, oldPassword: string, newPassword: string): Observable<string> {

    return from(this.afAuth.currentUser)
      .pipe(
        take(1),
        switchMap(user => {
          const credentials = this.getUserCredentials(publicUser.email, oldPassword);
          const reauthResults = (user?.reauthenticateWithCredential(credentials) as Promise<firebase.default.auth.UserCredential>);
          return combineLatest([of(user), from(reauthResults)])
        }),
        switchMap(([user, userCreds]) => {
          return user!.updatePassword(newPassword);
        }),
        map(empt => {
          this.uiService.showSnackBar(`Password successfully updated`, 5000);
          return 'success';
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error updating password', error);
          return throwError(error);
        })
      );
  }

  sendResetPasswordEmail(email: string): Observable<boolean> {

    const authResponse = from(this.afAuth.sendPasswordResetEmail(email));

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
        return throwError(error);
      })
    );
  }

  verifyEmail(emailVerificationData: EmailVerificationData): Observable<boolean> {

    console.log('Submitting email to server for verification');

    const verifyEmailHttpCall: (data: EmailVerificationData) => Observable<boolean> = this.fns.httpsCallable(
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
          return throwError(error);
        })
      );

    return res;
  }

  get unsubTrigger$() {
    return this.ngUnsubscribe$;
  }

  private getUserCredentials(email: string, password: string): firebase.default.auth.AuthCredential {
    const credentials = firebase.default.auth.EmailAuthProvider.credential(
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
    this.router.navigate([PublicAppRoutes.LOGIN]);
  }

}
