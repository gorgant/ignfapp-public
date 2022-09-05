import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, take, withLatestFrom, zip } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PlanSessionFragment } from 'shared-models/train/plan-session-fragment.model';
import { TrainingPlan } from 'shared-models/train/training-plan.model';
import { PublicUser } from 'shared-models/user/public-user.model';
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

  existingTrainingPlanData$!: Observable<TrainingPlan | undefined>;
  fetchSingleTrainingPlanProcessing$!: Observable<boolean>;
  fetchSingleTrainingPlanError$!: Observable<{} | null>;
  singleTrainingPlanRequested!: boolean;

  planSessionFragmentData$!: Observable<PlanSessionFragment[]>;
  fetchAllPlanSessionFragmentsProcessing$!: Observable<boolean>;
  fetchAllPlanSessionFragmentsError$!: Observable<{} | null>;
  planSessionFragmentsRequested!: boolean;
  
  combinedTrainingPlanAndPlanSessionFragmentData$!: Observable<{trainingPlan: TrainingPlan | undefined, planSessionFragments: PlanSessionFragment[]}>;

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.loadTrainingPlanData();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;
    
    this.fetchSingleTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanProcessing);
    this.fetchSingleTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanError);

    this.fetchAllPlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsProcessing);
    this.fetchAllPlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsError);
  }

  private getSessionIdFromParams(): string {
    const idParamName = 'id';
    const trainingPlanId = this.route.snapshot.params[idParamName];
    return trainingPlanId;
  }

  private loadTrainingPlanData() {
    const trainingPlanId = this.getSessionIdFromParams();
    this.existingTrainingPlanData$ = this.fetchSingleTrainingPlanProcessing$
      .pipe(
        withLatestFrom(
          this.store$.select(TrainingPlanStoreSelectors.selectTrainingPlanById(trainingPlanId)),
          this.fetchSingleTrainingPlanError$
        ),
        map(([fetchProcessing, trainingPlan, loadError]) => {
          if (loadError) {
            console.log('Error loading trainingPlan in component', loadError);
            this.singleTrainingPlanRequested = false;
            this.onNavigateUserToBrowse();
          }

          if (!fetchProcessing && !this.singleTrainingPlanRequested && !loadError) {
            console.log(`trainingPlan ${trainingPlanId} not in store, fetching from database`);
            this.store$.dispatch(TrainingPlanStoreActions.fetchSingleTrainingPlanRequested({trainingPlanId}));
            this.singleTrainingPlanRequested = true;
          }
          return trainingPlan;
        }),
      );

    this.planSessionFragmentData$ = this.fetchAllPlanSessionFragmentsProcessing$
      .pipe(
        withLatestFrom(
          this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsInStore),
          this.fetchAllPlanSessionFragmentsError$,
          this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsFetched),
          this.fetchSingleTrainingPlanError$
        ),
        map(([loadingPlanSessionFragments, planSessionFragments, loadError, allPlanSessionFragmentsFetched, trainingPlanLoadError]) => {
          if (loadError) {
            console.log('Error loading planSessionFragments in component', loadError);
            this.planSessionFragmentsRequested = false;
            this.onNavigateUserToBrowse();
          }

          if (trainingPlanLoadError) {
            console.log('Upstream error loading trainingPlan', loadError);
            this.store$.dispatch(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsFailed({error: { name: 'upstream error', message: 'failed to load planSessionFragments due to trainingPlan load error', code: 'internal'}}));
            this.planSessionFragmentsRequested = false;
            this.onNavigateUserToBrowse();
          }
  
          // Check if sessions are loaded, if not fetch from server
          if (!loadingPlanSessionFragments && !this.planSessionFragmentsRequested && !allPlanSessionFragmentsFetched && !(trainingPlanLoadError || loadError)) {
            this.store$.dispatch(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsRequested({trainingPlanId}));
            this.planSessionFragmentsRequested = true;
          }
          return planSessionFragments.filter(fragment => fragment.trainingPlanId === trainingPlanId);
        })
      );

    this.combinedTrainingPlanAndPlanSessionFragmentData$ = zip([this.existingTrainingPlanData$, this.planSessionFragmentData$])
      .pipe(
        map(([trainingPlan, planSessionFragments]) => {
          console.log('Combined data subscription firing with these values', trainingPlan, planSessionFragments);
          return {
            trainingPlan,
            planSessionFragments
          }
        })
      )
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
    // If error exists, clear the errors before destroying components
    this.fetchSingleTrainingPlanError$
      .pipe(
        withLatestFrom(this.fetchAllPlanSessionFragmentsError$),
        take(1))
      .subscribe(([fetchSingleTrainingPlanError, fetchAllPlanSessionFragmentsError]) => {
        if (fetchSingleTrainingPlanError) {
          this.store$.dispatch(TrainingPlanStoreActions.purgeTrainingPlanData());
        }
        if (fetchAllPlanSessionFragmentsError) {
          this.store$.dispatch(PlanSessionFragmentStoreActions.purgePlanSessionFragmentData());
        }
      });
  }

}
