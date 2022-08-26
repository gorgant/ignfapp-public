import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription, withLatestFrom, map } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { ViewPersonalSessionFragmentUrlParams } from 'shared-models/train/personal-session-fragment.model';
import { PlanSessionFragment, PlanSessionFragmentKeys, PlanSessionFragmentNoIdOrTimestamp, ViewPlanSessionFragmentUrlParams } from 'shared-models/train/plan-session-fragment.model';
import { AddTrainingSessionUrlParams, AddTrainingPlanUrlParamsKeys, TrainingPlan } from 'shared-models/train/training-plan.model';
import { TrainingSession, TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps } from 'shared-models/train/training-session.model';
import { UiService } from 'src/app/core/services/ui.service';
import { PlanSessionFragmentStoreActions, PlanSessionFragmentStoreSelectors, RootStoreState, TrainingPlanStoreActions, TrainingPlanStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-add-training-session-to-plan-button',
  templateUrl: './add-training-session-to-plan-button.component.html',
  styleUrls: ['./add-training-session-to-plan-button.component.scss']
})
export class AddTrainingSessionToPlanButtonComponent implements OnInit, OnDestroy {

  @Input() trainingSessionData!: TrainingSession;

  ADD_TRAINING_SESSION_TO_PLAN_BUTTON_VALUE = GlobalFieldValues.ADD_TO_PLAN;

  trainingPlanBuilderRequest!: boolean;
  createPlanSessionFragmentProcessing$!: Observable<boolean>;
  createPlanSessionFragmentError$!: Observable<{} | null>;
  createPlanSessionFragmentSubmitted!: boolean;
  createPlanSessionFragmentSubscription!: Subscription;

  fetchAllPlanSessionFragmentsProcessing$!: Observable<boolean>;
  fetchAllPlanSessionFragmentsError$!: Observable<{} | null>;
  planSessionFragmentsLoaded!: boolean;
  planSessionFragmentData$!: Observable<PlanSessionFragment[]>;

  fetchSingleTrainingPlanProcessing$!: Observable<boolean>;
  fetchSingleTrainingPlanError$!: Observable<{} | null>;
  trainingPlanLoaded!: boolean;
  trainingPlanData$!: Observable<TrainingPlan | undefined>;

  updateTrainingPlanProcessing$!: Observable<boolean>;
  updateTrainingPlanError$!: Observable<{} | null>;
  updateTrainingPlanSubmitted!: boolean;
  updateTrainingPlanSubscription!: Subscription;


  serverRequestProcessing!: Observable<boolean>;
  activeCard!: boolean; // Prevents all buttons from showing the processing spinner when server request processing, instead only the one that's clicked

  addTrainingSessionSubscription!: Subscription;

  databaseCategoryType!: TrainingSessionDatabaseCategoryTypes;
  planSessionFragmentQueryParams: ViewPlanSessionFragmentUrlParams | undefined;
  personalSessionFragmentQueryParams: ViewPersonalSessionFragmentUrlParams | undefined;

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private route: ActivatedRoute,
    private router: Router,
    private uiService: UiService
  ) { }

  ngOnInit(): void {
    this.checkForAdditionalViewSessionData();
    this.monitorProcesses();
  }

  private monitorProcesses() {

    this.fetchAllPlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsProcessing);
    this.fetchAllPlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchMultiplePlanSessionFragmentsError);

    this.createPlanSessionFragmentProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectCreatePlanSessionFragmentProcessing);
    this.createPlanSessionFragmentError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectCreatePlanSessionFragmentError);

    this.fetchSingleTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanProcessing);
    this.fetchSingleTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanError);

    this.updateTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectUpdateTrainingPlanProcessing);
    this.updateTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectUpdateTrainingPlanError);

    this.serverRequestProcessing = combineLatest(
      [
        this.createPlanSessionFragmentProcessing$,
        this.fetchSingleTrainingPlanProcessing$,
        this.updateTrainingPlanProcessing$,
      ]
    ).pipe(
        map(([creatingPlanSessionFragment, fetchSingleTrainingPlanProcessing, updateTrainingPlanProcessing]) => {
          if (creatingPlanSessionFragment || fetchSingleTrainingPlanProcessing || updateTrainingPlanProcessing) {
            return true
          }
          return false
        })
    );

  }

  // Pulls data from params if source is a planSessionFragment or personalSessionFragment
  private checkForAdditionalViewSessionData() {
    const databaseCategoryType = this.route.snapshot.queryParamMap.get(TrainingSessionKeys.DATABASE_CATEGORY);
    if (databaseCategoryType) {
      console.log('Alternate database category detected');
      this.databaseCategoryType = databaseCategoryType as TrainingSessionDatabaseCategoryTypes;
      if (databaseCategoryType === TrainingSessionDatabaseCategoryTypes.PLAN_FRAGMENT) {
        this.planSessionFragmentQueryParams = this.route.snapshot.queryParams as ViewPlanSessionFragmentUrlParams;
      }
      if (databaseCategoryType === TrainingSessionDatabaseCategoryTypes.PERSONAL_FRAGMENT) {
        this.personalSessionFragmentQueryParams = this.route.snapshot.queryParams as ViewPersonalSessionFragmentUrlParams;
      }
    }
  }

  private monitorAllPlanSessionFragments(trainingPlanId: string) {
    this.planSessionFragmentData$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsInStore)
      .pipe(
        withLatestFrom(
          this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsProcessing),
          this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsError),
          this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsFetched),
        ),
        map(([planSessionFragments, loadingPlanSessionFragments, loadError, allPlanSessionFragmentsFetched]) => {
          console.log('planSessionFragment subscription fired with this value', planSessionFragments);
          if (loadError) {
            console.log('Error loading planSessionFragments in component', loadError);
            this.planSessionFragmentsLoaded = false;
          }
  
          // Check if sessions are loaded, if not fetch from server
          if (!loadingPlanSessionFragments && !this.planSessionFragmentsLoaded && !allPlanSessionFragmentsFetched) {
            this.store$.dispatch(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsRequested({trainingPlanId}));
            this.planSessionFragmentsLoaded = true;
          }
          return planSessionFragments.filter(fragment => fragment.trainingPlanId === trainingPlanId);
        }),
      )
  }

  private monitorSingleTrainingPlan(trainingPlanId: string) {
    this.trainingPlanData$ = this.store$.select(TrainingPlanStoreSelectors.selectTrainingPlanById(trainingPlanId))
      .pipe(
        withLatestFrom(
          this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanProcessing),
          this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanError),
        ),
        map(([trainingPlan, loadingTrainingPlans, loadError]) => {
          console.log('trainingPlan subscription fired with this value', trainingPlan);
          if (loadError) {
            console.log('Error loading trainingPlan in component', loadError);
            this.trainingPlanLoaded = false;
          }
  
          // Check if sessions are loaded, if not fetch from server
          if (!loadingTrainingPlans && !this.trainingPlanLoaded) {
            this.store$.dispatch(TrainingPlanStoreActions.fetchSingleTrainingPlanRequested({trainingPlanId}));
            this.trainingPlanLoaded = true;
          }
          
          return trainingPlan;
        })
      )
  }

  // Gather planSessionFragment collection and trainingPlan and then use that create a planSessionFragment
  onAddTrainingSessionToPlan() {
    
    const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_ID) as string;

    this.monitorAllPlanSessionFragments(trainingPlanId);

    this.monitorSingleTrainingPlan(trainingPlanId);

    const trainingSessionToModify: any = {...this.trainingSessionData};

    delete trainingSessionToModify.id;

    const trainingSessionNoId = trainingSessionToModify as TrainingSessionNoIdOrTimestamps;

    this.addTrainingSessionSubscription = combineLatest([this.planSessionFragmentData$, this.trainingPlanData$])
      .subscribe(([planSessionFragments, trainingPlan]) => {
        console.log('addTrainingSessionSubscription fired with these values', planSessionFragments, trainingPlan);
        if (planSessionFragments && trainingPlan && !this.createPlanSessionFragmentSubmitted) {
          const indexOfFinalItem = planSessionFragments.length - 1;
          const planSessionFragmentNoId: PlanSessionFragmentNoIdOrTimestamp = {
            ...trainingSessionNoId,
            [PlanSessionFragmentKeys.CANONICAL_ID]: this.trainingSessionData.id,
            [TrainingSessionKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.PLAN_FRAGMENT,
            [PlanSessionFragmentKeys.TRAINING_PLAN_ID]: trainingPlanId,
            [PlanSessionFragmentKeys.TRAINING_PLAN_INDEX]: indexOfFinalItem + 1,
            [PlanSessionFragmentKeys.TRAINING_PLAN_OWNER_ID]: trainingPlan.creatorId
          }

          this.store$.dispatch(PlanSessionFragmentStoreActions.createPlanSessionFragmentRequested({trainingPlanId, planSessionFragmentNoId}));
          if (this.addTrainingSessionSubscription) {
            this.addTrainingSessionSubscription.unsubscribe();
          }
          this.createPlanSessionFragmentSubmitted = true;
          this.postAddTrainingSessionToPlanActions(planSessionFragmentNoId, trainingPlan);
        }
      })
  }


  // Once training session has been added to plan, update the plan data accordingly
  private postAddTrainingSessionToPlanActions(planSessionFragmentNoId: PlanSessionFragmentNoIdOrTimestamp, trainingPlan: TrainingPlan) {
    this.createPlanSessionFragmentSubscription = this.createPlanSessionFragmentProcessing$
    .pipe(
      withLatestFrom(
        this.createPlanSessionFragmentError$,
      ),
    )
    .subscribe(([creatingPlanSessionFragment, creationError]) => {
      if (creationError) {
        console.log('Error creating planSessionFragment in database, terminating function');
        this.createPlanSessionFragmentSubscription.unsubscribe();
        this.createPlanSessionFragmentSubmitted = false;
        return;
      }
      
      if (creatingPlanSessionFragment) {
        this.createPlanSessionFragmentSubmitted = true;
      }

      if (!creatingPlanSessionFragment && this.createPlanSessionFragmentSubmitted) {
        console.log('planSessionFragment creation successful.');
        if (this.createPlanSessionFragmentSubscription) {
          this.createPlanSessionFragmentSubscription.unsubscribe();
        }
        // Add thumbnail url if one doesn't already exist
        const thumbnailExists = trainingPlan.thumbnailUrlSmall && trainingPlan.thumbnailUrlLarge;
        const trainingPlanUpdates: Update<TrainingPlan> = {
          id: trainingPlan.id,
          changes: {
            trainingSessionCount: trainingPlan.trainingSessionCount + 1, // Increment the training session count by one
            thumbnailUrlSmall: thumbnailExists ? trainingPlan.thumbnailUrlSmall : planSessionFragmentNoId.videoData.thumbnailUrlSmall, // Add thumbnail data if it doesn't exist
            thumbnailUrlLarge: thumbnailExists ? trainingPlan.thumbnailUrlLarge : planSessionFragmentNoId.videoData.thumbnailUrlLarge, // Add thumbnail data if it doesn't exist
          }
        };
    
        this.store$.dispatch(TrainingPlanStoreActions.updateTrainingPlanRequested({trainingPlanUpdates}));
        this.postUpdateTrainingPlanActions();
      }
    })
  }

  private postUpdateTrainingPlanActions() {
    this.updateTrainingPlanSubscription = this.updateTrainingPlanProcessing$
      .pipe(
        withLatestFrom(
          this.updateTrainingPlanError$,
        ),
      )
      .subscribe(([updatingTrainingPlan, updateError]) => {
        if (updateError) {
          console.log('Error updating trainingPlan in database, terminating function');
          this.updateTrainingPlanSubscription.unsubscribe();
          this.updateTrainingPlanSubmitted = false;
          return;
        }
        
        if (updatingTrainingPlan) {
          this.updateTrainingPlanSubmitted = true;
        }

        if (!updatingTrainingPlan && this.updateTrainingPlanSubmitted) {
          console.log('trainingPlan creation successful.');
          if (this.updateTrainingPlanSubscription) {
            this.updateTrainingPlanSubscription.unsubscribe();
          }
          this.activeCard = false;
          this.uiService.showSnackBar(`Training Session Added to Plan!`, 5000);
          this.navigateToTrainingSessionSelection();
        }
      })
  }

  private navigateToTrainingSessionSelection() {
    const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_ID) as string;
    const queryParams: AddTrainingSessionUrlParams = {
      [AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: true,
      [AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_ID]: trainingPlanId
    }
    const navigationExtras: NavigationExtras = {queryParams};
    this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
  }

  ngOnDestroy(): void {
    if (this.createPlanSessionFragmentSubscription) {
      this.createPlanSessionFragmentSubscription.unsubscribe();
    }

    if (this.addTrainingSessionSubscription) {
      this.addTrainingSessionSubscription.unsubscribe();
    }

    if (this.updateTrainingPlanSubscription) {
      this.updateTrainingPlanSubscription.unsubscribe();
    }
  }

}
