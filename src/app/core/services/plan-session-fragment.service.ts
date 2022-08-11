import { Injectable } from '@angular/core';
import { collection, setDoc, doc, docData, DocumentReference, CollectionReference, Firestore, deleteDoc, collectionData, query, where, limit, QueryConstraint, updateDoc } from '@angular/fire/firestore';
import { Update } from '@ngrx/entity';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { PlanSessionFragment, PlanSessionFragmentNoIdOrTimestamp } from 'shared-models/train/plan-session-fragment.model';
import { UiService } from './ui.service';
import { PublicCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionQueryParams } from 'shared-models/firestore/fs-collection-query-params.model';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class PlanSessionFragmentService {

  constructor(
    private afs: Firestore,
    private authService: AuthService,
    private uiService: UiService,
  ) { }

  createPlanSessionFragment(trainingPlanId: string, planSessionFragmentNoIdOrTimestamp: PlanSessionFragmentNoIdOrTimestamp): Observable<PlanSessionFragment> {
    const currentTimeTimestamp: Timestamp = Timestamp.now();

    const newId = this.generateNewPlanSessionFragmentDocumentId(trainingPlanId);

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

    const planSessionFragmentDocRef = this.getPlanSessionFragmentDoc(trainingPlanId, newId);
    const planSessionFragmentAddRequest = setDoc(planSessionFragmentDocRef, planSessionFragmentWithIdAndTimestamps);

    return from(planSessionFragmentAddRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(empty => {
          console.log('Created new planSessionFragment', planSessionFragmentWithIdAndMs);
          return planSessionFragmentWithIdAndMs; // Use new version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error creating planSessionFragment', error);
          return throwError(() => new Error(error));
        })
      );
  }

  deletePlanSessionFragment(trainingPlanId: string, planSessionFragmentId: string): Observable<string> {
    const planSessionFragmentDeleteRequest = deleteDoc(this.getPlanSessionFragmentDoc(trainingPlanId, planSessionFragmentId));

    return from(planSessionFragmentDeleteRequest)
      .pipe(
        map(empty => {
          console.log('Deleted planSessionFragment', planSessionFragmentId);
          return planSessionFragmentId;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error deleting planSessionFragment', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchAllPlanSessionFragments(trainingPlanId: string): Observable<PlanSessionFragment[]> {

    const planSessionFragmentCollectionDataRequest = collectionData(this.getPlanSessionFragmentCollection(trainingPlanId));

    return from(planSessionFragmentCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(planSessionFragments => {
          if (!planSessionFragments) {
            throw new Error(`Error fetching all planSessionFragments`, );
          }
          const planSessionFragmentsWithUpdatedTimestamps = planSessionFragments.map(planSessionFragment => {
            const formattedPlanSessionFragment: PlanSessionFragment = {
              ...planSessionFragment,
              createdTimestamp: (planSessionFragment.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (planSessionFragment.lastModifiedTimestamp as Timestamp).toMillis()

            };
            return formattedPlanSessionFragment;
          });
          console.log(`Fetched all ${planSessionFragmentsWithUpdatedTimestamps.length} planSessionFragments`);
          return planSessionFragmentsWithUpdatedTimestamps;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching planSessionFragments', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchMultiplePlanSessionFragments(trainingPlanId: string, queryParams: FirestoreCollectionQueryParams): Observable<PlanSessionFragment[]> {

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
    
    const planSessionFragmentCollectionQuery = query(
      this.getPlanSessionFragmentCollection(trainingPlanId),
      ...combinedQueryConstraints
    );

    const planSessionFragmentCollectionDataRequest = collectionData(planSessionFragmentCollectionQuery);

    return from(planSessionFragmentCollectionDataRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(planSessionFragments => {
          if (!planSessionFragments) {
            throw new Error(`Error fetching planSessionFragments with query: ${queryParams}`, );
          }
          const planSessionFragmentsWithUpdatedTimestamps = planSessionFragments.map(planSessionFragment => {
            const formattedPlanSessionFragment: PlanSessionFragment = {
              ...planSessionFragment,
              createdTimestamp: (planSessionFragment.createdTimestamp as Timestamp).toMillis(),
              lastModifiedTimestamp: (planSessionFragment.lastModifiedTimestamp as Timestamp).toMillis()
            };
            return formattedPlanSessionFragment;
          });
          console.log(`Fetched all ${planSessionFragmentsWithUpdatedTimestamps.length} planSessionFragments`);
          return planSessionFragmentsWithUpdatedTimestamps;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching planSessionFragments', error);
          return throwError(() => new Error(error));
        })
      );
  }

  fetchSinglePlanSessionFragment(trainingPlanId: string, planSessionFragmentId: string): Observable<PlanSessionFragment> {
    const planSessionFragment = docData(this.getPlanSessionFragmentDoc(trainingPlanId, planSessionFragmentId));
    return planSessionFragment
      .pipe(
        // If logged out, this triggers unsub of this observable
        takeUntil(this.authService.unsubTrigger$),
        map(planSessionFragment => {
          if (!planSessionFragment) {
            throw new Error(`Error fetching planSessionFragment with id: ${planSessionFragmentId}`);
          }
          const formattedPlanSessionFragment: PlanSessionFragment = {
            ...planSessionFragment,
            createdTimestamp: (planSessionFragment.createdTimestamp as Timestamp).toMillis(),
            lastModifiedTimestamp: (planSessionFragment.lastModifiedTimestamp as Timestamp).toMillis()
          };
          console.log(`Fetched single planSessionFragment`, formattedPlanSessionFragment);
          return formattedPlanSessionFragment;
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error fetching planSessionFragment', error);
          return throwError(() => new Error(error));
        })
      );
  }

  updatePlanSessionFragment(trainingPlanId: string, planSessionFragmentUpdates: Update<PlanSessionFragment>): Observable<Update<PlanSessionFragment>> {
    const changesWithTimestamp: Partial<PlanSessionFragment> = {
      ...planSessionFragmentUpdates.changes,
      lastModifiedTimestamp: Timestamp.now()
    }

    const planSessionFragmentUpdatesWithTimestamp: Update<PlanSessionFragment> = {
      ...planSessionFragmentUpdates,
      changes: changesWithTimestamp
    }
    const planSessionFragmentDoc = this.getPlanSessionFragmentDoc(trainingPlanId, planSessionFragmentUpdatesWithTimestamp.id as string);
    const planSessionFragmentUpdateRequest = updateDoc(planSessionFragmentDoc, changesWithTimestamp);

    return from(planSessionFragmentUpdateRequest)
      .pipe(
        // If logged out, this triggers unsub of this observable
        map(docRef => {
          console.log('Updated planSessionFragment', planSessionFragmentUpdates);
          return planSessionFragmentUpdates;  // Use original version with MS timestamps
        }),
        catchError(error => {
          this.uiService.showSnackBar(error.message, 10000);
          console.log('Error creating planSessionFragment', error);
          return throwError(() => new Error(error));
        })
      );
  }

  private getPlanSessionFragmentCollection(trainingPlanId: string): CollectionReference<PlanSessionFragment> {
    // Note that planSessionFragment is nested in Public User document
    return collection(this.afs, `${PublicCollectionPaths.TRAINING_PLANS}/${trainingPlanId}/${PublicCollectionPaths.PLAN_SESSION_FRAGMENTS}`) as CollectionReference<PlanSessionFragment>;
  }

  private getPlanSessionFragmentDoc(trainingPlanId: string, planSessionFragmentId: string): DocumentReference<PlanSessionFragment> {
    return doc(this.getPlanSessionFragmentCollection(trainingPlanId), planSessionFragmentId);
  }

  private generateNewPlanSessionFragmentDocumentId(trainingPlanId: string): string {
    return doc(this.getPlanSessionFragmentCollection(trainingPlanId)).id;
  }

}
