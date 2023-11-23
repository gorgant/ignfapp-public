import { Injectable } from "@angular/core";
import { FirebaseError } from "@angular/fire/app";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, concatMap, map, switchMap, take } from "rxjs/operators";
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
        this.userService.createPublicUser(action.partialNewUserData).pipe(
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
        this.userService.deletePublicUser(action.userId).pipe(
          map(publicUserDeleted => {
            return UserStoreActions.deletePublicUserCompleted({userDeleted: publicUserDeleted});
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

  fetchPublicUserEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.fetchPublicUserRequested),
      switchMap(action => 
        this.userService.fetchPublicUser(action.publicUserId).pipe(
          map(publicUser => {
            return UserStoreActions.fetchPublicUserCompleted({userData: publicUser});
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

  resizeAvatarEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.resizeAvatarRequested),
      concatMap(action => 
        this.imageService.resizeAvatarImage(action.imageMetaData).pipe(
          map(resizeAvatarSucceeded => {
            return UserStoreActions.resizeAvatarCompleted({resizeAvatarSucceeded});
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

  sendUpdateEmailConfirmationEffect$ = createEffect(() => this.actions$
    .pipe(
      ofType(UserStoreActions.sendUpdateEmailConfirmationRequested),
      concatMap(action => 
        this.userService.sendUpdateEmailConfirmation(action.userData).pipe(
          map(emailUpdated => {
            return UserStoreActions.sendUpdateEmailConfirmationCompleted({emailUpdated});
          }),
          catchError(error => {
            const fbError: FirebaseError = {
              code: error.code,
              message: error.message,
              name: error.name
            };
            return of(UserStoreActions.sendUpdateEmailConfirmationFailed({error: fbError}));
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
            return UserStoreActions.updatePublicUserCompleted({updatedUserData: updatedPublicUser});
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