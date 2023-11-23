import { Injectable, inject } from '@angular/core';
import { collection, doc, docData, DocumentReference, CollectionReference, Firestore } from '@angular/fire/firestore';
import { Functions, httpsCallableData }  from '@angular/fire/functions';
import { Observable, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take, takeUntil } from 'rxjs/operators';
import { EmailUserData } from 'shared-models/email/email-user-data.model';
import { SgContactListRemovalData } from 'shared-models/email/sg-contact-list-removal-data';
import { UnsubscribeRecord, UnsubscribeRecordList } from 'shared-models/email/unsubscribe-record.model';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UserUpdateData } from 'shared-models/user/user-update.model';
import { AuthService } from './auth.service';
import { UiService } from './ui.service';
import { Timestamp } from '@angular/fire/firestore';
import { HelperService } from './helpers.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private firestore = inject(Firestore);
  private functions = inject(Functions);
  private authService = inject(AuthService);
  private uiService = inject(UiService);
  private helperService = inject(HelperService);

  constructor() { }

  createPublicUser(partialPublicUserData: Partial<PublicUser>): Observable<PublicUser> {
    const createPublicUserHttpCall: (partialNewUserData: Partial<PublicUser>) => 
      Observable<PublicUser> = httpsCallableData(this.functions, PublicFunctionNames.ON_CALL_CREATE_PUBLIC_USER);
    
    return createPublicUserHttpCall(partialPublicUserData)
      .pipe(
        take(1),
        switchMap(serverUserData => {
          const dbUser = this.fetchPublicUser(serverUserData.id); // Note that Cloud Functions returns a map rather than a Timestamp object, so instead fetch updated user from Firestore to get cleaner timestmap data
          console.log('publicUser created', dbUser);
          return dbUser;
        }),
        catchError(error => {
          console.log('Error creating publicUser', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );
  }

  deletePublicUser(publicUserId: string): Observable<boolean> {
    const deletePublicUserHttpCall: (publicUserId: string) => 
    Observable<boolean> = httpsCallableData(this.functions, PublicFunctionNames.ON_CALL_DELETE_PUBLIC_USER);

    return deletePublicUserHttpCall(publicUserId)
      .pipe(
        take(1),
        map(res => {
          console.log('publicUser deleted', res);
          return res;
        }),
        catchError(error => {
          console.log('Error deleting publicUser', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchPublicUser(publicUserId: string): Observable<PublicUser> {
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
        shareReplay(),
        catchError(error => {
          console.log('Error fetching publicUser', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );
  }

  removePublicUserFromSgContactList(sgContactListRemovalData: SgContactListRemovalData): Observable<string> {
    const removePublicUserFromListHttpCall: (sgContactListRemovalData: SgContactListRemovalData) => 
      Observable<string> = httpsCallableData(this.functions, PublicFunctionNames.ON_CALL_REMOVE_USER_FROM_SG_CONTACT_LIST);

    return removePublicUserFromListHttpCall(sgContactListRemovalData)
      .pipe(
        take(1),
        map( requestPublished => {
          console.log('publicUser removed from SG contact lists', sgContactListRemovalData.listsToUpdate)
          return requestPublished;
        }),
        catchError(error => {
          console.log('Error registering prelaunchUser', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );
  }

   // Send an email to the user to confirm their email update (which if clicked, initiates the update process)
   sendUpdateEmailConfirmation(userData: PublicUser): Observable<boolean> {

    console.log('Submitting email to server to be updated');
    
    const emailUserData = this.helperService.convertPublicUserDataToEmailUserData(userData);

    const sendUpdateEmailConfirmationHttpCall: (data: EmailUserData) => Observable<string> = httpsCallableData(
      this.functions,
      PublicFunctionNames.ON_CALL_SEND_UPDATE_EMAIL_CONFIRMATION
    );
    const res = sendUpdateEmailConfirmationHttpCall(emailUserData)
      .pipe(
        take(1),
        map(publishedMsgId => {
          console.log('updateEmailConfirmation sent:', publishedMsgId);
          if (!publishedMsgId) {
            throw new Error(`Error sending updateEmailConfirmation: ${publishedMsgId}`);
          }
          return true;
        }),
        catchError(error => {
          console.log('Error confirming subscriber', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );

    return res;
  }

  updatePublicUser(publicUserUpdateData: UserUpdateData): Observable<PublicUser> {
    const updatePublicUserHttpCall: (publicUserUpdateData: UserUpdateData) => 
      Observable<PublicUser> = httpsCallableData(this.functions, PublicFunctionNames.ON_CALL_UPDATE_PUBLIC_USER);

    return updatePublicUserHttpCall(publicUserUpdateData)
      .pipe(
        take(1),
        switchMap(serverUserData => {
          const dbUser = this.fetchPublicUser(serverUserData.id); // Note that Cloud Functions returns a map rather than a Timestamp object, so instead fetch updated user from Firestore to get cleaner timestmap data
          console.log('publicUser updated', dbUser);
          return dbUser;
        }),
        catchError(error => {
          console.log('Error updating publicUser', error);
          this.uiService.showSnackBar('Hmm, something went wrong. Refresh the page and try again.', 10000);
          return throwError(() => new Error(error));
        })
      );
  }

  private getPublicUserCollection(): CollectionReference<PublicUser> {
    return collection(this.firestore, PublicCollectionPaths.PUBLIC_USERS) as CollectionReference<PublicUser>;
  }

  private getPublicUserDoc(publicUserId: string): DocumentReference<PublicUser> {
    return doc(this.getPublicUserCollection(), publicUserId);
  }

 
  
}


