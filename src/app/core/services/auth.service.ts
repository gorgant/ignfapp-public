import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { UiService } from 'src/app/core/services/ui.service';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import { from, Observable, Subject, throwError, combineLatest, of } from 'rxjs';
import { now } from 'moment';
import { take, map, catchError, switchMap, tap } from 'rxjs/operators';
import { PublicUser } from 'shared-models/user/public-user.model';
import { AuthData } from 'shared-models/auth/auth-data.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { EmailVerificationData } from 'shared-models/email/email-verification-data';
import { AngularFireFunctions } from '@angular/fire/functions';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  authStatus = new Subject<string>();
  private ngUnsubscribe$: Subject<void> = new Subject();

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private fns: AngularFireFunctions,
    private uiService: UiService,
    private route: ActivatedRoute,
  ) { }

  // Listen for user, if exists, initiatle auth success actions, otherwise initiate logout actions
  initAuthListener(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.authSuccessActions(user);
      } else {
        this.postLogoutActions();
      }
    });
  }

  registerUserWithEmailAndPassword(authData: AuthData): Observable<PublicUser> {

    const authResponse = from(this.afAuth.createUserWithEmailAndPassword(
      authData.email,
      authData.password
    ));

    return authResponse.pipe(
      take(1),
      map(creds => {
        const publicUser: PublicUser = {
          id: creds.user!.uid,
          email: authData.email,
          lastAuthenticated: now(),
          lastModifiedTimestamp: now(),
          createdTimestamp: now(),
          isNewUser: this.checkForNewUser(creds)
        };
        console.log('Public user registered', publicUser);
        // TODO: Also update user in publicUsers FB collection (separate action)
        // TODO: Send email verification (separate action)
        return publicUser;
      }),
      catchError(error => {
        this.uiService.showSnackBar('Error performing action. Changes not saved.', 10000);
        console.log('Error registering user', error);
        return throwError(error);
      })
    );
  }

  loginWithGoogle(): Observable<PublicUser> {

    const authResponse = from(this.afAuth.signInWithPopup(
      new firebase.default.auth.GoogleAuthProvider()
    ));

    return authResponse.pipe(
      take(1),
      map(creds => {
        if (!creds.user) {
          throw new Error('No user found with those credentials.');
        }
        const publicUser: PublicUser = {
          displayName: creds.user?.displayName as string,
          email: creds.user?.email as string,
          avatarUrl: creds.user?.photoURL as string,
          id: creds.user?.uid,
          isNewUser: this.checkForNewUser(creds),
          lastAuthenticated: now(),
          lastModifiedTimestamp: now()
        };
        if (this.checkForNewUser(creds)) {
          publicUser.createdTimestamp = now();
        }
        // TODO: Also update user in publicUsers FB collection (separate action)
        // TODO: Send email verification if new user (separate action)
        return publicUser;
      }),
      catchError(error => {
        this.uiService.showSnackBar('Error performing action. Changes not saved.', 10000);
        console.log('Error registering user', error);
        return throwError(error);
      })
    );
  }

  loginWithEmail(authData: AuthData): Observable<Partial<PublicUser>> {

    const authResponse = from(this.afAuth.signInWithEmailAndPassword(
      authData.email,
      authData.password
    ));

    return authResponse.pipe(
      take(1),
      map(creds => {
        // Create a partial user object to log last authenticated
        const partialUser: Partial<PublicUser> = {
          id: creds.user?.uid,
          lastAuthenticated: now()
        };
        // TODO: Also update user in publicUsers FB collection (separate action)
        return partialUser;
      }),
      catchError(error => {
        this.uiService.showSnackBar('Error performing action. Changes not saved.', 10000);
        console.log('Error registering user', error);
        return throwError(error);
      })
    );

  }

  logout(): void {
    this.preLogoutActions();
    this.afAuth.signOut();
    // Post logout actions carried out by auth listener once logout detected
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
          this.uiService.showSnackBar('Error performing action. Changes not saved.', 10000);
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
          this.uiService.showSnackBar('Error performing action. Changes not saved.', 10000);
          console.log('Error updating password', error);
          return throwError(error);
        })
      );
  }

  sendResetPasswordEmail(email: string): Observable<string> {

    const authResponse = from(this.afAuth.sendPasswordResetEmail(email));

    return authResponse.pipe(
      take(1),
      map(creds => {
        this.uiService.showSnackBar(
          `Password reset link sent to ${email}. Please check your email for instructions.`, 10000
        );
        return 'success';
      }),
      catchError(error => {
        this.uiService.showSnackBar('Error performing action. Changes not saved.', 10000);
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

  // Check if this is a new user
  private checkForNewUser(creds: firebase.default.auth.UserCredential): boolean {
    const isNewUser = creds.additionalUserInfo?.isNewUser as boolean; 
    return isNewUser;
  }

  private getUserCredentials(email: string, password: string): firebase.default.auth.AuthCredential {
    const credentials = firebase.default.auth.EmailAuthProvider.credential(
      email,
      password
    );
    return credentials;
  }

  private authSuccessActions(user: firebase.default.User): void {
    this.authStatus.next(user.uid);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    if (returnUrl && returnUrl !== '/') {
      this.router.navigate([returnUrl]);
    } else {
      this.router.navigate([PublicAppRoutes.DASHBOARD]);
    }
  }

  private preLogoutActions(): void {
    this.ngUnsubscribe$.next(); // Send signal to Firebase subscriptions to unsubscribe
    this.ngUnsubscribe$.complete(); // Send signal to Firebase subscriptions to unsubscribe
    // Reinitialize the unsubscribe subject in case page isn't refreshed after logout (which means auth wouldn't reset)
    this.ngUnsubscribe$ = new Subject<void>();
    this.router.navigate([PublicAppRoutes.DASHBOARD]);
  }

  private postLogoutActions(): void {
    this.authStatus.next(undefined);
  }
}
