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
import { GoogleCloudFunctionsPublicUser, PublicUser, PublicUserKeys } from 'shared-models/user/public-user.model';
import { UserUpdateData } from 'shared-models/user/user-update.model';
import { AuthService } from './auth.service';
import { UiService } from './ui.service';
import { Timestamp } from '@angular/fire/firestore';
import { HelperService } from './helpers.service';
import { GoogleCloudFunctionsTimestamp } from 'shared-models/firestore/google-cloud-functions-timestamp.model';

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
            [PublicUserKeys.CREATED_TIMESTAMP]: (publicUser[PublicUserKeys.CREATED_TIMESTAMP] as Timestamp).toMillis(),
            [PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP]: publicUser[PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP] ? (publicUser[PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP] as Timestamp).toMillis() : null,
            [PublicUserKeys.EMAIL_OPT_OUT_TIMESTAMP]: publicUser[PublicUserKeys.EMAIL_OPT_OUT_TIMESTAMP] ? (publicUser[PublicUserKeys.EMAIL_OPT_OUT_TIMESTAMP] as Timestamp).toMillis() : null,
            [PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP]: publicUser[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP] ? (publicUser[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP] as Timestamp).toMillis() : null,
            [PublicUserKeys.LAST_AUTHENTICATED_TIMESTAMP]: (publicUser[PublicUserKeys.LAST_AUTHENTICATED_TIMESTAMP] as Timestamp).toMillis(),
            [PublicUserKeys.LAST_MODIFIED_TIMESTAMP]: (publicUser[PublicUserKeys.LAST_MODIFIED_TIMESTAMP] as Timestamp).toMillis(),
          };
          if (publicUser[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE]) {
            const formattedGlobalUnsubscribe: UnsubscribeRecord = {
              ...publicUser[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE],
              unsubscribeTimestamp: (publicUser[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE].unsubscribeTimestamp as Timestamp).toMillis()
            }
            formattedUser[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE] = formattedGlobalUnsubscribe
          }
          if (publicUser[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES]) {
            const formattedGroupUnsubscribeRecordList: UnsubscribeRecordList = {
              ...publicUser[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES]
            };
            const groupUnsubscribeObjectList: UnsubscribeRecordList = publicUser[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES];
            Object.keys(groupUnsubscribeObjectList).forEach(key => {
              const formattedTimestampValue = (groupUnsubscribeObjectList[+key].unsubscribeTimestamp as Timestamp).toMillis(); // Convert key to number since this object has numeric keys
              groupUnsubscribeObjectList[+key].unsubscribeTimestamp = formattedTimestampValue;
            });
            formattedUser[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES] = formattedGroupUnsubscribeRecordList;
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
    console.log('updatePublicUser call registered');
    const updatePublicUserHttpCall: (publicUserUpdateData: UserUpdateData) => 
      Observable<GoogleCloudFunctionsPublicUser> = httpsCallableData(this.functions, PublicFunctionNames.ON_CALL_UPDATE_PUBLIC_USER);

    return updatePublicUserHttpCall(publicUserUpdateData)
      .pipe(
        take(1),
        map(updatedPublicUser => {
          // Timestamps from Google Cloud Functions are a static object, so they need to be converted differently
          const formattedUser: PublicUser = {
            ...updatedPublicUser,
            [PublicUserKeys.CREATED_TIMESTAMP]: this.helperService.convertGoogleCloudTimestampToMs(updatedPublicUser[PublicUserKeys.CREATED_TIMESTAMP]),
            [PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP]: updatedPublicUser[PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP] ? this.helperService.convertGoogleCloudTimestampToMs(updatedPublicUser[PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP]) : null,
            [PublicUserKeys.EMAIL_OPT_OUT_TIMESTAMP]: updatedPublicUser[PublicUserKeys.EMAIL_OPT_OUT_TIMESTAMP] ? this.helperService.convertGoogleCloudTimestampToMs(updatedPublicUser[PublicUserKeys.EMAIL_OPT_OUT_TIMESTAMP]) : null,
            [PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP]: updatedPublicUser[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP] ? this.helperService.convertGoogleCloudTimestampToMs(updatedPublicUser[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP]) : null,
            [PublicUserKeys.LAST_AUTHENTICATED_TIMESTAMP]: this.helperService.convertGoogleCloudTimestampToMs(updatedPublicUser[PublicUserKeys.LAST_AUTHENTICATED_TIMESTAMP]),
            [PublicUserKeys.LAST_MODIFIED_TIMESTAMP]: this.helperService.convertGoogleCloudTimestampToMs(updatedPublicUser[PublicUserKeys.LAST_MODIFIED_TIMESTAMP]),
          };
          if (updatedPublicUser[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE]) {
            const formattedGlobalUnsubscribe: UnsubscribeRecord = {
              ...updatedPublicUser[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE],
              unsubscribeTimestamp: this.helperService.convertGoogleCloudTimestampToMs(updatedPublicUser[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE].unsubscribeTimestamp as GoogleCloudFunctionsTimestamp)
            }
            formattedUser[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE] = formattedGlobalUnsubscribe
          }
          if (updatedPublicUser[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES]) {
            const formattedGroupUnsubscribeRecordList: UnsubscribeRecordList = {
              ...updatedPublicUser[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES]
            };
            const groupUnsubscribeObjectList: UnsubscribeRecordList = updatedPublicUser[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES];
            Object.keys(groupUnsubscribeObjectList).forEach(key => {
              const formattedTimestampValue = this.helperService.convertGoogleCloudTimestampToMs(groupUnsubscribeObjectList[+key].unsubscribeTimestamp as GoogleCloudFunctionsTimestamp); // Convert key to number since this object has numeric keys
              groupUnsubscribeObjectList[+key].unsubscribeTimestamp = formattedTimestampValue;
            });
            formattedUser[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES] = formattedGroupUnsubscribeRecordList;
          }

          console.log(`Updated single publicUser`, formattedUser);
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
    return collection(this.firestore, PublicCollectionPaths.PUBLIC_USERS) as CollectionReference<PublicUser>;
  }

  private getPublicUserDoc(publicUserId: string): DocumentReference<PublicUser> {
    return doc(this.getPublicUserCollection(), publicUserId);
  }

 
  
}


