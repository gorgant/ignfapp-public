import { Injectable, inject } from '@angular/core';
import { collection, setDoc, doc, docData, DocumentReference, CollectionReference, Firestore, deleteDoc, collectionData, query, where, limit, QueryConstraint, updateDoc, writeBatch, Timestamp, orderBy, Query } from '@angular/fire/firestore';
import { Update } from '@ngrx/entity';
import { from, Observable, Subject, throwError } from 'rxjs';
import { catchError, map, shareReplay, takeUntil } from 'rxjs/operators';
import { PersonalSessionFragment, PersonalSessionFragmentKeys, PersonalSessionFragmentNoIdOrTimestamp } from 'shared-models/train/personal-session-fragment.model';
import { UiService } from './ui.service';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionQueryParams } from 'shared-models/firestore/fs-collection-query-params.model';

@Injectable({
  providedIn: 'root'
})
export class PersonalSessionFragmentService {

  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private uiService = inject(UiService);

  deletePersonalSessionFragmentTriggered$: Subject<void> = new Subject();
  
  constructor() { }

  batchCreatePersonalSessionFragments(userId: string, personalSessionFragmentsNoIdOrTimestamp: PersonalSessionFragmentNoIdOrTimestamp[]): Observable<PersonalSessionFragment[]> {
    const batch = writeBatch(this.firestore);
    const newPersonalSessionFragments: PersonalSessionFragment[] = []; // Used to provide a local copy of the values

    personalSessionFragmentsNoIdOrTimestamp.forEach(personalSessionFragment => {
      const currentTimeTimestamp: Timestamp = Timestamp.now();

      const newId = this.generateNewPersonalSessionFragmentDocumentId(userId);

      const personalSessionFragmentWithIdAndTimestamps: PersonalSessionFragment = {
        ...personalSessionFragment, 
        createdTimestamp: currentTimeTimestamp,
        id: newId,
        lastModifiedTimestamp: currentTimeTimestamp,
      };

      const personalSessionFragmentWithIdAndMs: PersonalSessionFragment = {
        ...personalSessionFragment, 
        createdTimestamp: currentTimeTimestamp.toMillis(),
        id: newId,
        lastModifiedTimestamp: currentTimeTimestamp.toMillis(),
      };

      const personalSessionFragmentDocRef = this.getPersonalSessionFragmentDoc(userId, newId);
      batch.set(personalSessionFragmentDocRef, personalSessionFragmentWithIdAndTimestamps);
      newPersonalSessionFragments.push(personalSessionFragmentWithIdAndMs);
    });

    const batchCreateRequest = batch.commit();

    return from(batchCreateRequest)
      .pipe(
        map(empty => {
          console.log(`Created ${newPersonalSessionFragments.length} personalSessionFragments`, newPersonalSessionFragments);
          return newPersonalSessionFragments;  // Use original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error deleting personalSessionFragments', error);
          return throwError(() => new Error(error));
        })
      );
  }

  batchDeletePersonalSessionFragments(userId: string, personalSessionFragmentIds: string[]): Observable<string[]> {
    this.triggerDeletePersonalSessionFragmentObserver();

    const batch = writeBatch(this.firestore);

    personalSessionFragmentIds.forEach(personalSessionFragmentId => {
      const personalSessionFragmentDoc = this.getPersonalSessionFragmentDoc(userId, personalSessionFragmentId);
      batch.delete(personalSessionFragmentDoc)
    });

    const batchDeleteRequest = batch.commit();

    return from(batchDeleteRequest)
      .pipe(
        map(empty => {
          console.log(`Deleted ${personalSessionFragmentIds.length} personalSessionFragments`, personalSessionFragmentIds);
          return personalSessionFragmentIds;  // Use original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error deleting personalSessionFragments', error);
          return throwError(() => new Error(error));
        })
      );
  }

  batchModifyPersonalSessionFragments(userId: string, personalSessionFragmentUpdates: Update<PersonalSessionFragment>[]): Observable<Update<PersonalSessionFragment>[]> {
    const batch = writeBatch(this.firestore);

    personalSessionFragmentUpdates.forEach(singlePersonalSessionFragmentUpdate => {
      const changesWithTimestamp: Partial<PersonalSessionFragment> = {
        ...singlePersonalSessionFragmentUpdate.changes,
        lastModifiedTimestamp: Timestamp.now()
      }
  
      const personalSessionFragmentUpdatesWithTimestamp: Update<PersonalSessionFragment> = {
        ...singlePersonalSessionFragmentUpdate,
        changes: changesWithTimestamp
      }
      const personalSessionFragmentDoc = this.getPersonalSessionFragmentDoc(userId, personalSessionFragmentUpdatesWithTimestamp.id as string);
      batch.update(personalSessionFragmentDoc, changesWithTimestamp)
    });

    const batchModifyRequest = batch.commit();

    return from(batchModifyRequest)
      .pipe(
        map(empty => {
          console.log(`Updated ${personalSessionFragmentUpdates.length} personalSessionFragments`, personalSessionFragmentUpdates);
          return personalSessionFragmentUpdates;  // Use original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error updating personalSessionFragment', error);
          return throwError(() => new Error(error));
        })
      );
  }

  createPersonalSessionFragment(userId: string, personalSessionFragmentNoIdOrTimestamp: PersonalSessionFragmentNoIdOrTimestamp): Observable<PersonalSessionFragment> {
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
    
    this.triggerDeletePersonalSessionFragmentObserver();

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

    const personalSessionFragmentCollectionDataRequest = collectionData(this.getPersonalSessionFragmentCollectionByIndex(userId));

    return from(personalSessionFragmentCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        // takeUntil(this.deletePersonalSessionFragmentTriggered$),
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
        shareReplay(),
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
        shareReplay(),
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
        takeUntil(this.deletePersonalSessionFragmentTriggered$),
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
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching personalSessionFragment', error);
          return throwError(() => new Error(error));
        })
      );
  }

  updatePersonalSessionFragment(userId: string, personalSessionFragmentUpdates: Update<PersonalSessionFragment>): Observable<Update<PersonalSessionFragment>> {
    const currentTimeTimestamp: Timestamp = Timestamp.now();
    const documentId = personalSessionFragmentUpdates.id as string;

    const changesWithTimestamp: Partial<PersonalSessionFragment> = {
      ...personalSessionFragmentUpdates.changes,
      lastModifiedTimestamp: currentTimeTimestamp
    };

    const changesWithMs: Update<PersonalSessionFragment> = {
      ...personalSessionFragmentUpdates,
      changes: {
        ...personalSessionFragmentUpdates.changes,
        lastModifiedTimestamp: currentTimeTimestamp.toMillis()
      }
    };
    const personalSessionFragmentDoc = this.getPersonalSessionFragmentDoc(userId, documentId!);
    const personalSessionFragmentUpdateRequest = updateDoc(personalSessionFragmentDoc, changesWithTimestamp);

    return from(personalSessionFragmentUpdateRequest)
      .pipe(
        map(emtpy => {
          console.log('Updated personalSessionFragment', changesWithMs);
          return changesWithMs; // Use new version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error updating personalSessionFragment', error);
          return throwError(() => new Error(error));
        })
      );
  }

  // This prevents Firebase from fetching a document after it has been deleted
  private triggerDeletePersonalSessionFragmentObserver() {
    this.deletePersonalSessionFragmentTriggered$.next(); // Send signal to Firebase subscriptions to unsubscribe
    this.deletePersonalSessionFragmentTriggered$.complete(); // Send signal to Firebase subscriptions to unsubscribe
    this.deletePersonalSessionFragmentTriggered$ = new Subject<void>(); // Reinitialize the unsubscribe subject in case page isn't refreshed after logout (which means auth wouldn't reset)
  }
  

  private getPersonalSessionFragmentCollection(userId: string): CollectionReference<PersonalSessionFragment> {
    // Note that personalSessionFragment is nested in Public User document
    return collection(this.firestore, `${PublicCollectionPaths.PUBLIC_USERS}/${userId}/${PublicCollectionPaths.PERSONAL_SESSION_FRAGMENTS}`) as CollectionReference<PersonalSessionFragment>;
  }

  private getPersonalSessionFragmentCollectionByIndex(userId: string): Query<PersonalSessionFragment> {
    const personalSessionFragmentCollectionRef = collection(this.firestore, `${PublicCollectionPaths.PUBLIC_USERS}/${userId}/${PublicCollectionPaths.PERSONAL_SESSION_FRAGMENTS}`) as CollectionReference<PersonalSessionFragment>;
    const collectionRefOrderedByIndex = query(personalSessionFragmentCollectionRef, orderBy(PersonalSessionFragmentKeys.QUEUE_INDEX));
    return collectionRefOrderedByIndex;
  }

  private getPersonalSessionFragmentDoc(userId: string, personalSessionFragmentId: string): DocumentReference<PersonalSessionFragment> {
    return doc(this.getPersonalSessionFragmentCollection(userId), personalSessionFragmentId);
  }

  private generateNewPersonalSessionFragmentDocumentId(userId: string): string {
    return doc(this.getPersonalSessionFragmentCollection(userId)).id;
  }

}
