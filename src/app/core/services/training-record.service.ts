import { Injectable } from '@angular/core';
import { collection, setDoc, doc, docData, DocumentReference, CollectionReference, Firestore, deleteDoc, collectionData, query, where, limit, QueryConstraint, updateDoc } from '@angular/fire/firestore';
import { Update } from '@ngrx/entity';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { TrainingRecord, TrainingRecordNoIdOrTimestamp } from 'shared-models/train/training-record.model';
import { UiService } from './ui.service';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionQueryParams } from 'shared-models/firestore/fs-collection-query-params.model';
import { TrainingSession } from 'shared-models/train/training-session.model';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class TrainingRecordService {

  constructor(
    private afs: Firestore,
    private authService: AuthService,
    private uiService: UiService,
  ) { }

  // TODO: STill causing unserializable data
  createTrainingRecord(userId: string, trainingRecordNoIdOrTimestamp: TrainingRecordNoIdOrTimestamp): Observable<TrainingRecord> {

    const currentTimeTimestamp: Timestamp = Timestamp.now();

    const newId = this.generateNewTrainingRecordDocumentId(userId);
    const trainingSessionWithConvertedTimestamps: TrainingSession = {
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

    const trainingRecordCollectionDataRequest = collectionData(this.getTrainingRecordCollection(userId));

    return from(trainingRecordCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(trainingRecords => {
          if (!trainingRecords) {
            throw new Error(`Error fetching all trainingRecords`, );
          }
          const trainingRecordsWithUpdatedTimestamps = trainingRecords.map(trainingRecord => {
            const formattedTrainingSessionData: TrainingSession = {
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
            const formattedTrainingSessionData: TrainingSession = {
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
        map(trainingRecord => {
          if (!trainingRecord) {
            throw new Error(`Error fetching trainingRecord with id: ${trainingRecordId}`);
          }
          const formattedTrainingSessionData: TrainingSession = {
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
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching trainingRecord', error);
          return throwError(() => new Error(error));
        })
      );
  }

  updateTrainingRecord(userId: string, trainingRecordUpdates: Update<TrainingRecord>): Observable<Update<TrainingRecord>> {
    
    const changesWithTimestamp: Partial<TrainingRecord> = {
      ...trainingRecordUpdates.changes,
      lastModifiedTimestamp: Timestamp.now()
    }

    // Update training session data timestamp if it exists
    let trainingSessionWithConvertedTimestamps: TrainingSession;
    if (trainingRecordUpdates.changes.trainingSessionData) {
      trainingSessionWithConvertedTimestamps = {
        ...trainingRecordUpdates.changes.trainingSessionData,
        createdTimestamp: Timestamp.fromMillis(trainingRecordUpdates.changes.trainingSessionData.createdTimestamp as number),
        lastModifiedTimestamp: Timestamp.fromMillis(trainingRecordUpdates.changes.trainingSessionData.lastModifiedTimestamp as number),
      };
      changesWithTimestamp.trainingSessionData = trainingSessionWithConvertedTimestamps;
    }

    const trainingRecordUpdatesWithTimestamp: Update<TrainingRecord> = {
      ...trainingRecordUpdates,
      changes: changesWithTimestamp
    };
    const trainingRecordDoc = this.getTrainingRecordDoc(userId, trainingRecordUpdatesWithTimestamp.id as string);
    const trainingRecordUpdateRequest = updateDoc(trainingRecordDoc, changesWithTimestamp);

    return from(trainingRecordUpdateRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        map(docRef => {
          console.log('Updated trainingRecord', trainingRecordUpdates);
          return trainingRecordUpdates; // Use the original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error creating trainingRecord', error);
          return throwError(() => new Error(error));
        })
      );
  }

  private getTrainingRecordCollection(userId: string): CollectionReference<TrainingRecord> {
    // Note that trainingRecord is nested in Public User document
    return collection(this.afs, `${PublicCollectionPaths.PUBLIC_USERS}/${userId}/${PublicCollectionPaths.TRAINING_RECORDS}`) as CollectionReference<TrainingRecord>;
  }

  private getTrainingRecordDoc(userId: string, trainingRecordId: string): DocumentReference<TrainingRecord> {
    return doc(this.getTrainingRecordCollection(userId), trainingRecordId);
  }

  private generateNewTrainingRecordDocumentId(userId: string): string {
    return doc(this.getTrainingRecordCollection(userId)).id;
  }

}
