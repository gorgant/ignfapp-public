import { Injectable } from "@angular/core";
import { FirebaseError } from "@angular/fire/app";
import { catchError, map, switchMap, tap } from "rxjs/operators";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { AuthService } from "src/app/core/services/auth.service";
import * as AuthStoreActions from "./actions";

@Injectable()
export class AuthStoreEffects {

  constructor(
    private actions$: Actions,
    private authService: AuthService,
  ) { }


  detectCachedUser$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.detectCachedUserRequested),
      switchMap(action => 
        this.authService.fetchCachedUserData().pipe(
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
      switchMap(action => 
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

  resetPasswordEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.resetPasswordRequested),
      switchMap(action => 
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
      switchMap(action => 
        this.authService.updateEmail(action.emailUpdateData).pipe(
          map(emailUpdated => {
            return AuthStoreActions.updateEmailCompleted({emailUpdated});
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
            return AuthStoreActions.verifyEmailCompleted({emailVerified});
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
