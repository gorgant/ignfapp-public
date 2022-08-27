import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, tap, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PlanSessionFragment, ViewPlanSessionFragmentUrlParams } from 'shared-models/train/plan-session-fragment.model';
import { TrainingPlan } from 'shared-models/train/training-plan.model';
import { TrainingSessionDatabaseCategoryTypes } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { PlanSessionFragmentStoreActions, PlanSessionFragmentStoreSelectors, RootStoreState, TrainingPlanStoreActions, TrainingPlanStoreSelectors, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-training-plan',
  templateUrl: './training-plan.component.html',
  styleUrls: ['./training-plan.component.scss']
})
export class TrainingPlanComponent implements OnInit {

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
    private uiService: UiService,
    private router: Router,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.loadTrainingPlanData();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectUserData) as Observable<PublicUser>;
    
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
    this.existingTrainingPlanData$ = this.store$.select(TrainingPlanStoreSelectors.selectTrainingPlanById(trainingPlanId))
      .pipe(
        withLatestFrom(
          this.fetchSingleTrainingPlanProcessing$,
          this.fetchSingleTrainingPlanError$
          ),
        map(([trainingPlan, fetchProcessing, loadError]) => {
          if (loadError) {
            console.log('Error loading trainingPlan in component', loadError);
            this.singleTrainingPlanRequested = false;
          }

          if (!fetchProcessing && !this.singleTrainingPlanRequested) {
            console.log(`trainingPlan ${trainingPlanId} not in store, fetching from database`);
            this.store$.dispatch(TrainingPlanStoreActions.fetchSingleTrainingPlanRequested({trainingPlanId}));
            this.singleTrainingPlanRequested = true;
          }
          return trainingPlan;
        }),
      );

    this.planSessionFragmentData$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsInStore)
      .pipe(
        withLatestFrom(
          this.fetchAllPlanSessionFragmentsProcessing$,
          this.fetchAllPlanSessionFragmentsError$,
          this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsFetched),
        ),
        map(([planSessionFragments, loadingPlanSessionFragments, loadError, allPlanSessionFragmentsFetched]) => {
          if (loadError) {
            console.log('Error loading planSessionFragments in component', loadError);
            this.planSessionFragmentsRequested = false;
          }
  
          // Check if sessions are loaded, if not fetch from server
          if (!loadingPlanSessionFragments && !this.planSessionFragmentsRequested && !allPlanSessionFragmentsFetched) {
            this.store$.dispatch(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsRequested({trainingPlanId}));
            this.planSessionFragmentsRequested = true;
          }
          return planSessionFragments.filter(fragment => fragment.trainingPlanId === trainingPlanId);
        })
      );

    this.combinedTrainingPlanAndPlanSessionFragmentData$ = combineLatest([this.existingTrainingPlanData$, this.planSessionFragmentData$])
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

  onSelectTrainingSession(planSessionFragmentData: PlanSessionFragment) {
    const queryParams: ViewPlanSessionFragmentUrlParams = {
      canonicalId: planSessionFragmentData.canonicalId,
      databaseCategory: TrainingSessionDatabaseCategoryTypes.PLAN_FRAGMENT,
      trainingPlanId: planSessionFragmentData.trainingPlanId
    };
    const navigationExtras = {queryParams};
    this.router.navigate([`${PublicAppRoutes.TRAINING_SESSION}`, planSessionFragmentData.id], navigationExtras);
  }

  onAddTrainingPlanToQueue() {
    // TODO: Add trainingPlan to user personalSessionFragment collection
  }

}
