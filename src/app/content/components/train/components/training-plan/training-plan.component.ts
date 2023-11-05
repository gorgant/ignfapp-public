import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, combineLatest, filter, map, Observable, of, Subscription, switchMap, take, tap, throwError, withLatestFrom, zip } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PlanSessionFragment } from 'shared-models/train/plan-session-fragment.model';
import { TrainingPlan, TrainingPlanKeys } from 'shared-models/train/training-plan.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { PlanSessionFragmentStoreActions, PlanSessionFragmentStoreSelectors, RootStoreState, TrainingPlanStoreActions, TrainingPlanStoreSelectors, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-training-plan',
  templateUrl: './training-plan.component.html',
  styleUrls: ['./training-plan.component.scss']
})
export class TrainingPlanComponent implements OnInit, OnDestroy {

  TRAINING_SESSIONS_TEXT = GlobalFieldValues.TRAINING_SESSIONS;
  ADD_TO_MY_QUEUE_BUTTON_VALUE = GlobalFieldValues.ADD_TO_MY_QUEUE;

  trainingSessionCardHeight = 300;

  userData$!: Observable<PublicUser>;

  $currentTrainingPlan = signal(undefined as TrainingPlan | undefined);
  $currentTrainingPlanId = signal(undefined as string | undefined);
  private fetchSingleTrainingPlanProcessing$!: Observable<boolean>;
  private fetchSingleTrainingPlanError$!: Observable<{} | null>;
  private $singleTrainingPlanRequested = signal(false);

  allPlanSessionFragmentsFetched$!: Observable<boolean>;
  allPlanSessionFragmentsInStore$!: Observable<PlanSessionFragment[]>;
  $currentPlanSessionFragments = signal(undefined as PlanSessionFragment[] | undefined);
  private fetchAllPlanSessionFragmentsProcessing$!: Observable<boolean>;
  private fetchAllPlanSessionFragmentsError$!: Observable<{} | null>;
  private $planSessionFragmentsRequested = signal(false);
  private planSessionFragmentsFetched$!: Observable<boolean>;

  combinedTrainingDataSubscription!: Subscription;
  fetchCombinedTrainingDataError$!: Observable<boolean>;

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
    
    this.allPlanSessionFragmentsFetched$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsFetched); // We use this to determine if the initial empty array returned when the store is fetched is a pre-loaded state or the actual state
    this.allPlanSessionFragmentsInStore$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsInStore);
    this.fetchAllPlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsError);
    this.fetchAllPlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsProcessing);

    this.fetchCombinedTrainingDataError$ = combineLatest(
      [
        this.fetchSingleTrainingPlanError$,
        this.fetchAllPlanSessionFragmentsError$
      ]
    ).pipe(
        map(([fetchPlanError, fetchSessionsError]) => {
          if (fetchPlanError || fetchSessionsError) {
            return true;
          }
          return false;
        })
      );
  }


  private setTrainingPlanId() {
    const trainingPlanId = this.route.snapshot.params[TrainingPlanKeys.ID] as string | undefined;
    if (trainingPlanId) {
      this.$currentTrainingPlanId.set(trainingPlanId);
    }
  }

  private setTrainingPlanData() {
    this.setTrainingPlanId();
    const trainingPlanId = this.$currentTrainingPlanId() as string;
    this.combinedTrainingDataSubscription = this.fetchCombinedTrainingDataError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.onNavigateUserToBrowse();
          }
          const singleTrainingPlan$ = this.store$.select(TrainingPlanStoreSelectors.selectTrainingPlanById(trainingPlanId));
          return singleTrainingPlan$;
        }),
        withLatestFrom(this.fetchSingleTrainingPlanError$),
        filter(([trainingPlan, processingError]) => !processingError),
        map(([trainingPlan, processingError]) => {
          if (!trainingPlan && !this.$singleTrainingPlanRequested()) {
            this.$singleTrainingPlanRequested.set(true);
            console.log(`trainingPlan ${trainingPlanId} not in store, fetching from database`);
            this.store$.dispatch(TrainingPlanStoreActions.fetchSingleTrainingPlanRequested({trainingPlanId}));
          }
          return trainingPlan;
        }),
        filter(trainingPlan => !!trainingPlan),
        map(trainingPlan => {
          if (!this.$currentTrainingPlan()) {
            this.$currentTrainingPlan.set(trainingPlan!); // Load the current trainingPlan into the instance variable
            console.log('Set currentTrainingPlan', this.$currentTrainingPlan());
          }
          if (trainingPlan?.trainingSessionCount === 0) {
            console.log('No trainingSessions in trainingPlan, setting to planSessionFragments to empty array');
            this.$currentPlanSessionFragments.set([]);
          }
          return trainingPlan;
        }), 
        withLatestFrom(this.allPlanSessionFragmentsFetched$),
        filter(([trainingPlan, allFetched]) => trainingPlan!.trainingSessionCount > 0), // Only fetch planSessionFragments if they exist in plan
        switchMap(([trainingPlan, allFetched]) => {
          if (!allFetched && !this.$planSessionFragmentsRequested()) {
            this.$planSessionFragmentsRequested.set(true);
            console.log('planSessionFragments not in store, fetching from database');
            this.store$.dispatch(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsRequested({trainingPlanId}));
          }
          return this.allPlanSessionFragmentsInStore$;
        }),
        map((planSessionFragments: PlanSessionFragment[]) => {
          return planSessionFragments.filter(fragment => fragment.trainingPlanId === trainingPlanId);
        }),
        filter((planSessionFragments: PlanSessionFragment[]) => planSessionFragments.length > 0), // Prevents initial load of empty array
        tap((filteredFragments: PlanSessionFragment[]) => {
          this.$currentPlanSessionFragments.set(filteredFragments) // Load the planSessionFragments into the instance variable
          console.log('Set planSessionFragments', this.$currentPlanSessionFragments());
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.onNavigateUserToBrowse();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  onNavigateUserToBrowse(): void {
    this.router.navigate([PublicAppRoutes.BROWSE]);
  }

  onEditTrainingPlan(trainingPlan: TrainingPlan | undefined): void {
    if (trainingPlan) {
      this.router.navigate([PublicAppRoutes.TRAINING_PLAN_EDIT, trainingPlan.id]);
    }
  }

  onAddTrainingPlanToQueue() {
    // TODO: Add trainingPlan to user personalSessionFragment collection
  }

  ngOnDestroy(): void {
    this.combinedTrainingDataSubscription?.unsubscribe();

    // If fetch error exists, clear the errors before destroying components so that it doesn't interfere with other components
    combineLatest([this.fetchSingleTrainingPlanError$, this.fetchAllPlanSessionFragmentsError$])
      .pipe(
        take(1),
        tap(([fetchSingleTrainingPlanError, fetchAllPlanSessionFragmentsError]) => {
          if (fetchSingleTrainingPlanError) {
            this.store$.dispatch(TrainingPlanStoreActions.purgeTrainingPlanData());
          }
          if (fetchAllPlanSessionFragmentsError) {
            this.store$.dispatch(PlanSessionFragmentStoreActions.purgePlanSessionFragmentData());
          }
        })
      ).subscribe();
  }

}
