import { Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription, withLatestFrom, map, catchError, filter, switchMap, tap, throwError, of } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { NewDataForPlanSessionFragmentNoIdOrTimestamp, PlanSessionFragmentKeys, PlanSessionFragmentNoIdOrTimestamp } from 'shared-models/train/plan-session-fragment.model';
import { AddTrainingSessionToPlanQueryParams, AddTrainingSessionUrlToPlanParamsKeys, TrainingPlan, TrainingPlanKeys, TrainingPlanVisibilityCategoryDbOption } from 'shared-models/train/training-plan.model';
import { BrowseTrainingSessionsQueryParams, BrowseTrainingSessionsQueryParamsKeys, CanonicalTrainingSession, TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, TrainingSessionNoIdOrTimestamps } from 'shared-models/train/training-session.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { SnackbarActions } from 'shared-models/utils/snackbar-actions.model';
import { UiService } from 'src/app/core/services/ui.service';
import { PlanSessionFragmentStoreActions, PlanSessionFragmentStoreSelectors, TrainingPlanStoreActions, TrainingPlanStoreSelectors, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-add-training-session-to-plan-button',
  templateUrl: './add-training-session-to-plan-button.component.html',
  styleUrls: ['./add-training-session-to-plan-button.component.scss']
})
export class AddTrainingSessionToPlanButtonComponent implements OnInit, OnDestroy {

  @Input() trainingSessionData!: CanonicalTrainingSession;

  ADD_TRAINING_SESSION_TO_PLAN_BUTTON_VALUE = GlobalFieldValues.ADD_TO_PLAN;

  serverRequestProcessing$!: Observable<boolean>;
  $isActiveButton = signal(false); // Identifies the instance of the button being clicked vs all other instances of buttons

  private userData$!: Observable<PublicUser>;

  private $localTrainingPlanId = signal(undefined as string | undefined);
  private fetchSingleTrainingPlanProcessing$!: Observable<boolean>;
  private fetchSingleTrainingPlanError$!: Observable<{} | null>;
  private $fetchSingleTrainingPlanSubmitted = signal(false);

  private $localPlanSessionFragment = signal(undefined as PlanSessionFragmentNoIdOrTimestamp |  undefined);
  private createPlanSessionFragmentProcessing$!: Observable<boolean>;
  private createPlanSessionFragmentError$!: Observable<{} | null>;
  private $createPlanSessionFragmentSubmitted = signal(false);
  private $createPlanSessionFragmentCycleInit = signal(false);
  private $createPlanSessionFragmentCycleComplete = signal(false);

  private updateTrainingPlanProcessing$!: Observable<boolean>;
  private updateTrainingPlanError$!: Observable<{} | null>;
  private $updateTrainingPlanSubmitted = signal(false);
  private $updateTrainingPlanCycleInit = signal(false);
  private $updateTrainingPlanCycleComplete = signal(false);

  private addTrainingSessionToPlanSubscription!: Subscription;
  private combinedAddTrainingSessionToPlanError$!: Observable<{} | null>;

  private $trainingPlanVisibilityCategory = signal(undefined as TrainingPlanVisibilityCategoryDbOption | undefined);

  private store$ = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private uiService = inject(UiService);

  constructor() { }

  ngOnInit(): void {
    // Since this doesn't get destroyed in a list view, we aggressively unsubscribe after we complete the necessary action
    
    this.monitorProcesses(); // Optionally, this can be disabled here and instead enabled on demand when clicked (we chose to enable so that we can disable inactive buttons when serverRequestProcessing)
  }

  private monitorProcesses() {

    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;

    this.createPlanSessionFragmentProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectCreatePlanSessionFragmentProcessing);
    this.createPlanSessionFragmentError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectCreatePlanSessionFragmentError);

    this.fetchSingleTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanProcessing);
    this.fetchSingleTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanError);

    this.updateTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectUpdateTrainingPlanProcessing);
    this.updateTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectUpdateTrainingPlanError);

    this.serverRequestProcessing$ = combineLatest(
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

    this.combinedAddTrainingSessionToPlanError$ = combineLatest(
      [
        this.fetchSingleTrainingPlanError$,
        this.createPlanSessionFragmentError$,
        this.updateTrainingPlanError$
      ]
    ).pipe(
        map(([fetchTrainingPlanError, createTrainingSessionsError, updateTrainingPlanError]) => {
          if (fetchTrainingPlanError || createTrainingSessionsError || updateTrainingPlanError) {
            return fetchTrainingPlanError || createTrainingSessionsError || updateTrainingPlanError;
          }
          return false;
        })
      );
  }

  private setTrainingPlanId() {
    const trainingPlanId = this.route.snapshot.queryParams[PlanSessionFragmentKeys.TRAINING_PLAN_ID] as string | undefined;
    if (trainingPlanId) {
      this.$localTrainingPlanId.set(trainingPlanId);
    }
  }

  private setTrainingPlanVisibilityCategory(): void {
    const visibilityCategory = this.route.snapshot.queryParamMap.get(TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY) as TrainingPlanVisibilityCategoryDbOption | undefined;
    this.$trainingPlanVisibilityCategory.set(visibilityCategory);
    console.log('Setting this planVisibilityCategory', this.$trainingPlanVisibilityCategory());
  }

  onAddTrainingSessionToPlan() {
    this.$isActiveButton.set(true);
    this.setTrainingPlanVisibilityCategory();
    this.setTrainingPlanId();
    const trainingPlanId = this.$localTrainingPlanId() as string;
    const currentTrainingPlan$ = this.store$.select(TrainingPlanStoreSelectors.selectTrainingPlanById(trainingPlanId));
    const incompleteTrainingSessionNoId = this.buildTrainingSessionNoId()

    // This does the following: 1) Fetch training plan 2) create new planSessionFragment and add it to plan 3) update trainingPlan metadata
    this.addTrainingSessionToPlanSubscription = this.combinedAddTrainingSessionToPlanError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetComponentState();
            this.navigateToBrowseTrainingSessionsWithPlanBuilder();
          }
          return currentTrainingPlan$;
        }),
        withLatestFrom(this.combinedAddTrainingSessionToPlanError$, this.userData$),
        filter(([trainingPlan, processingError, userData]) => !processingError),
        map(([trainingPlan, processingError, userData]) => {
          if (!trainingPlan && !this.$fetchSingleTrainingPlanSubmitted()) {
            this.$fetchSingleTrainingPlanSubmitted.set(true);
            console.log(`trainingPlan ${trainingPlanId} not in store, fetching from database`);
            this.store$.dispatch(TrainingPlanStoreActions.fetchSingleTrainingPlanRequested({
              trainingPlanId,
              userId: userData.id,
              visibilityCategory: this.$trainingPlanVisibilityCategory()!
            }));
          }
          return trainingPlan;
        }),
        filter(trainingPlan => !!trainingPlan),
        withLatestFrom(this.userData$),
        switchMap(([trainingPlan, userData]) => {
          const indexOfFinalItem = trainingPlan!.trainingSessionCount - 1;
          const dataToAdd: NewDataForPlanSessionFragmentNoIdOrTimestamp = {
            [PlanSessionFragmentKeys.CANONICAL_ID]: this.trainingSessionData.id,
            [PlanSessionFragmentKeys.CREATOR_ID]: trainingPlan!.creatorId,
            [PlanSessionFragmentKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT,
            [PlanSessionFragmentKeys.TRAINING_PLAN_ID]: trainingPlanId,
            [PlanSessionFragmentKeys.TRAINING_PLAN_INDEX]: indexOfFinalItem + 1,
            [PlanSessionFragmentKeys.TRAINING_PLAN_OWNER_ID]: trainingPlan!.creatorId,
            [PlanSessionFragmentKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: this.$trainingPlanVisibilityCategory()!
          };
          const planSessionFragmentNoId: PlanSessionFragmentNoIdOrTimestamp = {
            ...incompleteTrainingSessionNoId,
            ...dataToAdd
          };
          this.$localPlanSessionFragment.set(planSessionFragmentNoId);
          if(!this.$createPlanSessionFragmentSubmitted()) {
            this.store$.dispatch(PlanSessionFragmentStoreActions.createPlanSessionFragmentRequested({trainingPlanId, planSessionFragmentNoId, userId: userData.id}));
            this.$createPlanSessionFragmentSubmitted.set(true);
          }
          return this.createPlanSessionFragmentProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(creationProcessing => {
          if (creationProcessing) {
            this.$createPlanSessionFragmentCycleInit.set(true);
          }
          if (!creationProcessing && this.$createPlanSessionFragmentCycleInit()) {
            console.log('planSessionFragment creation successful, proceeding with pipe.');
            this.$createPlanSessionFragmentCycleInit.set(false)
            this.$createPlanSessionFragmentCycleComplete.set(true);
          }
        }),
        filter(creationProcessing => !creationProcessing && this.$createPlanSessionFragmentCycleComplete()),
        withLatestFrom(currentTrainingPlan$, this.userData$),
        switchMap(([creationProcessing, trainingPlan, userData]) => {
          if (!this.$updateTrainingPlanSubmitted()) {
            this.$updateTrainingPlanSubmitted.set(true);
            // Add thumbnail url if one doesn't already exist
            const thumbnailExists = trainingPlan!.thumbnailUrlSmall && trainingPlan!.thumbnailUrlLarge;
            const trainingPlanUpdates: Update<TrainingPlan> = {
              id: trainingPlan!.id,
              changes: {
                trainingSessionCount: trainingPlan!.trainingSessionCount + 1, // Increment the training session count by one
                thumbnailUrlSmall: thumbnailExists ? trainingPlan!.thumbnailUrlSmall : this.$localPlanSessionFragment()!.videoData.thumbnailUrlSmall, // Add thumbnail data if it doesn't exist
                thumbnailUrlLarge: thumbnailExists ? trainingPlan!.thumbnailUrlLarge : this.$localPlanSessionFragment()!.videoData.thumbnailUrlLarge, // Add thumbnail data if it doesn't exist
              }
            };
            this.store$.dispatch(TrainingPlanStoreActions.updateTrainingPlanRequested({
              trainingPlanUpdates, 
              userId: userData.id, 
              visibilityCategory: this.$trainingPlanVisibilityCategory()!
            }));
          }
          return this.updateTrainingPlanProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(updateProcessing => {
          if (updateProcessing) {
            this.$updateTrainingPlanCycleInit.set(true);
          }
          if (!updateProcessing && this.$updateTrainingPlanCycleInit()) {
            console.log('trainingPlan update successful, proceeding with pipe.');
            this.$updateTrainingPlanCycleInit.set(false);
            this.$updateTrainingPlanCycleComplete.set(true);
          }
        }),
        filter(updateProcessing => !updateProcessing && this.$updateTrainingPlanCycleComplete()),
        tap((updateProcessing: boolean) => {
          this.uiService.showSnackBar(`Training Session Added to Plan!`, 10000, SnackbarActions.EDIT_PLAN);
          this.resetComponentState();
          this.navigateToBrowseTrainingSessionsWithPlanBuilder();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 10000);
          this.resetComponentState();
          this.navigateToBrowseTrainingSessionsWithPlanBuilder();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetComponentState() {
    this.addTrainingSessionToPlanSubscription?.unsubscribe();
    this.$isActiveButton.set(false);
    this.$fetchSingleTrainingPlanSubmitted.set(false);
    this.$createPlanSessionFragmentSubmitted.set(false);
    this.$createPlanSessionFragmentCycleInit.set(false);
    this.$createPlanSessionFragmentCycleComplete.set(false);
    this.$updateTrainingPlanSubmitted.set(false);
    this.$updateTrainingPlanCycleInit.set(false);
    this.$updateTrainingPlanCycleComplete.set(false);
    this.store$.dispatch(TrainingPlanStoreActions.purgeTrainingPlanErrors());
    this.store$.dispatch(PlanSessionFragmentStoreActions.purgePlanSessionFragmentErrors());
  }

  // Convert current trainingSession into a no-id version to serve as the base for the planSessionFragment
  private buildTrainingSessionNoId(): TrainingSessionNoIdOrTimestamps {
    const trainingSession = this.trainingSessionData;
    const clone: any = {...trainingSession};
    let incompleteTrainingSessionNoId: TrainingSessionNoIdOrTimestamps;
    switch (trainingSession[TrainingSessionKeys.DATABASE_CATEGORY]) {
      case TrainingSessionDatabaseCategoryTypes.CANONICAL:
        Object.keys(PlanSessionFragmentKeys).forEach(key => {
          const propertyToDelete = clone[key];
          if (propertyToDelete) {
            delete clone[key];
          }
        });
        incompleteTrainingSessionNoId = clone;
        break;
      default:
        throw new Error('No databaseCategory found. Cannot buildTrainingSessionNoId.');
    }
    return incompleteTrainingSessionNoId;
  }

  private navigateToBrowseTrainingSessionsWithPlanBuilder() {
    if (this.$trainingPlanVisibilityCategory()) {
      console.log('navigateToBrowseTrainingSessionsWithPlanBuilder');
      this.addTrainingSessionToPlanSubscription?.unsubscribe();
      this.resetComponentState();
      const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_ID) as string;
      const queryParams: AddTrainingSessionToPlanQueryParams = {
        [AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: true,
        [AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_ID]: trainingPlanId,
        [AddTrainingSessionUrlToPlanParamsKeys.VIEW_TRAINING_SESSIONS]: true,
        [AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: this.$trainingPlanVisibilityCategory()!
      }
      const navigationExtras: NavigationExtras = {queryParams};
      this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
    } else {
      console.log('Missing trainingPlanVisibilityCategory, routing to Browse rather than planBuilder')
      const queryParams: BrowseTrainingSessionsQueryParams = {
        [BrowseTrainingSessionsQueryParamsKeys.VIEW_TRAINING_SESSIONS]: true
      };
      const navigationExtras: NavigationExtras = {queryParams};
      this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
    }

  }

  ngOnDestroy(): void {
    this.addTrainingSessionToPlanSubscription?.unsubscribe();
  }

}
