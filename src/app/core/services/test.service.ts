import { Injectable, inject } from '@angular/core';
import { AppCheck } from '@angular/fire/app-check';
import { CollectionReference, DocumentReference, collection, doc, docData, Firestore } from '@angular/fire/firestore';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { Observable, take, catchError, throwError, map } from 'rxjs';
import { EnvironmentTypes } from 'shared-models/environments/env-vars.model';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';
import { PublicUser } from 'shared-models/user/public-user.model';

@Injectable({
  providedIn: 'root'
})
export class TestService {

  firestore: Firestore = inject(Firestore);
  functions: Functions = inject(Functions);

  constructor() { }

  testFunction(testData: string): Observable<EnvironmentTypes> {
    const testFunctionHttpCall: (data: string) => 
      Observable<EnvironmentTypes> = httpsCallableData(this.functions, PublicFunctionNames.ON_CALL_TEST_FUNCTION);

    return testFunctionHttpCall(testData)
      .pipe(
        take(1),
        map(envType => {
          console.log('Detected this environment type in cloud functions', envType);
          return envType;
        }),
        catchError(error => {
          console.log('Error triggering test function', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchPublicUser(publicUserId: string): Observable<any> {
    const publicUserDoc = docData(this.getPublicUserDoc(publicUserId)) as Observable<PublicUser>;

    return publicUserDoc
      .pipe(
        // If logged out, this triggers unsub of this observable
        map(publicUser => {
          if (!publicUser) {
            throw new Error(`Error fetching publicUser with id: ${publicUserId}`, );
          }
          console.log(`Fetched single publicUser`, publicUser);
          return publicUser;
        }),
        catchError(error => {
          console.log('Error fetching publicUser', error);
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
