import { Injectable, inject } from '@angular/core';
import { collection, setDoc, doc, docData, DocumentReference, CollectionReference, Firestore, deleteDoc, collectionData, query, where, limit, QueryConstraint, updateDoc } from '@angular/fire/firestore';
import { Update } from '@ngrx/entity';
import { from, Observable, throwError, catchError, map, takeUntil, Subject, shareReplay } from 'rxjs';
import { TrainingPlan, TrainingPlanNoIdOrTimestamp } from 'shared-models/train/training-plan.model';
import { UiService } from './ui.service';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionQueryParams } from 'shared-models/firestore/fs-collection-query-params.model';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class TrainingPlanService {

  deleteTrainingPlanRequested$: Subject<void> = new Subject();

  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private uiService = inject(UiService);

  constructor() {}

  createTrainingPlan(trainingPlanNoIdOrTimestamp: TrainingPlanNoIdOrTimestamp): Observable<TrainingPlan> {

    const currentTimeTimestamp: Timestamp = Timestamp.now();

    const newId = this.generateNewTrainingPlanDocumentId();

    const trainingPlanWithIdAndTimestamps: TrainingPlan = {
      ...trainingPlanNoIdOrTimestamp, 
      createdTimestamp: currentTimeTimestamp,
      id: newId,
      lastModifiedTimestamp: currentTimeTimestamp,
    };

    const trainingPlanWithIdAndMs: TrainingPlan = {
      ...trainingPlanNoIdOrTimestamp, 
      createdTimestamp: currentTimeTimestamp.toMillis(),
      id: newId,
      lastModifiedTimestamp: currentTimeTimestamp.toMillis(),
    };

    const trainingPlanDocRef = this.getTrainingPlanDoc(newId);
    const trainingPlanAddRequest = setDoc(trainingPlanDocRef, trainingPlanWithIdAndTimestamps);

    return from(trainingPlanAddRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(empty => {
          console.log('Created new trainingPlan', trainingPlanWithIdAndMs);
          return trainingPlanWithIdAndMs; // Use new version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error creating trainingPlan', error);
          return throwError(() => new Error(error));
        })
      );
  }

  deleteTrainingPlan(planId: string): Observable<string> {
    this.unsubscribeSingleTrainingPlan();

    const trainingPlanDeleteRequest = deleteDoc(this.getTrainingPlanDoc(planId));

    return from(trainingPlanDeleteRequest)
      .pipe(
        map(empty => {
          console.log('Deleted training plan', planId);
          return planId;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error deleting training plan', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchAllTrainingPlans(): Observable<TrainingPlan[]> {

    const trainingPlanCollectionDataRequest = collectionData(this.getTrainingPlanCollection());

    return from(trainingPlanCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(trainingPlans => {
          if (!trainingPlans) {
            throw new Error(`Error fetching all training plans`, );
          }
          const trainingPlansWithUpdatedTimestamps = trainingPlans.map(trainingPlan => {
            const formattedTrainingPlans: TrainingPlan = {
              ...trainingPlan,
              createdTimestamp: (trainingPlan.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (trainingPlan.lastModifiedTimestamp as Timestamp).toMillis()
            };
            return formattedTrainingPlans;
          });
          console.log(`Fetched all ${trainingPlansWithUpdatedTimestamps.length} trainingPlans`);
          return trainingPlansWithUpdatedTimestamps;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching training plans', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchMultipleTrainingPlans(queryParams: FirestoreCollectionQueryParams): Observable<TrainingPlan[]> {

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
    
    const trainingPlanCollectionQuery = query(
      this.getTrainingPlanCollection(),
      ...combinedQueryConstraints
    );

    const trainingPlanCollectionDataRequest = collectionData(trainingPlanCollectionQuery);

    return from(trainingPlanCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(trainingPlans => {
          if (!trainingPlans) {
            throw new Error(`Error fetching training plans with query: ${queryParams}`, );
          }
          const trainingPlansWithUpdatedTimestamps = trainingPlans.map(trainingPlan => {
            const formattedTrainingPlans: TrainingPlan = {
              ...trainingPlan,
              createdTimestamp: (trainingPlan.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (trainingPlan.lastModifiedTimestamp as Timestamp).toMillis()
            };
            return formattedTrainingPlans;
          });
          console.log(`Fetched all ${trainingPlansWithUpdatedTimestamps.length} trainingPlans`);
          return trainingPlansWithUpdatedTimestamps;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching training plans', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchSingleTrainingPlan(planId: string): Observable<TrainingPlan> {
    const trainingPlan = docData(this.getTrainingPlanDoc(planId));
    return trainingPlan
      .pipe(
        takeUntil(this.deleteTrainingPlanRequested$), // Prevents fetching error when plan is deleted
        takeUntil(this.authService.unsubTrigger$),
        map(trainingPlan => {
          if (!trainingPlan) {
            throw new Error(`Error fetching training plan with id: ${planId}`);
          }
          const formattedTrainingPlan: TrainingPlan = {
            ...trainingPlan,
            createdTimestamp: (trainingPlan.createdTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (trainingPlan.lastModifiedTimestamp as Timestamp).toMillis()
          };
          console.log(`Fetched single trainingPlan`, formattedTrainingPlan);
          return formattedTrainingPlan;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching training plan', error);
          return throwError(() => new Error(error));
        })
      );
  }

  updateTrainingPlan(trainingPlanUpdates: Update<TrainingPlan>): Observable<Update<TrainingPlan>> {
    const changesWithTimestamp: Partial<TrainingPlan> = {
      ...trainingPlanUpdates.changes,
      lastModifiedTimestamp: Timestamp.now()
    }

    const trainingPlanUpdatesWithTimestamp: Update<TrainingPlan> = {
      ...trainingPlanUpdates,
      changes: changesWithTimestamp
    }
    const trainingPlanDoc = this.getTrainingPlanDoc(trainingPlanUpdatesWithTimestamp.id as string);
    const trainingPlanUpdateRequest = updateDoc(trainingPlanDoc, changesWithTimestamp);

    return from(trainingPlanUpdateRequest)
      .pipe(
        map(empty => {
          console.log('Updated trainingPlan', trainingPlanUpdates);
          return trainingPlanUpdates;  // Use original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error updating trainingPlan', error);
          return throwError(() => new Error(error));
        })
      );
  }

  private unsubscribeSingleTrainingPlan() {
    this.deleteTrainingPlanRequested$.next(); // Send signal to Firebase subscriptions to unsubscribe
    this.deleteTrainingPlanRequested$.complete(); // Send signal to Firebase subscriptions to unsubscribe
    this.deleteTrainingPlanRequested$ = new Subject<void>(); // Reinitialize the unsubscribe subject in case page isn't refreshed after logout (which means auth wouldn't reset)
  }

  private getTrainingPlanCollection(): CollectionReference<TrainingPlan> {
    // Note that plan is nested in Public User document
    return collection(this.firestore, `${PublicCollectionPaths.TRAINING_PLANS}`) as CollectionReference<TrainingPlan>;
  }

  private getTrainingPlanDoc(planId: string): DocumentReference<TrainingPlan> {
    return doc(this.getTrainingPlanCollection(), planId);
  }

  private generateNewTrainingPlanDocumentId(): string {
    return doc(this.getTrainingPlanCollection()).id;
  }

}
