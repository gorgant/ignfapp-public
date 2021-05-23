import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { AngularFireFunctions } from '@angular/fire/functions';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, take, takeUntil } from 'rxjs/operators';
import { EmailUserData } from 'shared-models/email/email-user-data.model';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';
import { PrelaunchUser } from 'shared-models/user/prelaunch-user.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { AuthService } from './auth.service';
import { UiService } from './ui.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private afs: AngularFirestore,
    private fns: AngularFireFunctions,
    private authService: AuthService,
    private uiService: UiService
  ) { }

  // TODO: CONSIDER DOING THESE IN THE CLOUD TO SECURE THE DATA SIMILAR TO REGISTER PRELAUNCH USER

  fetchUserData(userId: string): Observable<PublicUser> {
    const userDoc = this.getPublicUserDoc(userId);
    return userDoc.valueChanges()
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
          return throwError(error);
        })
      );
  }

  storeUserData(user: PublicUser | Partial<PublicUser>): Observable<string> {
    const userDoc = this.getPublicUserDoc(user.id!) as AngularFirestoreDocument<PublicUser | Partial<PublicUser>>;
    // Use set here because may be generating a new user or updating existing user
    const fbResponse = from(userDoc.set(user, {merge: true}));
    return fbResponse.pipe(
      take(1),
      map(empty => {
        console.log('User data stored in database');
        return user.id!;
      }),
      catchError(error => {
        this.uiService.showSnackBar('Error performing action. Changes not saved.', 10000);
        console.log('Error storing user data', error);
        return throwError(error);
      })
    );
  }

  registerPrelaunchUser(userData: EmailUserData): Observable<PrelaunchUser> {
    
    const registerUserHttpCall: (userData: EmailUserData) => 
      Observable<PrelaunchUser> = this.fns.httpsCallable(PublicFunctionNames.ON_CALL_REGISTER_PRELAUNCH_USER);

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
          return throwError(error);
        })
      );
  }

  private getPublicUserDoc(userId: string): AngularFirestoreDocument<PublicUser> {
    return this.getPublicUserCollection().doc<PublicUser>(userId);
  }

  private getPublicUserCollection(): AngularFirestoreCollection<PublicUser> {
    return this.afs.collection<PublicUser>(PublicCollectionPaths.PUBLIC_USERS);
  }
  
}


