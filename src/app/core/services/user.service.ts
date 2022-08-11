import { Injectable } from '@angular/core';
import { collection, doc, docData, DocumentReference, CollectionReference, Firestore } from '@angular/fire/firestore';
import { Functions, httpsCallableData }  from '@angular/fire/functions';
import { Observable, throwError } from 'rxjs';
import { catchError, map, take, takeUntil } from 'rxjs/operators';
import { EmailUserData } from 'shared-models/email/email-user-data.model';
import { SgContactListRemovalData } from 'shared-models/email/sg-contact-list-removal-data';
import { UnsubscribeRecord, UnsubscribeRecordList } from 'shared-models/email/unsubscribe-record.model';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';
import { PrelaunchUser } from 'shared-models/user/prelaunch-user.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UserUpdateData } from 'shared-models/user/user-update.model';
import { AuthService } from './auth.service';
import { UiService } from './ui.service';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private afs: Firestore,
    private fns: Functions,
    private authService: AuthService,
    private uiService: UiService,
  ) { }

  // TODO: Figure out if we need any edits here, might need to revert the MS (potentially better on server side)

  createPublicUser(partialPublicUserData: Partial<PublicUser>): Observable<PublicUser> {
    const createUserHttpCall: (partialNewUserData: Partial<PublicUser>) => 
      Observable<PublicUser> = httpsCallableData(this.fns, PublicFunctionNames.ON_CALL_CREATE_PUBLIC_USER);

    return createUserHttpCall(partialPublicUserData)
      .pipe(
        take(1),
        map( publicUser => {
          if (!publicUser) {
            throw new Error(`Error creating publicUser with email: ${partialPublicUserData.email}`, );
          }
          const formattedUser: PublicUser = {
            ...publicUser,
            createdTimestamp: (publicUser.createdTimestamp as Timestamp).toMillis(),
            lastAuthenticatedTimestamp: (publicUser.lastAuthenticatedTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (publicUser.lastModifiedTimestamp as Timestamp).toMillis(),
          };
          if (publicUser.emailGlobalUnsubscribe) {
            const formattedGlobalUnsubscribe: UnsubscribeRecord = {
              ...publicUser.emailGlobalUnsubscribe,
              unsubscribeTimestamp: (publicUser.emailGlobalUnsubscribe.unsubscribeTimestamp as Timestamp).toMillis()
            }
            formattedUser.emailGlobalUnsubscribe = formattedGlobalUnsubscribe
          }
          if (publicUser.emailGroupUnsubscribes) {
            const formattedGroupUnsubscribeRecordList: UnsubscribeRecordList = {
              ...publicUser.emailGroupUnsubscribes
            };
            const groupUnsubscribeObjectList: UnsubscribeRecordList = publicUser.emailGroupUnsubscribes;
            Object.keys(groupUnsubscribeObjectList).forEach(key => {
              // groupUnsubscribeArray.push(groupUnsubscribeObjectList[+key]) // Convert key to number since this object has numeric keys
              const formattedTimestampValue = (groupUnsubscribeObjectList[+key].unsubscribeTimestamp as Timestamp).toMillis();
              groupUnsubscribeObjectList[+key].unsubscribeTimestamp = formattedTimestampValue;
            });
            formattedUser.emailGroupUnsubscribes = formattedGroupUnsubscribeRecordList;
          }
          if (publicUser.emailOptInTimestamp) {
            formattedUser.emailOptInTimestamp = (formattedUser.emailOptInTimestamp as Timestamp).toMillis();
          }
          if (publicUser.emailSendgridContactCreatedTimestamp) {
            formattedUser.emailSendgridContactCreatedTimestamp = (formattedUser.emailSendgridContactCreatedTimestamp as Timestamp).toMillis();
          }

          console.log('publicUser created', publicUser)
          return formattedUser;
        }),
        catchError(error => {
          console.log('Error creating publicUser', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchUserData(publicUserId: string): Observable<PublicUser> {
    const publicUserDoc = docData(this.getPublicUserDoc(publicUserId));
    return publicUserDoc
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(publicUser => {
          if (!publicUser) {
            throw new Error(`Error fetching publicUser with id: ${publicUserId}`, );
          }
          const formattedUser: PublicUser = {
            ...publicUser,
            createdTimestamp: (publicUser.createdTimestamp as Timestamp).toMillis(),
            lastAuthenticatedTimestamp: (publicUser.lastAuthenticatedTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (publicUser.lastModifiedTimestamp as Timestamp).toMillis(),
          };
          if (publicUser.emailGlobalUnsubscribe) {
            const formattedGlobalUnsubscribe: UnsubscribeRecord = {
              ...publicUser.emailGlobalUnsubscribe,
              unsubscribeTimestamp: (publicUser.emailGlobalUnsubscribe.unsubscribeTimestamp as Timestamp).toMillis()
            }
            formattedUser.emailGlobalUnsubscribe = formattedGlobalUnsubscribe
          }
          if (publicUser.emailGroupUnsubscribes) {
            const formattedGroupUnsubscribeRecordList: UnsubscribeRecordList = {
              ...publicUser.emailGroupUnsubscribes
            };
            const groupUnsubscribeObjectList: UnsubscribeRecordList = publicUser.emailGroupUnsubscribes;
            Object.keys(groupUnsubscribeObjectList).forEach(key => {
              // groupUnsubscribeArray.push(groupUnsubscribeObjectList[+key]) // Convert key to number since this object has numeric keys
              const formattedTimestampValue = (groupUnsubscribeObjectList[+key].unsubscribeTimestamp as Timestamp).toMillis();
              groupUnsubscribeObjectList[+key].unsubscribeTimestamp = formattedTimestampValue;
            });
            formattedUser.emailGroupUnsubscribes = formattedGroupUnsubscribeRecordList;
          }
          if (publicUser.emailOptInTimestamp) {
            formattedUser.emailOptInTimestamp = (formattedUser.emailOptInTimestamp as Timestamp).toMillis();
          }
          if (publicUser.emailSendgridContactCreatedTimestamp) {
            formattedUser.emailSendgridContactCreatedTimestamp = (formattedUser.emailSendgridContactCreatedTimestamp as Timestamp).toMillis();
          }

          console.log(`Fetched single publicUser`, formattedUser);
          return formattedUser;
        }),
        catchError(error => {
          console.log('Error fetching publicUser', error);
          return throwError(() => new Error(error));
        })
      );
  }

  registerPrelaunchUser(publicUserData: EmailUserData): Observable<PrelaunchUser> {
    
    const registerUserHttpCall: (publicUserData: EmailUserData) => 
      Observable<PrelaunchUser> = httpsCallableData(this.fns, PublicFunctionNames.ON_CALL_REGISTER_PRELAUNCH_USER);

    return registerUserHttpCall(publicUserData)
      .pipe(
        take(1),
        map( prealaunchUser => {
          if (prealaunchUser.emailVerified) {
            this.uiService.showSnackBar(`Woah there, you're already on the list!`, 10000);
          }
          const formattedUser: PrelaunchUser = {
            ...prealaunchUser,
            createdTimestamp: (prealaunchUser.createdTimestamp as Timestamp).toMillis(),
            lastAuthenticatedTimestamp: (prealaunchUser.lastAuthenticatedTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (prealaunchUser.lastModifiedTimestamp as Timestamp).toMillis(),
          };
          if (prealaunchUser.emailGlobalUnsubscribe) {
            const formattedGlobalUnsubscribe: UnsubscribeRecord = {
              ...prealaunchUser.emailGlobalUnsubscribe,
              unsubscribeTimestamp: (prealaunchUser.emailGlobalUnsubscribe.unsubscribeTimestamp as Timestamp).toMillis()
            }
            formattedUser.emailGlobalUnsubscribe = formattedGlobalUnsubscribe
          }
          if (prealaunchUser.emailGroupUnsubscribes) {
            const formattedGroupUnsubscribeRecordList: UnsubscribeRecordList = {
              ...prealaunchUser.emailGroupUnsubscribes
            };
            const groupUnsubscribeObjectList: UnsubscribeRecordList = prealaunchUser.emailGroupUnsubscribes;
            Object.keys(groupUnsubscribeObjectList).forEach(key => {
              // groupUnsubscribeArray.push(groupUnsubscribeObjectList[+key]) // Convert key to number since this object has numeric keys
              const formattedTimestampValue = (groupUnsubscribeObjectList[+key].unsubscribeTimestamp as Timestamp).toMillis();
              groupUnsubscribeObjectList[+key].unsubscribeTimestamp = formattedTimestampValue;
            });
            formattedUser.emailGroupUnsubscribes = formattedGroupUnsubscribeRecordList;
          }
          if (prealaunchUser.emailOptInTimestamp) {
            formattedUser.emailOptInTimestamp = (formattedUser.emailOptInTimestamp as Timestamp).toMillis();
          }
          if (prealaunchUser.emailSendgridContactCreatedTimestamp) {
            formattedUser.emailSendgridContactCreatedTimestamp = (formattedUser.emailSendgridContactCreatedTimestamp as Timestamp).toMillis();
          }
          console.log('prelaunchUser registered', prealaunchUser)
          return formattedUser;
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


  updatePublicUser(publicUserUpdateData: UserUpdateData): Observable<PublicUser> {
    const updateUserHttpCall: (publicUserUpdateData: UserUpdateData) => 
      Observable<PublicUser> = httpsCallableData(this.fns, PublicFunctionNames.ON_CALL_UPDATE_PUBLIC_USER);

    return updateUserHttpCall(publicUserUpdateData)
      .pipe(
        take(1),
        map( publicUser => {
          const formattedUser: PublicUser = {
            ...publicUser,
            createdTimestamp: (publicUser.createdTimestamp as Timestamp).toMillis(),
            lastAuthenticatedTimestamp: (publicUser.lastAuthenticatedTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (publicUser.lastModifiedTimestamp as Timestamp).toMillis(),
          };
          if (publicUser.emailGlobalUnsubscribe) {
            const formattedGlobalUnsubscribe: UnsubscribeRecord = {
              ...publicUser.emailGlobalUnsubscribe,
              unsubscribeTimestamp: (publicUser.emailGlobalUnsubscribe.unsubscribeTimestamp as Timestamp).toMillis()
            }
            formattedUser.emailGlobalUnsubscribe = formattedGlobalUnsubscribe
          }
          if (publicUser.emailGroupUnsubscribes) {
            const formattedGroupUnsubscribeRecordList: UnsubscribeRecordList = {
              ...publicUser.emailGroupUnsubscribes
            };
            const groupUnsubscribeObjectList: UnsubscribeRecordList = publicUser.emailGroupUnsubscribes;
            Object.keys(groupUnsubscribeObjectList).forEach(key => {
              // groupUnsubscribeArray.push(groupUnsubscribeObjectList[+key]) // Convert key to number since this object has numeric keys
              const formattedTimestampValue = (groupUnsubscribeObjectList[+key].unsubscribeTimestamp as Timestamp).toMillis();
              groupUnsubscribeObjectList[+key].unsubscribeTimestamp = formattedTimestampValue;
            });
            formattedUser.emailGroupUnsubscribes = formattedGroupUnsubscribeRecordList;
          }
          if (publicUser.emailOptInTimestamp) {
            formattedUser.emailOptInTimestamp = (formattedUser.emailOptInTimestamp as Timestamp).toMillis();
          }
          if (publicUser.emailSendgridContactCreatedTimestamp) {
            formattedUser.emailSendgridContactCreatedTimestamp = (formattedUser.emailSendgridContactCreatedTimestamp as Timestamp).toMillis();
          }
          console.log('publicUser updated', publicUser)
          return formattedUser;
        }),
        catchError(error => {
          console.log('Error updating publicUser', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );
  }

  private getPublicUserCollection(): CollectionReference<PublicUser> {
    return collection(this.afs, PublicCollectionPaths.PUBLIC_USERS) as CollectionReference<PublicUser>;
  }

  private getPublicUserDoc(publicUserId: string): DocumentReference<PublicUser> {
    return doc(this.getPublicUserCollection(), publicUserId);
  }
  
}


