import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { UserService } from "src/app/core/services/user.service";
import * as UserStoreActions from './actions';

@Injectable()
export class UserStoreEffects {

  constructor(
    private actions$: Actions,
    private userService: UserService,
  ) {


  }

  createUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.createUserRequested),
      switchMap(action => 
        this.userService.createPublicUser(action.partialNewUserData).pipe(
          map(newUser => {
            return UserStoreActions.createUserCompleted({newUser});
          }),
          catchError(error => {
            const fbError: firebase.default.FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.createUserFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.fetchUserRequested),
      switchMap(action => 
        this.userService.fetchUserData(action.userId).pipe(
          map(publicUser => {
            return UserStoreActions.fetchUserCompleted({publicUser});
          }),
          catchError(error => {
            const fbError: firebase.default.FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.fetchUserFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  updateUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.updateUserRequested),
      switchMap(action => 
        this.userService.updatePublicUser(action.userUpdateData).pipe(
          map(updatedUser => {
            return UserStoreActions.updateUserCompleted({updatedUser});
          }),
          catchError(error => {
            const fbError: firebase.default.FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.updateUserFailed({error: fbError}));
          })
        )
      ),
    ),
  );


}