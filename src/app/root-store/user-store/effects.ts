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

  createPublicUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.createPublicUserRequested),
      concatMap(action => 
        this.userService.createPublicUser(action.partialNewPublicUserData).pipe(
          map(newPublicUser => {
            return UserStoreActions.createPublicUserCompleted({newPublicUser});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.createPublicUserFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  deletePublicUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.deletePublicUserRequested),
      concatMap(action => 
        this.userService.deletePublicUser(action.publicUserId).pipe(
          map(publicUserDeleted => {
            return UserStoreActions.deletePublicUserCompleted({publicUserDeleted});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.deletePublicUserFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchPrelaunchUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.fetchPrelaunchUserRequested),
      switchMap(action => 
        this.userService.fetchPrelaunchUser(action.prelaunchUserId).pipe(
          map(prelaunchUser => {
            return UserStoreActions.fetchPrelaunchUserCompleted({prelaunchUser});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.fetchPrelaunchUserFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  fetchPublicUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.fetchPublicUserRequested),
      switchMap(action => 
        this.userService.fetchPublicUser(action.publicUserId).pipe(
          map(publicUser => {
            return UserStoreActions.fetchPublicUserCompleted({publicUser});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.fetchPublicUserFailed({error: fbError}));
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

  updatePrelaunchUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.updatePrelaunchUserRequested),
      concatMap(action => 
        this.userService.updatePrelaunchUser(action.userUpdateData).pipe(
          map(updatedPrelaunchUser => {
            return UserStoreActions.updatePrelaunchUserCompleted({updatedPrelaunchUser});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.updatePrelaunchUserFailed({error: fbError}));
          })
        )
      ),
    ),
  );

  updatePublicUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.updatePublicUserRequested),
      concatMap(action => 
        this.userService.updatePublicUser(action.userUpdateData).pipe(
          map(updatedPublicUser => {
            return UserStoreActions.updatePublicUserCompleted({updatedPublicUser});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.updatePublicUserFailed({error: fbError}));
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