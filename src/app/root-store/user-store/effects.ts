import { Injectable } from "@angular/core";
import { FirebaseError } from "@angular/fire/app";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, concatMap, map, switchMap } from "rxjs/operators";
import { ImageService } from "src/app/core/services/image.service";
import { UserService } from "src/app/core/services/user.service";
import * as UserStoreActions from './actions';

@Injectable()
export class UserStoreEffects {

  constructor(
    private actions$: Actions,
    private userService: UserService,
    private imageService: ImageService
  ) { }

  createUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.createUserRequested),
      concatMap(action => 
        this.userService.createPublicUser(action.partialNewUserData).pipe(
          map(newUser => {
            return UserStoreActions.createUserCompleted({newUser});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
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
            const fbError: FirebaseError = {
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

  registerPrelaunchUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.registerPrelaunchUserRequested),
      concatMap(action => 
        this.userService.registerPrelaunchUser(action.emailUserData).pipe(
          map(prelaunchUser => {
            return UserStoreActions.registerPrelaunchUserCompleted({prelaunchUser});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.registerPrelaunchUserFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  resizeAvatarEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.resizeAvatarRequested),
      concatMap(action => 
        this.imageService.resizeAvatarImage(action.imageMetaData).pipe(
          map(serverResponse => {
            return UserStoreActions.resizeAvatarCompleted();
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.resizeAvatarFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  updateUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.updateUserRequested),
      concatMap(action => 
        this.userService.updatePublicUser(action.userUpdateData).pipe(
          map(updatedUser => {
            return UserStoreActions.updateUserCompleted({updatedUser});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
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

  uploadAvatarEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.uploadAvatarRequested),
      concatMap(action => 
        this.imageService.uploadAvatarImageAndGetDownloadUrl(action.avatarData).pipe(
          map(avatarDownloadUrl => {
            return UserStoreActions.uploadAvatarCompleted({avatarDownloadUrl});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.uploadAvatarFailed({error: fbError}));
          })
        )
      ),
    ),
  );


}