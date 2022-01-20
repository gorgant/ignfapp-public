import { Injectable } from '@angular/core';
import { collection, doc, docData, DocumentReference, CollectionReference, Firestore } from '@angular/fire/firestore';
import { Functions, httpsCallableData }  from '@angular/fire/functions';
import { Observable, throwError } from 'rxjs';
import { catchError, map, take, takeUntil } from 'rxjs/operators';
import { EmailUserData } from 'shared-models/email/email-user-data.model';
import { SgContactListRemovalData } from 'shared-models/email/sg-contact-list-removal-data';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';
import { PrelaunchUser } from 'shared-models/user/prelaunch-user.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UserUpdateData } from 'shared-models/user/user-update.model';
import { AuthService } from './auth.service';
import { UiService } from './ui.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private afs: Firestore,
    private fns: Functions,
    private authService: AuthService,
    private uiService: UiService
  ) { }

  fetchUserData(userId: string): Observable<PublicUser> {
    const userDoc = docData(this.getPublicUserDoc(userId));
    return userDoc
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(user => {
          if (!user) {
            throw new Error(`Error fetching user with id: ${userId}`, );
          }
          console.log('Fetched user', user);
          return user;
        }),
        catchError(error => {
          console.log('Error fetching user', error);
          return throwError(() => new Error(error));
        })
      );
  }

  createPublicUser(partialNewUserData: Partial<PublicUser>): Observable<PublicUser> {
    const createUserHttpCall: (partialNewUserData: Partial<PublicUser>) => 
      Observable<PublicUser> = httpsCallableData(this.fns, PublicFunctionNames.ON_CALL_CREATE_PUBLIC_USER);

    return createUserHttpCall(partialNewUserData)
      .pipe(
        take(1),
        map( newUser => {
          console.log('Public user created', newUser)
          return newUser;
        }),
        catchError(error => {
          console.log('Error creating user', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );
  }

  updatePublicUser(userUpdateData: UserUpdateData): Observable<PublicUser> {
    const updateUserHttpCall: (userUpdateData: UserUpdateData) => 
      Observable<PublicUser> = httpsCallableData(this.fns, PublicFunctionNames.ON_CALL_UPDATE_PUBLIC_USER);

    return updateUserHttpCall(userUpdateData)
      .pipe(
        take(1),
        map( updatedUser => {
          console.log('Public user updated', updatedUser)
          return updatedUser;
        }),
        catchError(error => {
          console.log('Error updating user', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );
  }

  registerPrelaunchUser(userData: EmailUserData): Observable<PrelaunchUser> {
    
    const registerUserHttpCall: (userData: EmailUserData) => 
      Observable<PrelaunchUser> = httpsCallableData(this.fns, PublicFunctionNames.ON_CALL_REGISTER_PRELAUNCH_USER);

    return registerUserHttpCall(userData)
      .pipe(
        take(1),
        map( registeredUser => {
          if (registeredUser.emailVerified) {
            this.uiService.showSnackBar(`Woah there, you're already on the list!`, 10000);
          }
          console.log('PrelaunchUser registered', registeredUser)
          return registeredUser;
        }),
        catchError(error => {
          console.log('Error registering prelaunchUser', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );
  }

  removeUserFromSgContactList(sgContactListRemovalData: SgContactListRemovalData): Observable<string> {
    const removeUserFromListHttpCall: (sgContactListRemovalData: SgContactListRemovalData) => 
      Observable<string> = httpsCallableData(this.fns, PublicFunctionNames.ON_CALL_REMOVE_USER_FROM_SG_CONTACT_LIST);

    return removeUserFromListHttpCall(sgContactListRemovalData)
      .pipe(
        take(1),
        map( requestPublished => {
          console.log('User removed from SG contact lists', sgContactListRemovalData.listsToUpdate)
          return requestPublished;
        }),
        catchError(error => {
          console.log('Error registering prelaunchUser', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );
  }

  private getPublicUserDoc(userId: string): DocumentReference<PublicUser> {
    return doc(this.getPublicUserCollection(), userId);
  }

  private getPublicUserCollection(): CollectionReference<PublicUser> {
    return collection(this.afs, PublicCollectionPaths.PUBLIC_USERS) as CollectionReference<PublicUser>;
  }
  
}


