import { Injectable, inject } from '@angular/core';
import { collection, setDoc, doc, docData, DocumentReference, CollectionReference, Firestore, deleteDoc, collectionData, query, where, limit, QueryConstraint, updateDoc, orderBy } from '@angular/fire/firestore';
import { Update } from '@ngrx/entity';
import { from, Observable, throwError, catchError, map, takeUntil, Subject, shareReplay, combineLatest, take } from 'rxjs';
import { TrainingPlan, TrainingPlanKeys, TrainingPlanNoIdOrTimestamp, TrainingPlanVisibilityCategoryDbOption } from 'shared-models/train/training-plan.model';
import { UiService } from './ui.service';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionQueryParams } from 'shared-models/firestore/fs-collection-query-params.model';
import { Timestamp } from '@angular/fire/firestore';
import { DeleteTrainingPlanData } from 'shared-models/train/delete-training-plan-data.model';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { PublicFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';
import { PlanSessionFragmentService } from './plan-session-fragment.service';

@Injectable({
  providedIn: 'root'
})
export class TrainingPlanService {

  private deleteTrainingPlanTriggered$: Subject<void> = new Subject();

  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private uiService = inject(UiService);
  private functions = inject(Functions);
  private planSessionFragmentService = inject(PlanSessionFragmentService);

  constructor() {}

  createTrainingPlan(trainingPlanNoIdOrTimestamp: TrainingPlanNoIdOrTimestamp, userId: string): Observable<TrainingPlan> {
    const currentTimeTimestamp: Timestamp = Timestamp.now();

    const newId = this.generateNewTrainingPlanDocumentId();

    const visibilityCategory = trainingPlanNoIdOrTimestamp[TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY];
    const isPublicTrainingPlan = visibilityCategory === TrainingPlanVisibilityCategoryDbOption.PUBLIC;

    let trainingPlanDocRef: DocumentReference<TrainingPlan>;

    if (isPublicTrainingPlan) {
      trainingPlanDocRef = this.getPublicTrainingPlanDoc(newId);
    } else {
      trainingPlanDocRef = this.getPrivateTrainingPlanDoc(newId, userId);
    }

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

    const trainingPlanAddRequest = setDoc(trainingPlanDocRef, trainingPlanWithIdAndTimestamps);

    return from(trainingPlanAddRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(empty => {
          console.log(`Created new ${visibilityCategory} trainingPlan`, trainingPlanWithIdAndMs);
          return trainingPlanWithIdAndMs; // Use new version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error creating ${visibilityCategory} trainingPlan`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  // This triggers a recursive delete cloud function which also deletes all the subcollections
  deleteTrainingPlan(trainingPlan: TrainingPlan, userId: string): Observable<string> {
    const visibilityCategory = trainingPlan[TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY];

    const deleteTrainingPlanData: DeleteTrainingPlanData = {
      trainingPlan,
      userId
    };
    const deleteTrainingPlanHttpCall: (deleteData: DeleteTrainingPlanData) => 
      Observable<void> = httpsCallableData(this.functions, PublicFunctionNames.ON_CALL_DELETE_TRAINING_PLAN);

    this.triggerDeleteTrainingPlanObserver();
    this.planSessionFragmentService.triggerDeletePlanSessionFragmentObserver();

    return deleteTrainingPlanHttpCall(deleteTrainingPlanData)
      .pipe(
        take(1),
        map(empty => {
          console.log(`Deleted ${visibilityCategory} trainingPlan`);
          return trainingPlan.id;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error deleting ${visibilityCategory} trainingPlan`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchAllTrainingPlans(userId: string): Observable<TrainingPlan[]> {

    const publicTrainingPlanCollectionDataRequest = collectionData(this.getPublicTrainingPlanCollection());
    const privateTrainingPlanCollectionDataRequest = collectionData(this.getPrivateTrainingPlanCollection(userId));

    // Combine both public and private training plans
    return combineLatest([publicTrainingPlanCollectionDataRequest, privateTrainingPlanCollectionDataRequest])
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        // takeUntil(this.deleteTrainingPlanTriggered$),
        map(([publicTrainingPlans, privateTrainingPlans]) => {
          if (!publicTrainingPlans && !privateTrainingPlans) {
            throw new Error(`Error fetching trainingPlans`);
          }
          const combinedTrainingPlans = publicTrainingPlans.concat(privateTrainingPlans);
          const trainingPlansWithUpdatedTimestamps = combinedTrainingPlans.map(trainingPlan => {
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
          console.log('Error fetching trainingPlans', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchMultipleTrainingPlans(queryParams: FirestoreCollectionQueryParams, userId: string): Observable<TrainingPlan[]> {

    const whereQueryConditions: QueryConstraint[] | undefined = queryParams.whereQueries ? 
      queryParams.whereQueries.map(condition => where(condition.property, condition.operator, condition.value)) :
      undefined;

    const limitQueryCondition: QueryConstraint | undefined = queryParams.limit ? 
      limit(queryParams.limit) : 
      undefined;

    // Aggregate query constraints if they exist
    let combinedQueryConstraints: QueryConstraint[] = [];
    
    if (whereQueryConditions) {
      combinedQueryConstraints = [...whereQueryConditions];
    }
    if (limitQueryCondition) {
      combinedQueryConstraints = [...combinedQueryConstraints, limitQueryCondition];
    }

    const publicTrainingPlanCollectionQuery = query(
      this.getPublicTrainingPlanCollection(),
      ...combinedQueryConstraints,
    );

    const privateTrainingPlanCollectionQuery = query(
      this.getPrivateTrainingPlanCollection(userId),
      ...combinedQueryConstraints,
    );

    const publicTrainingPlanCollectionDataRequest = collectionData(publicTrainingPlanCollectionQuery);
    const privateTrainingPlanCollectionDataRequest = collectionData(privateTrainingPlanCollectionQuery);

    return combineLatest([publicTrainingPlanCollectionDataRequest, privateTrainingPlanCollectionDataRequest])
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(([publicTrainingPlans, privateTrainingPlans]) => {
          if (!publicTrainingPlans && !privateTrainingPlans) {
            throw new Error(`Error fetching trainingPlans`);
          }
          const combinedTrainingPlans = publicTrainingPlans.concat(privateTrainingPlans);
          const trainingPlansWithUpdatedTimestamps = combinedTrainingPlans.map(trainingPlan => {
            const formattedTrainingPlans: TrainingPlan = {
              ...trainingPlan,
              createdTimestamp: (trainingPlan.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (trainingPlan.lastModifiedTimestamp as Timestamp).toMillis()
            };
            return formattedTrainingPlans;
          });
          console.log(`Fetched ${trainingPlansWithUpdatedTimestamps.length} trainingPlans`);
          return trainingPlansWithUpdatedTimestamps;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error fetching trainingPlans`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchSingleTrainingPlan(trainingPlanId: string, userId: string, visibilityCategory: TrainingPlanVisibilityCategoryDbOption): Observable<TrainingPlan> {
    const isPublicTrainingPlan = visibilityCategory === TrainingPlanVisibilityCategoryDbOption.PUBLIC;
    let trainingPlan: Observable<TrainingPlan>;

    if (isPublicTrainingPlan) {
      trainingPlan = docData(this.getPublicTrainingPlanDoc(trainingPlanId));
    } else {
      trainingPlan = docData(this.getPrivateTrainingPlanDoc(trainingPlanId, userId));
    }

    return trainingPlan
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        takeUntil(this.deleteTrainingPlanTriggered$),
        map(trainingPlan => {
          if (!trainingPlan) {
            throw new Error(`Error fetching trainingPlan with id: ${trainingPlanId}`);
          }
          const formattedTrainingPlan: TrainingPlan = {
            ...trainingPlan,
            createdTimestamp: (trainingPlan.createdTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (trainingPlan.lastModifiedTimestamp as Timestamp).toMillis()
          };
          console.log(`Fetched single ${visibilityCategory} trainingPlan`, formattedTrainingPlan);
          return formattedTrainingPlan;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error fetching ${visibilityCategory} trainingPlan`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  updateTrainingPlan(trainingPlanUpdates: Update<TrainingPlan>, userId: string, visibilityCategory: TrainingPlanVisibilityCategoryDbOption): Observable<Update<TrainingPlan>> {
    const currentTimeTimestamp: Timestamp = Timestamp.now();

    const isPublicTrainingPlan = visibilityCategory === TrainingPlanVisibilityCategoryDbOption.PUBLIC;
    const documentId = trainingPlanUpdates.id as string;

    let trainingPlanDoc: DocumentReference<TrainingPlan>;

    if (isPublicTrainingPlan) {
      trainingPlanDoc = this.getPublicTrainingPlanDoc(documentId!);
    } else {
      trainingPlanDoc = this.getPrivateTrainingPlanDoc(documentId!, userId);
    }

    const changesWithTimestamp: Partial<TrainingPlan> = {
      ...trainingPlanUpdates.changes,
      lastModifiedTimestamp: currentTimeTimestamp
    };

    const changesWithMs: Update<TrainingPlan> = {
      ...trainingPlanUpdates,
      changes: {
        ...trainingPlanUpdates.changes,
        lastModifiedTimestamp: currentTimeTimestamp.toMillis()
      }
    };

    const trainingPlanUpdateRequest = updateDoc(trainingPlanDoc, changesWithTimestamp);

    return from(trainingPlanUpdateRequest)
      .pipe(
        map(empty => {
          console.log(`Updated ${visibilityCategory} trainingPlan`, changesWithMs);
          return changesWithMs; // Use original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error updating ${visibilityCategory} trainingPlan`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  private triggerDeleteTrainingPlanObserver() {
    this.deleteTrainingPlanTriggered$.next(); // Send signal to Firebase subscriptions to unsubscribe
    this.deleteTrainingPlanTriggered$.complete(); // Send signal to Firebase subscriptions to unsubscribe
    this.deleteTrainingPlanTriggered$ = new Subject<void>(); // Reinitialize the unsubscribe subject in case page isn't refreshed after logout (which means auth wouldn't reset)
  }

  private getPrivateTrainingPlanCollection(userId: string): CollectionReference<TrainingPlan> {
    // Note that the privateTrainingPlan collection is nested in Public User document
    return collection(this.firestore, `${PublicCollectionPaths.PUBLIC_USERS}/${userId}/${PublicCollectionPaths.PRIVATE_TRAINING_PLANS}`) as CollectionReference<TrainingPlan>;
  }

  private getPrivateTrainingPlanDoc(trainingPlanId: string, userId: string): DocumentReference<TrainingPlan> {
    return doc(this.getPrivateTrainingPlanCollection(userId), trainingPlanId);
  }

  private getPublicTrainingPlanCollection(): CollectionReference<TrainingPlan> {
    // Note that plan is nested in Public User document
    return collection(this.firestore, PublicCollectionPaths.PUBLIC_TRAINING_PLANS) as CollectionReference<TrainingPlan>;
  }

  private getPublicTrainingPlanDoc(planId: string): DocumentReference<TrainingPlan> {
    return doc(this.getPublicTrainingPlanCollection(), planId);
  }

  private generateNewTrainingPlanDocumentId(): string {
    return doc(this.getPublicTrainingPlanCollection()).id;
  }

}
