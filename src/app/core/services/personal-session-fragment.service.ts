import { Injectable } from '@angular/core';
import { collection, setDoc, doc, docData, DocumentReference, CollectionReference, Firestore, deleteDoc, collectionData, query, where, limit, QueryConstraint, updateDoc } from '@angular/fire/firestore';
import { Update } from '@ngrx/entity';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { PersonalSessionFragment, PersonalSessionFragmentNoId } from 'shared-models/train/personal-session-fragment.model';
import { UiService } from './ui.service';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionQueryParams } from 'shared-models/firestore/fs-collection-query-params.model';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class PersonalSessionFragmentService {

  constructor(
    private afs: Firestore,
    private authService: AuthService,
    private uiService: UiService,
  ) { }

  createPersonalSessionFragment(userId: string, personalSessionFragmentNoIdOrTimestamp: PersonalSessionFragmentNoId): Observable<PersonalSessionFragment> {
    const currentTimeTimestamp: Timestamp = Timestamp.now();

    const newId = this.generateNewPersonalSessionFragmentDocumentId(userId);

    const personalSessionFragmentWithIdAndTimestamps: PersonalSessionFragment = {
      ...personalSessionFragmentNoIdOrTimestamp, 
      createdTimestamp: currentTimeTimestamp,
      id: newId,
      lastModifiedTimestamp: currentTimeTimestamp,
    };

    const personalSessionFragmentWithIdAndMs: PersonalSessionFragment = {
      ...personalSessionFragmentNoIdOrTimestamp, 
      createdTimestamp: currentTimeTimestamp.toMillis(),
      id: newId,
      lastModifiedTimestamp: currentTimeTimestamp.toMillis(),
    };

    const personalSessionFragmentDocRef = this.getPersonalSessionFragmentDoc(userId, newId);
    const personalSessionFragmentAddRequest = setDoc(personalSessionFragmentDocRef, personalSessionFragmentWithIdAndTimestamps);

    return from(personalSessionFragmentAddRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(empty => {
          console.log('Created new personalSessionFragment', personalSessionFragmentWithIdAndMs);
          return personalSessionFragmentWithIdAndMs; // Use new version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error creating personalSessionFragment', error);
          return throwError(() => new Error(error));
        })
      );
  }

  deletePersonalSessionFragment(userId: string, personalSessionFragmentId: string): Observable<string> {
    const personalSessionFragmentDeleteRequest = deleteDoc(this.getPersonalSessionFragmentDoc(userId, personalSessionFragmentId));

    return from(personalSessionFragmentDeleteRequest)
      .pipe(
        map(empty => {
          console.log('Deleted personalSessionFragment', personalSessionFragmentId);
          return personalSessionFragmentId;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error deleting personalSessionFragment', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchAllPersonalSessionFragments(userId: string): Observable<PersonalSessionFragment[]> {

    const personalSessionFragmentCollectionDataRequest = collectionData(this.getPersonalSessionFragmentCollection(userId));

    return from(personalSessionFragmentCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(personalSessionFragments => {
          if (!personalSessionFragments) {
            throw new Error(`Error fetching all personalSessionFragments`, );
          }
          const personalSessionFragmentsWithUpdatedTimestamps = personalSessionFragments.map(personalSessionFragment => {
            const formattedPersonalSessionFragment: PersonalSessionFragment = {
              ...personalSessionFragment,
              createdTimestamp: (personalSessionFragment.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (personalSessionFragment.lastModifiedTimestamp as Timestamp).toMillis()

            };
            return formattedPersonalSessionFragment;
          });
          console.log(`Fetched all ${personalSessionFragmentsWithUpdatedTimestamps.length} personalSessionFragments`);
          return personalSessionFragmentsWithUpdatedTimestamps;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching personalSessionFragments', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchMultiplePersonalSessionFragments(userId: string, queryParams: FirestoreCollectionQueryParams): Observable<PersonalSessionFragment[]> {

    const whereQueryConditions: QueryConstraint[] | undefined = queryParams.whereQueries ? 
      queryParams.whereQueries.map(condition => where(condition.property, condition.operator, condition.value)) :
      undefined;

    const limitQueryCondition: QueryConstraint | undefined = queryParams.limit ? 
      limit(queryParams.limit) : 
      undefined;

    // Aggregate query constraints if they exist
    let combinedQueryConstraints: QueryConstraint[] = [];
    
    if (whereQueryConditions) {
      combinedQueryConstraints = [...whereQueryConditions]
    }
    if (limitQueryCondition) {
      combinedQueryConstraints = [...combinedQueryConstraints, limitQueryCondition]
    }
    
    const personalSessionFragmentCollectionQuery = query(
      this.getPersonalSessionFragmentCollection(userId),
      ...combinedQueryConstraints
    );

    const personalSessionFragmentCollectionDataRequest = collectionData(personalSessionFragmentCollectionQuery);

    return from(personalSessionFragmentCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(personalSessionFragments => {
          if (!personalSessionFragments) {
            throw new Error(`Error fetching personalSessionFragments with query: ${queryParams}`, );
          }
          const personalSessionFragmentsWithUpdatedTimestamps = personalSessionFragments.map(personalSessionFragment => {
            const formattedPersonalSessionFragment: PersonalSessionFragment = {
              ...personalSessionFragment,
              createdTimestamp: (personalSessionFragment.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (personalSessionFragment.lastModifiedTimestamp as Timestamp).toMillis()
            };
            return formattedPersonalSessionFragment;
          });
          console.log(`Fetched all ${personalSessionFragmentsWithUpdatedTimestamps.length} personalSessionFragments`);
          return personalSessionFragmentsWithUpdatedTimestamps;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching personalSessionFragments', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchSinglePersonalSessionFragment(userId: string, personalSessionFragmentId: string): Observable<PersonalSessionFragment> {
    const personalSessionFragment = docData(this.getPersonalSessionFragmentDoc(userId, personalSessionFragmentId));
    return personalSessionFragment
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(personalSessionFragment => {
          if (!personalSessionFragment) {
            throw new Error(`Error fetching personalSessionFragment with id: ${personalSessionFragmentId}`);
          }
          const formattedPersonalSessionFragment: PersonalSessionFragment = {
            ...personalSessionFragment,
            createdTimestamp: (personalSessionFragment.createdTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (personalSessionFragment.lastModifiedTimestamp as Timestamp).toMillis()
          };
          console.log(`Fetched single personalSessionFragment`, formattedPersonalSessionFragment);
          return formattedPersonalSessionFragment;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching personalSessionFragment', error);
          return throwError(() => new Error(error));
        })
      );
  }

  updatePersonalSessionFragment(userId: string, personalSessionFragmentUpdates: Update<PersonalSessionFragment>): Observable<Update<PersonalSessionFragment>> {
    const changesWithTimestamp: Partial<PersonalSessionFragment> = {
      ...personalSessionFragmentUpdates.changes,
      lastModifiedTimestamp: Timestamp.now()
    }

    const personalSessionFragmentUpdatesWithTimestamp: Update<PersonalSessionFragment> = {
      ...personalSessionFragmentUpdates,
      changes: changesWithTimestamp
    }
    const personalSessionFragmentDoc = this.getPersonalSessionFragmentDoc(userId, personalSessionFragmentUpdatesWithTimestamp.id as string);
    const personalSessionFragmentUpdateRequest = updateDoc(personalSessionFragmentDoc, changesWithTimestamp);

    return from(personalSessionFragmentUpdateRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        map(docRef => {
          console.log('Updated personalSessionFragment', changesWithTimestamp);
          return personalSessionFragmentUpdates; // Use new version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error creating personalSessionFragment', error);
          return throwError(() => new Error(error));
        })
      );
  }

  private getPersonalSessionFragmentCollection(userId: string): CollectionReference<PersonalSessionFragment> {
    // Note that personalSessionFragment is nested in Public User document
    return collection(this.afs, `${PublicCollectionPaths.PUBLIC_USERS}/${userId}/${PublicCollectionPaths.PERSONAL_SESSION_FRAGMENTS}`) as CollectionReference<PersonalSessionFragment>;
  }

  private getPersonalSessionFragmentDoc(userId: string, personalSessionFragmentId: string): DocumentReference<PersonalSessionFragment> {
    return doc(this.getPersonalSessionFragmentCollection(userId), personalSessionFragmentId);
  }

  private generateNewPersonalSessionFragmentDocumentId(userId: string): string {
    return doc(this.getPersonalSessionFragmentCollection(userId)).id;
  }

}