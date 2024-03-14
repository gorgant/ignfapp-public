import { Injectable, inject } from "@angular/core";
import { FirebaseError } from "@angular/fire/app";
import { catchError, concatMap, map, switchMap, tap } from "rxjs/operators";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { AuthService } from "src/app/core/services/auth.service";
import * as AuthStoreActions from "./actions";

@Injectable()
export class AuthStoreEffects {

  private actions$ = inject(Actions);
  private authService = inject(AuthService);

  constructor() { }

  confirmPasswordEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.confirmPasswordRequested),
      switchMap(action => 
        this.authService.confirmPassword(action.confirmPasswordData).pipe(
          map(passwordConfirmed => {
            return AuthStoreActions.confirmPasswordCompleted({passwordConfirmed});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(AuthStoreActions.confirmPasswordFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  detectCachedUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.detectCachedUserRequested),
      concatMap(action => 
        this.authService.fetchAuthData().pipe(
          map(authResultsData => {
            return AuthStoreActions.detectCachedUserCompleted({authResultsData});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(AuthStoreActions.detectCachedUserFailed({error: fbError}));
          })
        )
      )
    )
  );

  emailAuthEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.emailAuthRequested),
      switchMap(action => 
        this.authService.loginWithEmail(action.authData).pipe(
          map(authResultsData => {
            return AuthStoreActions.emailAuthCompleted({authResultsData});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(AuthStoreActions.emailAuthFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  emailSignupEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.emailSignupRequested),
      concatMap(action => 
        this.authService.signupUserWithEmailAndPassword(action.authFormData).pipe(
          map(authResultsData => {
            return AuthStoreActions.emailSignupCompleted({authResultsData});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(AuthStoreActions.emailSignupFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  facebookAuthEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.facebookAuthRequested),
      switchMap(action => 
        this.authService.loginWithFacebook().pipe(
          map(authResultsData => {
            return AuthStoreActions.facebookAuthCompleted({authResultsData});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(AuthStoreActions.facebookAuthFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  googleAuthEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.googleAuthRequested),
      switchMap(action => 
        this.authService.loginWithGoogle().pipe(
          map(authResultsData => {
            return AuthStoreActions.googleAuthCompleted({authResultsData});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(AuthStoreActions.googleAuthFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  logoutEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.logout),
      tap(action => {
        this.authService.logout();
      })
    ),
    {dispatch: false}
  );

  reloadAuthDataEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.reloadAuthDataRequested),
      switchMap(action => 
        this.authService.reloadAuthData().pipe(
          map(authResultsData => {
            return AuthStoreActions.reloadAuthDataCompleted({authResultsData});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(AuthStoreActions.reloadAuthDataFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  resetPasswordEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.resetPasswordRequested),
      concatMap(action => 
        this.authService.sendResetPasswordEmail(action.email).pipe(
          map(resetSubmitted => {
            return AuthStoreActions.resetPasswordCompleted({resetSubmitted});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(AuthStoreActions.resetPasswordFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  updateEmailEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.updateEmailRequested),
      concatMap(action => 
        this.authService.updateEmail(action.emailUpdateData).pipe(
          map(emailUpdated => {
            return AuthStoreActions.updateEmailCompleted({updateEmailSucceeded: emailUpdated});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(AuthStoreActions.updateEmailFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  verifyEmailEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.verifyEmailRequested),
      switchMap(action => 
        this.authService.verifyEmail(action.emailVerificationData).pipe(
          map(emailVerified => {
            return AuthStoreActions.verifyEmailCompleted({verifyEmailSucceeded: emailVerified});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(AuthStoreActions.verifyEmailFailed({error: fbError}));
          })
        )
      ),
    ),
  );


}
