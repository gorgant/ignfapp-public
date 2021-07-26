import { Injectable } from "@angular/core";
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

  emailAuthEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.emailAuthRequested),
      switchMap(action => 
        this.authService.loginWithEmail(action.authData).pipe(
          map(authResultsData => {
            return AuthStoreActions.emailAuthCompleted({authResultsData});
          }),
          catchError(error => {
            const fbError: firebase.default.FirebaseError = {
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
            const fbError: firebase.default.FirebaseError = {
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
            const fbError: firebase.default.FirebaseError = {
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

  verifyEmailEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(AuthStoreActions.verifyEmailRequested),
      switchMap(action => 
        this.authService.verifyEmail(action.emailVerificationData).pipe(
          map(emailVerified => {
            return AuthStoreActions.verifyEmailCompleted({emailVerified});
          }),
          catchError(error => {
            const fbError: firebase.default.FirebaseError = {
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
