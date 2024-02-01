import { Injectable, inject } from '@angular/core';
import { collection, setDoc, doc, docData, DocumentReference, CollectionReference, Firestore, deleteDoc, collectionData, query, where, limit, QueryConstraint, updateDoc, Query, orderBy } from '@angular/fire/firestore';
import { Update } from '@ngrx/entity';
import { from, Observable, Subject, throwError } from 'rxjs';
import { catchError, map, shareReplay, takeUntil } from 'rxjs/operators';
import { TrainingRecord, TrainingRecordKeys, TrainingRecordNoIdOrTimestamp } from 'shared-models/train/training-record.model';
import { UiService } from './ui.service';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionQueryParams } from 'shared-models/firestore/fs-collection-query-params.model';
import { CanonicalTrainingSession } from 'shared-models/train/training-session.model';
import { Timestamp } from '@angular/fire/firestore';
import { PersonalSessionFragment } from 'shared-models/train/personal-session-fragment.model';
import { PlanSessionFragment } from 'shared-models/train/plan-session-fragment.model';

@Injectable({
  providedIn: 'root'
})
export class TrainingRecordService {

  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private uiService = inject(UiService);

  deleteTrainingRecordTriggered$: Subject<void> = new Subject();

  constructor() { }

  createTrainingRecord(userId: string, trainingRecordNoIdOrTimestamp: TrainingRecordNoIdOrTimestamp): Observable<TrainingRecord> {

    const currentTimeTimestamp: Timestamp = Timestamp.now();

    const newId = this.generateNewTrainingRecordDocumentId(userId);
    const trainingSessionWithConvertedTimestamps: CanonicalTrainingSession | PersonalSessionFragment | PlanSessionFragment = {
      ...trainingRecordNoIdOrTimestamp.trainingSessionData,
      createdTimestamp: Timestamp.fromMillis(trainingRecordNoIdOrTimestamp.trainingSessionData.createdTimestamp as number),
      lastModifiedTimestamp: Timestamp.fromMillis(trainingRecordNoIdOrTimestamp.trainingSessionData.lastModifiedTimestamp as number),
    };
    const trainingRecordWithIdAndTimestamps: TrainingRecord = {
      ...trainingRecordNoIdOrTimestamp, 
      createdTimestamp: currentTimeTimestamp,
      id: newId,
      lastModifiedTimestamp: currentTimeTimestamp,
      trainingSessionData: trainingSessionWithConvertedTimestamps
    };

    const trainingRecordWithIdAndMs: TrainingRecord = {
      ...trainingRecordNoIdOrTimestamp, 
      createdTimestamp: currentTimeTimestamp.toMillis(),
      id: newId,
      lastModifiedTimestamp: currentTimeTimestamp.toMillis(),
    };

    const trainingRecordDocRef = this.getTrainingRecordDoc(userId, newId);
    const trainingRecordAddRequest = setDoc(trainingRecordDocRef, trainingRecordWithIdAndTimestamps);

    return from(trainingRecordAddRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(empty => {
          console.log('Created new trainingRecord', trainingRecordWithIdAndMs);
          return trainingRecordWithIdAndMs; // Use new version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error creating trainingRecord', error);
          return throwError(() => new Error(error));
        })
      );
  }

  deleteTrainingRecord(userId: string, trainingRecordId: string): Observable<string> {
    const trainingRecordDeleteRequest = deleteDoc(this.getTrainingRecordDoc(userId, trainingRecordId));

    this.triggerDeleteTrainingRecordObserver();

    return from(trainingRecordDeleteRequest)
      .pipe(
        map(empty => {
          console.log('Deleted trainingRecord', trainingRecordId);
          return trainingRecordId;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error deleting trainingRecord', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchAllTrainingRecords(userId: string): Observable<TrainingRecord[]> {

    
    const trainingRecordCollectionDataRequest = collectionData(this.getTrainingRecordCollectionByDate(userId));

    // TODO: See if we can remove this from since this is already an observable? If so, update all other services
    return from(trainingRecordCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        // takeUntil(this.deleteTrainingRecordTriggered$),
        map(trainingRecords => {
          if (!trainingRecords) {
            throw new Error(`Error fetching all trainingRecords`, );
          }
          const trainingRecordsWithUpdatedTimestamps = trainingRecords.map(trainingRecord => {
            const formattedTrainingSessionData: CanonicalTrainingSession | PersonalSessionFragment | PlanSessionFragment = {
              ...trainingRecord.trainingSessionData,
              createdTimestamp: (trainingRecord.trainingSessionData.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (trainingRecord.trainingSessionData.lastModifiedTimestamp as Timestamp).toMillis()
            }
            const formattedTrainingRecord: TrainingRecord = {
              ...trainingRecord,
              createdTimestamp: (trainingRecord.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (trainingRecord.lastModifiedTimestamp as Timestamp).toMillis(),
              trainingSessionData: formattedTrainingSessionData
            };
            return formattedTrainingRecord;
          });
          console.log(`Fetched all ${trainingRecordsWithUpdatedTimestamps.length} trainingRecords`);
          return trainingRecordsWithUpdatedTimestamps;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching trainingRecords', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchMultipleTrainingRecords(userId: string, queryParams: FirestoreCollectionQueryParams): Observable<TrainingRecord[]> {

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
    
    const trainingRecordCollectionQuery = query(
      this.getTrainingRecordCollection(userId),
      ...combinedQueryConstraints
    );

    const trainingRecordCollectionDataRequest = collectionData(trainingRecordCollectionQuery);

    return from(trainingRecordCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(trainingRecords => {
          if (!trainingRecords) {
            throw new Error(`Error fetching trainingRecords with query: ${queryParams}`, );
          }
          const trainingRecordsWithUpdatedTimestamps = trainingRecords.map(trainingRecord => {
            const formattedTrainingSessionData: CanonicalTrainingSession | PersonalSessionFragment | PlanSessionFragment = {
              ...trainingRecord.trainingSessionData,
              createdTimestamp: (trainingRecord.trainingSessionData.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (trainingRecord.trainingSessionData.lastModifiedTimestamp as Timestamp).toMillis()
            }
            const formattedTrainingRecord: TrainingRecord = {
              ...trainingRecord,
              createdTimestamp: (trainingRecord.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (trainingRecord.lastModifiedTimestamp as Timestamp).toMillis(),
              trainingSessionData: formattedTrainingSessionData
            };
            return formattedTrainingRecord;
          });
          console.log(`Fetched all ${trainingRecordsWithUpdatedTimestamps.length} trainingRecords`);
          return trainingRecordsWithUpdatedTimestamps;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching trainingRecords', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchSingleTrainingRecord(userId: string, trainingRecordId: string): Observable<TrainingRecord> {
    const trainingRecord = docData(this.getTrainingRecordDoc(userId, trainingRecordId));
    return trainingRecord
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        takeUntil(this.deleteTrainingRecordTriggered$),
        map(trainingRecord => {
          if (!trainingRecord) {
            throw new Error(`Error fetching trainingRecord with id: ${trainingRecordId}`);
          }
          const formattedTrainingSessionData: CanonicalTrainingSession | PersonalSessionFragment | PlanSessionFragment = {
            ...trainingRecord.trainingSessionData,
            createdTimestamp: (trainingRecord.trainingSessionData.createdTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (trainingRecord.trainingSessionData.lastModifiedTimestamp as Timestamp).toMillis()
          }
          const formattedTrainingRecord: TrainingRecord = {
            ...trainingRecord,
            createdTimestamp: (trainingRecord.createdTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (trainingRecord.lastModifiedTimestamp as Timestamp).toMillis(),
            trainingSessionData: formattedTrainingSessionData
          };
          console.log(`Fetched single trainingRecord`, formattedTrainingRecord);
          return formattedTrainingRecord;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching trainingRecord', error);
          return throwError(() => new Error(error));
        })
      );
  }

  updateTrainingRecord(userId: string, trainingRecordUpdates: Update<TrainingRecord>): Observable<Update<TrainingRecord>> {
    
    const currentTimeTimestamp: Timestamp = Timestamp.now();
    const documentId = trainingRecordUpdates.id as string;
    
    const changesWithTimestamp: Partial<TrainingRecord> = {
      ...trainingRecordUpdates.changes,
      lastModifiedTimestamp: Timestamp.now()
    };

    // Update embedded training session data timestamp if it exists
    let trainingSessionWithConvertedTimestamps: CanonicalTrainingSession | PersonalSessionFragment | PlanSessionFragment;
    if (trainingRecordUpdates.changes.trainingSessionData) {
      trainingSessionWithConvertedTimestamps = {
        ...trainingRecordUpdates.changes.trainingSessionData,
        createdTimestamp: Timestamp.fromMillis(trainingRecordUpdates.changes.trainingSessionData.createdTimestamp as number),
        lastModifiedTimestamp: Timestamp.fromMillis(trainingRecordUpdates.changes.trainingSessionData.lastModifiedTimestamp as number),
      };
      changesWithTimestamp.trainingSessionData = trainingSessionWithConvertedTimestamps;
    }

    const changesWithMs: Update<TrainingRecord> = {
      ...trainingRecordUpdates,
      changes: {
        ...trainingRecordUpdates.changes,
        lastModifiedTimestamp: currentTimeTimestamp.toMillis()
      }
    };
    const trainingRecordDoc = this.getTrainingRecordDoc(userId, documentId!);
    const trainingRecordUpdateRequest = updateDoc(trainingRecordDoc, changesWithTimestamp);

    return from(trainingRecordUpdateRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        map(empty => {
          console.log('Updated trainingRecord', changesWithMs);
          return changesWithMs; // Use the original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error creating trainingRecord', error);
          return throwError(() => new Error(error));
        })
      );
  }

  // This prevents Firebase from fetching a document after it has been deleted
  private triggerDeleteTrainingRecordObserver() {
    this.deleteTrainingRecordTriggered$.next(); // Send signal to Firebase subscriptions to unsubscribe
    this.deleteTrainingRecordTriggered$.complete(); // Send signal to Firebase subscriptions to unsubscribe
    this.deleteTrainingRecordTriggered$ = new Subject<void>(); // Reinitialize the unsubscribe subject in case page isn't refreshed after logout (which means auth wouldn't reset)
  }

  private getTrainingRecordCollection(userId: string): CollectionReference<TrainingRecord> {
    // Note that trainingRecord is nested in Public User document
    return collection(this.firestore, `${PublicCollectionPaths.PUBLIC_USERS}/${userId}/${PublicCollectionPaths.TRAINING_RECORDS}`) as CollectionReference<TrainingRecord>;
  }

  private getTrainingRecordCollectionByDate(userId: string): Query<TrainingRecord> {
    const trainingRecordCollectionRef = collection(this.firestore, `${PublicCollectionPaths.PUBLIC_USERS}/${userId}/${PublicCollectionPaths.TRAINING_RECORDS}`) as CollectionReference<TrainingRecord>;
    const collectionRefOrderedByIndex = query(trainingRecordCollectionRef, orderBy(TrainingRecordKeys.CREATED_TIMESTAMP, 'desc'));
    return collectionRefOrderedByIndex;
  }

  private getTrainingRecordDoc(userId: string, trainingRecordId: string): DocumentReference<TrainingRecord> {
    return doc(this.getTrainingRecordCollection(userId), trainingRecordId);
  }

  private generateNewTrainingRecordDocumentId(userId: string): string {
    return doc(this.getTrainingRecordCollection(userId)).id;
  }

}
