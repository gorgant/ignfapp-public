import { Injectable, inject } from '@angular/core';
import { collection, setDoc, doc, docData, DocumentReference, CollectionReference, Firestore, deleteDoc, collectionData, query, where, limit, QueryConstraint, updateDoc, writeBatch, Timestamp, orderBy, Query } from '@angular/fire/firestore';
import { Update } from '@ngrx/entity';
import { from, Observable, Subject, throwError } from 'rxjs';
import { catchError, map, shareReplay, takeUntil } from 'rxjs/operators';
import { PlanSessionFragment, PlanSessionFragmentKeys, PlanSessionFragmentNoIdOrTimestamp } from 'shared-models/train/plan-session-fragment.model';
import { UiService } from './ui.service';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionQueryParams } from 'shared-models/firestore/fs-collection-query-params.model';
import { TrainingPlan, TrainingPlanKeys, TrainingPlanVisibilityCategoryDbOption } from 'shared-models/train/training-plan.model';

@Injectable({
  providedIn: 'root'
})
export class PlanSessionFragmentService {

  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private uiService = inject(UiService);
  
  deletePlanSessionFragmentTriggered$: Subject<void> = new Subject();

  constructor() { }

  batchDeletePlanSessionFragments(trainingPlan: TrainingPlan, planSessionFragmentIds: string[], userId: string): Observable<string[]> {
    this.triggerDeletePlanSessionFragmentObserver();

    const batch = writeBatch(this.firestore);

    const visibilityCategory = trainingPlan[TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY];
    const isPublicTrainingPlan = visibilityCategory === TrainingPlanVisibilityCategoryDbOption.PUBLIC;

    planSessionFragmentIds.forEach(planSessionFragmentId => {
      let planSessionFragmentDoc: DocumentReference<PlanSessionFragment>;

      if (isPublicTrainingPlan) {
        planSessionFragmentDoc = this.getPublicPlanSessionFragmentDoc(trainingPlan.id, planSessionFragmentId);
      } else {
        planSessionFragmentDoc = this.getPrivatePlanSessionFragmentDoc(trainingPlan.id, planSessionFragmentId, userId);
      }

      batch.delete(planSessionFragmentDoc)
    });

    const batchDeleteRequest = batch.commit();

    return from(batchDeleteRequest)
      .pipe(
        map(empty => {
          console.log(`Deleted ${planSessionFragmentIds.length} ${visibilityCategory} planSessionFragments`, planSessionFragmentIds);
          return planSessionFragmentIds;  // Use original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error deleting ${visibilityCategory} planSessionFragments`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  batchModifyPlanSessionFragments(trainingPlan: TrainingPlan, planSessionFragmentUpdates: Update<PlanSessionFragment>[], userId: string): Observable<Update<PlanSessionFragment>[]> {
    const batch = writeBatch(this.firestore);

    const visibilityCategory = trainingPlan[TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY];
    const isPublicTrainingPlan = visibilityCategory === TrainingPlanVisibilityCategoryDbOption.PUBLIC;

    planSessionFragmentUpdates.forEach(singlePlanSessionFragmentUpdate => {
      let planSessionFragmentDoc: DocumentReference<PlanSessionFragment>;
      const documentId = singlePlanSessionFragmentUpdate.id as string;

      if (isPublicTrainingPlan) {
        planSessionFragmentDoc = this.getPublicPlanSessionFragmentDoc(trainingPlan.id, documentId);
      } else {
        planSessionFragmentDoc = this.getPrivatePlanSessionFragmentDoc(trainingPlan.id, documentId, userId);
      }

      const changesWithTimestamp: Partial<PlanSessionFragment> = {
        ...singlePlanSessionFragmentUpdate.changes,
        lastModifiedTimestamp: Timestamp.now()
      }
  
      const planSessionFragmentUpdatesWithTimestamp: Update<PlanSessionFragment> = {
        ...singlePlanSessionFragmentUpdate,
        changes: changesWithTimestamp
      }
      batch.update(planSessionFragmentDoc, changesWithTimestamp)
    });

    const batchModifyRequest = batch.commit();

    return from(batchModifyRequest)
      .pipe(
        map(empty => {
          console.log(`Updated ${planSessionFragmentUpdates.length} ${visibilityCategory} planSessionFragments`, planSessionFragmentUpdates);
          return planSessionFragmentUpdates;  // Use original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error updating ${visibilityCategory} planSessionFragment`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  createPlanSessionFragment(trainingPlanId: string, planSessionFragmentNoIdOrTimestamp: PlanSessionFragmentNoIdOrTimestamp, userId: string): Observable<PlanSessionFragment> {
    const currentTimeTimestamp: Timestamp = Timestamp.now();

    const newId = this.generateNewPlanSessionFragmentDocumentId(trainingPlanId);

    const visibilityCategory = planSessionFragmentNoIdOrTimestamp[PlanSessionFragmentKeys.TRAINING_PLAN_VISIBILITY_CATEGORY];
    const isPublicPlanSessionFragment = visibilityCategory === TrainingPlanVisibilityCategoryDbOption.PUBLIC;

    let planSessionFragmentDocRef: DocumentReference<PlanSessionFragment>;

    if (isPublicPlanSessionFragment) {
      planSessionFragmentDocRef = this.getPublicPlanSessionFragmentDoc(trainingPlanId, newId);
    } else {
      planSessionFragmentDocRef = this.getPrivatePlanSessionFragmentDoc(trainingPlanId, newId, userId);
    }

    const planSessionFragmentWithIdAndTimestamps: PlanSessionFragment = {
      ...planSessionFragmentNoIdOrTimestamp, 
      createdTimestamp: currentTimeTimestamp,
      id: newId,
      lastModifiedTimestamp: currentTimeTimestamp,
    };

    const planSessionFragmentWithIdAndMs: PlanSessionFragment = {
      ...planSessionFragmentNoIdOrTimestamp, 
      createdTimestamp: currentTimeTimestamp.toMillis(),
      id: newId,
      lastModifiedTimestamp: currentTimeTimestamp.toMillis(),
    };

    const planSessionFragmentAddRequest = setDoc(planSessionFragmentDocRef, planSessionFragmentWithIdAndTimestamps);

    return from(planSessionFragmentAddRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(empty => {
          console.log(`Created new ${visibilityCategory} planSessionFragment`, planSessionFragmentWithIdAndMs);
          return planSessionFragmentWithIdAndMs; // Use new version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error creating ${visibilityCategory} planSessionFragment`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  deletePlanSessionFragment(trainingPlanId: string, planSessionFragment: PlanSessionFragment, userId: string): Observable<string> {
    const documentId = planSessionFragment[PlanSessionFragmentKeys.ID];
    const visibilityCategory = planSessionFragment[PlanSessionFragmentKeys.TRAINING_PLAN_VISIBILITY_CATEGORY];
    const isPublicPlanSessionFragment = visibilityCategory === TrainingPlanVisibilityCategoryDbOption.PUBLIC;
    
    let planSessionFragmentDeleteRequest: Promise<void>

    if (isPublicPlanSessionFragment) {
      planSessionFragmentDeleteRequest = deleteDoc(this.getPublicPlanSessionFragmentDoc(trainingPlanId, planSessionFragment.id));
    } else {
      planSessionFragmentDeleteRequest = deleteDoc(this.getPrivatePlanSessionFragmentDoc(trainingPlanId, planSessionFragment.id, userId));
    }
    
    this.triggerDeletePlanSessionFragmentObserver();

    return from(planSessionFragmentDeleteRequest)
      .pipe(
        map(empty => {
          console.log(`Deleted ${visibilityCategory} planSessionFragment`, documentId);
          return documentId;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error deleting ${visibilityCategory} planSessionFragment`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchAllPlanSessionFragments(trainingPlan: TrainingPlan, userId: string): Observable<PlanSessionFragment[]> {

    const visibilityCategory = trainingPlan[TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY];
    const isPublicTrainingPlan = visibilityCategory === TrainingPlanVisibilityCategoryDbOption.PUBLIC;

    let planSessionFragmentCollectionDataRequest: Observable<PlanSessionFragment[]>;

    if (isPublicTrainingPlan) {
      planSessionFragmentCollectionDataRequest = collectionData(this.getPublicPlanSessionFragmentCollectionByIndex(trainingPlan.id));
    } else {
      planSessionFragmentCollectionDataRequest = collectionData(this.getPrivatePlanSessionFragmentCollectionByIndex(trainingPlan.id, userId));
    }

    return from(planSessionFragmentCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        // takeUntil(this.deletePlanSessionFragmentTriggered$),
        map(planSessionFragments => {
          if (!planSessionFragments) {
            throw new Error(`Error fetching ${visibilityCategory} planSessionFragments for plan ${trainingPlan.id}`, );
          }
          const planSessionFragmentsWithUpdatedTimestamps = planSessionFragments.map(planSessionFragment => {
            const formattedPlanSessionFragment: PlanSessionFragment = {
              ...planSessionFragment,
              createdTimestamp: (planSessionFragment.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (planSessionFragment.lastModifiedTimestamp as Timestamp).toMillis()

            };
            return formattedPlanSessionFragment;
          });
          console.log(`Fetched all ${planSessionFragmentsWithUpdatedTimestamps.length} ${visibilityCategory} planSessionFragments`);
          return planSessionFragmentsWithUpdatedTimestamps;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error fetching ${visibilityCategory} planSessionFragments for plan ${trainingPlan.id}`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchMultiplePlanSessionFragments(trainingPlan: TrainingPlan, queryParams: FirestoreCollectionQueryParams, userId: string): Observable<PlanSessionFragment[]> {

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

    const visibilityCategory = trainingPlan[TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY];
    const isPublicTrainingPlan = visibilityCategory === TrainingPlanVisibilityCategoryDbOption.PUBLIC;

    let planSessionFragmentCollectionQuery: Query<PlanSessionFragment>;

    if (isPublicTrainingPlan) {
      planSessionFragmentCollectionQuery = query(
        this.getPublicPlanSessionFragmentCollection(trainingPlan.id),
        ...combinedQueryConstraints
      );
    } else {
      planSessionFragmentCollectionQuery = query(
        this.getPrivatePlanSessionFragmentCollection(trainingPlan.id, userId),
        ...combinedQueryConstraints
      );
    }

    const planSessionFragmentCollectionDataRequest = collectionData(planSessionFragmentCollectionQuery);

    return from(planSessionFragmentCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(planSessionFragments => {
          if (!planSessionFragments) {
            throw new Error(`Error fetching ${visibilityCategory} planSessionFragments with query: ${queryParams}`, );
          }
          const planSessionFragmentsWithUpdatedTimestamps = planSessionFragments.map(planSessionFragment => {
            const formattedPlanSessionFragment: PlanSessionFragment = {
              ...planSessionFragment,
              createdTimestamp: (planSessionFragment.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (planSessionFragment.lastModifiedTimestamp as Timestamp).toMillis()
            };
            return formattedPlanSessionFragment;
          });
          console.log(`Fetched all ${planSessionFragmentsWithUpdatedTimestamps.length} ${visibilityCategory} planSessionFragments`);
          return planSessionFragmentsWithUpdatedTimestamps;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error fetching ${visibilityCategory} planSessionFragments with query: ${queryParams}`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchSinglePlanSessionFragment(trainingPlanId: string, planSessionFragmentId: string, userId: string, visibilityCategory: TrainingPlanVisibilityCategoryDbOption): Observable<PlanSessionFragment> {
    const isPublicTrainingPlan = visibilityCategory === TrainingPlanVisibilityCategoryDbOption.PUBLIC;
    let planSessionFragment: Observable<PlanSessionFragment>;

    if (isPublicTrainingPlan) {
      planSessionFragment = docData(this.getPublicPlanSessionFragmentDoc(trainingPlanId, planSessionFragmentId));
    } else {
      planSessionFragment = docData(this.getPrivatePlanSessionFragmentDoc(trainingPlanId, planSessionFragmentId, userId));
    }

    return planSessionFragment
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        takeUntil(this.deletePlanSessionFragmentTriggered$),
        map(planSessionFragment => {
          if (!planSessionFragment) {
            throw new Error(`Error fetching ${visibilityCategory} planSessionFragment with id: ${planSessionFragmentId}`);
          }
          const formattedPlanSessionFragment: PlanSessionFragment = {
            ...planSessionFragment,
            createdTimestamp: (planSessionFragment.createdTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (planSessionFragment.lastModifiedTimestamp as Timestamp).toMillis()
          };
          console.log(`Fetched single ${visibilityCategory} planSessionFragment`, formattedPlanSessionFragment);
          return formattedPlanSessionFragment;
        }),
        shareReplay(),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error fetching ${visibilityCategory} planSessionFragment`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  updatePlanSessionFragment(trainingPlanId: string, planSessionFragmentUpdates: Update<PlanSessionFragment>, userId: string, visibilityCategory: TrainingPlanVisibilityCategoryDbOption): Observable<Update<PlanSessionFragment>> {
    const currentTimeTimestamp: Timestamp = Timestamp.now();
    
    const isPublicTrainingPlan = visibilityCategory === TrainingPlanVisibilityCategoryDbOption.PUBLIC;
    const documentId = planSessionFragmentUpdates.id as string;

    let planSessionFragmentDoc: DocumentReference<PlanSessionFragment>;

    if (isPublicTrainingPlan) {
      planSessionFragmentDoc = this.getPublicPlanSessionFragmentDoc(trainingPlanId, documentId);
    } else {
      planSessionFragmentDoc = this.getPrivatePlanSessionFragmentDoc(trainingPlanId, documentId, userId);
    }

    const changesWithTimestamp: Partial<PlanSessionFragment> = {
      ...planSessionFragmentUpdates.changes,
      lastModifiedTimestamp: currentTimeTimestamp
    };

    const changesWithMs: Update<PlanSessionFragment> = {
      ...planSessionFragmentUpdates,
      changes: {
        ...planSessionFragmentUpdates.changes,
        lastModifiedTimestamp: currentTimeTimestamp.toMillis()
      }
    };

    const planSessionFragmentUpdateRequest = updateDoc(planSessionFragmentDoc, changesWithTimestamp);

    return from(planSessionFragmentUpdateRequest)
      .pipe(
        map(empty => {
          console.log(`Updated ${visibilityCategory} planSessionFragment`, changesWithMs);
          return changesWithMs;  // Use original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log(`Error updating ${visibilityCategory} planSessionFragment`, error);
          return throwError(() => new Error(error));
        })
      );
  }

  // This prevents Firebase from fetching a document after it has been deleted
  triggerDeletePlanSessionFragmentObserver() {
    this.deletePlanSessionFragmentTriggered$.next(); // Send signal to Firebase subscriptions to unsubscribe
    this.deletePlanSessionFragmentTriggered$.complete(); // Send signal to Firebase subscriptions to unsubscribe
    this.deletePlanSessionFragmentTriggered$ = new Subject<void>(); // Reinitialize the unsubscribe subject in case page isn't refreshed after logout (which means auth wouldn't reset)
  }

  private getPublicPlanSessionFragmentCollection(trainingPlanId: string): CollectionReference<PlanSessionFragment> {
    return collection(this.firestore, `${PublicCollectionPaths.PUBLIC_TRAINING_PLANS}/${trainingPlanId}/${PublicCollectionPaths.PLAN_SESSION_FRAGMENTS}`) as CollectionReference<PlanSessionFragment>;
  }

  private getPublicPlanSessionFragmentCollectionByIndex(trainingPlanId: string): Query<PlanSessionFragment> {
    const planSessionFragmentCollectionRef = collection(this.firestore, `${PublicCollectionPaths.PUBLIC_TRAINING_PLANS}/${trainingPlanId}/${PublicCollectionPaths.PLAN_SESSION_FRAGMENTS}`) as CollectionReference<PlanSessionFragment>;
    const collectionRefOrderedByIndex = query(planSessionFragmentCollectionRef, orderBy(PlanSessionFragmentKeys.TRAINING_PLAN_INDEX));
    return collectionRefOrderedByIndex;
  }

  private getPublicPlanSessionFragmentDoc(trainingPlanId: string, planSessionFragmentId: string): DocumentReference<PlanSessionFragment> {
    return doc(this.getPublicPlanSessionFragmentCollection(trainingPlanId), planSessionFragmentId);
  }

  private getPrivatePlanSessionFragmentCollection(trainingPlanId: string, userId: string): CollectionReference<PlanSessionFragment> {
    return collection(this.firestore, `${PublicCollectionPaths.PUBLIC_USERS}/${userId}/${PublicCollectionPaths.PRIVATE_TRAINING_PLANS}/${trainingPlanId}/${PublicCollectionPaths.PLAN_SESSION_FRAGMENTS}`) as CollectionReference<PlanSessionFragment>;
  }

  private getPrivatePlanSessionFragmentCollectionByIndex(trainingPlanId: string, userId: string): Query<PlanSessionFragment> {
    const planSessionFragmentCollectionRef = collection(this.firestore, `${PublicCollectionPaths.PUBLIC_USERS}/${userId}/${PublicCollectionPaths.PRIVATE_TRAINING_PLANS}/${trainingPlanId}/${PublicCollectionPaths.PLAN_SESSION_FRAGMENTS}`) as CollectionReference<PlanSessionFragment>;
    const collectionRefOrderedByIndex = query(planSessionFragmentCollectionRef, orderBy(PlanSessionFragmentKeys.TRAINING_PLAN_INDEX));
    return collectionRefOrderedByIndex;
  }

  private getPrivatePlanSessionFragmentDoc(trainingPlanId: string, planSessionFragmentId: string, userId: string): DocumentReference<PlanSessionFragment> {
    return doc(this.getPrivatePlanSessionFragmentCollection(trainingPlanId, userId), planSessionFragmentId);
  }

  private generateNewPlanSessionFragmentDocumentId(trainingPlanId: string): string {
    return doc(this.getPublicPlanSessionFragmentCollection(trainingPlanId)).id;
  }

}
