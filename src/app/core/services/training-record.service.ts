import { Injectable } from '@angular/core';
import { collection, setDoc, doc, docData, DocumentReference, CollectionReference, Firestore, deleteDoc, collectionData, query, where, limit, QueryConstraint, updateDoc } from '@angular/fire/firestore';
import { Update } from '@ngrx/entity';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { TrainingRecord, TrainingRecordNoId } from 'shared-models/train/training-record.model';
import { UiService } from './ui.service';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionQueryParams } from 'shared-models/firestore/fs-collection-query-params.model';

@Injectable({
  providedIn: 'root'
})
export class TrainingRecordService {

  constructor(
    private afs: Firestore,
    private authService: AuthService,
    private uiService: UiService
  ) { }

  createTrainingRecord(userId: string, trainingRecordNoId: TrainingRecordNoId): Observable<TrainingRecord> {

    const newId = this.generateNewTrainingRecordDocumentId(userId);
    const trainingRecordWithId = {...trainingRecordNoId, id: newId};
    const trainingRecordDocRef = this.getTrainingRecordDoc(userId, newId);
    const trainingRecordAddRequest = setDoc(trainingRecordDocRef, trainingRecordWithId);

    return from(trainingRecordAddRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(empty => {
          return trainingRecordWithId;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error creating training record', error);
          return throwError(() => new Error(error));
        })
      );
  }

  deleteTrainingRecord(userId: string, recordId: string): Observable<string> {
    const trainingRecordDeleteRequest = deleteDoc(this.getTrainingRecordDoc(userId, recordId));

    return from(trainingRecordDeleteRequest)
      .pipe(
        map(empty => {
          console.log('Deleted training record', recordId);
          return recordId;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error deleting training record', error);
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
            throw new Error(`Error fetching training records with query: ${queryParams}`, );
          }
          console.log(`Fetched ${trainingRecords.length} training records`, );
          return trainingRecords;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching training records', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchSingleTrainingRecord(userId: string, recordId: string): Observable<TrainingRecord> {
    const trainingRecord = docData(this.getTrainingRecordDoc(userId, recordId));
    return trainingRecord
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(record => {
          if (!record) {
            throw new Error(`Error fetching training record with id: ${recordId}`);
          }
          console.log('Fetched trainingRecord', record);
          return record;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching training record', error);
          return throwError(() => new Error(error));
        })
      );
  }

  updateTrainingRecord(userId: string, trainingRecordUpdates: Update<TrainingRecord>): Observable<Update<TrainingRecord>> {
    const trainingRecordDoc = this.getTrainingRecordDoc(userId, trainingRecordUpdates.id as string);
    const trainingRecordUpdateRequest = updateDoc(trainingRecordDoc, trainingRecordUpdates.changes);

    return from(trainingRecordUpdateRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        map(docRef => {
          console.log('Updated training record', trainingRecordUpdates.changes);
          return trainingRecordUpdates;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error creating training record', error);
          return throwError(() => new Error(error));
        })
      );
  }

  private getTrainingRecordCollection(userId: string): CollectionReference<TrainingRecord> {
    // Note that record is nested in Public User document
    return collection(this.afs, `${PublicCollectionPaths.PUBLIC_USERS}/${userId}/${PublicCollectionPaths.TRAINING_RECORDS}`) as CollectionReference<TrainingRecord>;
  }

  private getTrainingRecordDoc(userId: string, recordId: string): DocumentReference<TrainingRecord> {
    return doc(this.getTrainingRecordCollection(userId), recordId);
  }

  private generateNewTrainingRecordDocumentId(userId: string): string {
    return doc(this.getTrainingRecordCollection(userId)).id;
  }

}
