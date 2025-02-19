import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, combineLatest, filter, map, Observable, of, Subscription, switchMap, take, tap, throwError, withLatestFrom, zip } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PlanSessionFragment } from 'shared-models/train/plan-session-fragment.model';
import { AddTrainingSessionToPlanQueryParams, AddTrainingSessionToPlanQueryParamsKeys, TrainingPlan, TrainingPlanKeys, TrainingPlanVisibilityCategoryDbOption, ViewTrainingPlanQueryParams, ViewTrainingPlanQueryParamsKeys } from 'shared-models/train/training-plan.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { PlanSessionFragmentStoreActions, PlanSessionFragmentStoreSelectors, RootStoreState, TrainingPlanStoreActions, TrainingPlanStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AddTrainingPlanToPersonalQueueComponent } from 'src/app/shared/components/add-training-plan-to-personal-queue/add-training-plan-to-personal-queue.component';
import { ProcessingSpinnerComponent } from 'src/app/shared/components/processing-spinner/processing-spinner.component';
import { TrainingSessionCardComponent } from 'src/app/shared/components/training-session-card/training-session-card.component';

@Component({
    selector: 'app-training-plan',
    templateUrl: './training-plan.component.html',
    styleUrls: ['./training-plan.component.scss'],
    imports: [MatButtonModule, MatIconModule, AddTrainingPlanToPersonalQueueComponent, TrainingSessionCardComponent, ProcessingSpinnerComponent, AsyncPipe]
})
export class TrainingPlanComponent implements OnInit, OnDestroy {
  
  ADD_A_TRAINING_SESSION_BUTTON_VALUE = GlobalFieldValues.ADD_SESSION_TO_PLAN;
  ADD_TO_MY_QUEUE_BUTTON_VALUE = GlobalFieldValues.ADD_TO_MY_QUEUE;
  NO_TRAINING_SESSIONS_FOUND_BLURB = GlobalFieldValues.NO_TRAINING_SESSIONS;
  TRAINING_SESSIONS_TEXT = GlobalFieldValues.TRAINING_SESSIONS;

  userData$!: Observable<PublicUser>;

  $localTrainingPlan = signal(undefined as TrainingPlan | undefined);
  $localTrainingPlanId = signal(undefined as string | undefined);
  private fetchSingleTrainingPlanProcessing$!: Observable<boolean>;
  private fetchSingleTrainingPlanError$!: Observable<{} | null>;
  private $fetchSingleTrainingPlanSubmitted = signal(false);

  private allPlanSessionFragmentsInStore$!: Observable<PlanSessionFragment[]>;
  $localPlanSessionFragments = signal(undefined as PlanSessionFragment[] | undefined);
  private fetchAllPlanSessionFragmentsProcessing$!: Observable<boolean>;
  private fetchAllPlanSessionFragmentsError$!: Observable<{} | null>;
  private planSessionFragmentsFetched$!: Observable<boolean>;
  private $fetchPlanSessionFragmentsSubmitted = signal(false);
  private $planSessionFragmentsFetched = signal(false);

  private $trainingPlanVisibilityCategory = signal(undefined as TrainingPlanVisibilityCategoryDbOption | undefined);

  combinedTrainingDataSubscription!: Subscription;
  fetchCombinedTrainingDataError$!: Observable<boolean>;
  fetchCombinedTrainingDataProcessing$!: Observable<boolean>;

  private store$ = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private uiService = inject(UiService);

  constructor() { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.setTrainingPlanData();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;
    
    this.fetchSingleTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanError);
    this.fetchSingleTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanProcessing);
    
    this.allPlanSessionFragmentsInStore$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsInStore);
    this.fetchAllPlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsError);
    this.fetchAllPlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsProcessing);

    this.fetchCombinedTrainingDataProcessing$ = combineLatest(
      [
        this.fetchSingleTrainingPlanProcessing$,
        this.fetchAllPlanSessionFragmentsProcessing$
      ]
    ).pipe(
        map(([fetchTrainingPlanProcessing, fetchPlanSessionFragmentsProcessing]) => {
          if (fetchTrainingPlanProcessing || fetchPlanSessionFragmentsProcessing) {
            return true;
          }
          return false;
        })
      );

    this.fetchCombinedTrainingDataError$ = combineLatest(
      [
        this.fetchSingleTrainingPlanError$,
        this.fetchAllPlanSessionFragmentsError$
      ]
    ).pipe(
        map(([fetchTrainingPlanError, fetchPlanSessionFragmentsError]) => {
          if (fetchTrainingPlanError || fetchPlanSessionFragmentsError) {
            return true;
          }
          return false;
        })
      );
  }

  private setTrainingPlanId() {
    const trainingPlanId = this.route.snapshot.params[TrainingPlanKeys.ID] as string | undefined;
    if (trainingPlanId) {
      this.$localTrainingPlanId.set(trainingPlanId);
    }
  }

  private setTrainingPlanVisibilityCategory(): void {
    const visibilityCategory = this.route.snapshot.queryParamMap.get(TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY) as TrainingPlanVisibilityCategoryDbOption | undefined;
    this.$trainingPlanVisibilityCategory.set(visibilityCategory);
  }

  private setTrainingPlanData() {
    this.setTrainingPlanVisibilityCategory();
    this.setTrainingPlanId();
    const trainingPlanId = this.$localTrainingPlanId() as string;
    const singleTrainingPlan$ = this.store$.select(TrainingPlanStoreSelectors.selectTrainingPlanById(trainingPlanId));

    this.combinedTrainingDataSubscription = this.fetchCombinedTrainingDataError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetComponentState();
            this.onNavigateUserToBrowse();
          }
          return singleTrainingPlan$;
        }),
        withLatestFrom(this.fetchSingleTrainingPlanError$, this.userData$),
        filter(([trainingPlan, processingError, userData]) => !processingError),
        map(([trainingPlan, processingError, userData]) => {
          if (!trainingPlan && !this.$fetchSingleTrainingPlanSubmitted()) {
            this.$fetchSingleTrainingPlanSubmitted.set(true);
            console.log(`trainingPlan ${trainingPlanId} not in store, fetching from database`);
            this.store$.dispatch(TrainingPlanStoreActions.fetchSingleTrainingPlanRequested({
              trainingPlanId,
              userId: userData!.id,
              visibilityCategory: this.$trainingPlanVisibilityCategory()!
            }));
          }
          return trainingPlan;
        }),
        filter(trainingPlan => !!trainingPlan),
        switchMap(trainingPlan => {
          // Only update the local trainingPlan array if there are updates to the trainingPlan
          if (this.$localTrainingPlan() !== trainingPlan) {
            this.$localTrainingPlan.set(trainingPlan!); // Load the current trainingPlan into the instance variable
            console.log('Set currentTrainingPlan', this.$localTrainingPlan());
          }
          if (trainingPlan?.trainingSessionCount === 0) {
            console.log('No trainingSessions in trainingPlan, setting to planSessionFragments to empty array');
            this.$localPlanSessionFragments.set([]);
          }
          // Need to combine both observables in order to push new batch of planSessionFragments into store
          return combineLatest([singleTrainingPlan$, this.allPlanSessionFragmentsInStore$]);
        }), 
        filter(([trainingPlan, planSessionFragments]) => trainingPlan!.trainingSessionCount > 0), // Only fetch planSessionFragments if they exist in plan
        withLatestFrom(this.userData$),
        switchMap(([[trainingPlan, planSessionFragments], userData]) => {
          // Determine if data has been fetched by checking if the legnth of the array matches the trainingPlan's count
          const filteredPlanSessionFragments = planSessionFragments.filter(fragment => fragment.trainingPlanId === trainingPlanId);
          const dataAlreadyInStore = filteredPlanSessionFragments.length === trainingPlan?.trainingSessionCount;
          this.$planSessionFragmentsFetched.set(dataAlreadyInStore);
          console.log('Data already in store', this.$planSessionFragmentsFetched());
          if (this.$planSessionFragmentsFetched()) {
            console.log('Fragments already in store, will not fetch');
          }
          if (!this.$planSessionFragmentsFetched() && !this.$fetchPlanSessionFragmentsSubmitted()) {
            this.$fetchPlanSessionFragmentsSubmitted.set(true);
            console.log('planSessionFragments not in store, fetching from database');
            this.store$.dispatch(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsRequested({trainingPlan: trainingPlan!, userId: userData.id}));
          }
          return this.allPlanSessionFragmentsInStore$
        }),
        filter((planSessionFragments: PlanSessionFragment[]) => this.$planSessionFragmentsFetched()),
        tap((planSessionFragments: PlanSessionFragment[]) => {
          const filteredData = planSessionFragments.filter(fragment => fragment.trainingPlanId === trainingPlanId); // Ensure only fragments from this plan are loaded (entityadapter could have other plans if already loaded)
          this.$localPlanSessionFragments.set(filteredData) // Load the planSessionFragments into the instance variable
          console.log('Set planSessionFragments', this.$localPlanSessionFragments());
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetComponentState();
          this.onNavigateUserToBrowse();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetComponentState() {
    this.combinedTrainingDataSubscription?.unsubscribe();
    this.$fetchSingleTrainingPlanSubmitted.set(false);
    this.$planSessionFragmentsFetched.set(false);
    this.store$.dispatch(TrainingPlanStoreActions.purgeTrainingPlanErrors());
    this.store$.dispatch(PlanSessionFragmentStoreActions.purgePlanSessionFragmentErrors());
  }

  onNavigateUserToBrowse(): void {
    this.router.navigate([PublicAppRoutes.BROWSE]);
  }

  onEditTrainingPlan(): void {
    const queryParams: ViewTrainingPlanQueryParams = {
      [ViewTrainingPlanQueryParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: this.$trainingPlanVisibilityCategory()!, // Ensures the user views training sessions vs plans
    };
    const navigationExtras: NavigationExtras = {queryParams};
    this.router.navigate([PublicAppRoutes.BUILD_EDIT_TRAINING_PLAN, this.$localTrainingPlanId()], navigationExtras);
  }

  onAddTrainingSession() {
    const queryParams: AddTrainingSessionToPlanQueryParams = {
      [AddTrainingSessionToPlanQueryParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: true,
      [AddTrainingSessionToPlanQueryParamsKeys.TRAINING_PLAN_ID]: this.$localTrainingPlanId()!,
      [AddTrainingSessionToPlanQueryParamsKeys.VIEW_TRAINING_SESSIONS]: true,
      [AddTrainingSessionToPlanQueryParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: this.$trainingPlanVisibilityCategory()!
    };
    const navigationExtras: NavigationExtras = {
      queryParams
    };
    this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
  }

  ngOnDestroy(): void {
    this.combinedTrainingDataSubscription?.unsubscribe();
  }

}
