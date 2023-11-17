import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, Subscription, withLatestFrom, take, tap, switchMap, filter, of, catchError, throwError, Subject, debounceTime, distinctUntilChanged, takeWhile, fromEvent, takeUntil } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingPlanFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { AddTrainingSessionUrlParams, TrainingPlan, TrainingPlanFormVars, TrainingPlanKeys, TrainingPlanNoIdOrTimestamp, AddTrainingSessionUrlParamsKeys } from 'shared-models/train/training-plan.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { PlanSessionFragmentStoreActions, PlanSessionFragmentStoreSelectors, TrainingPlanStoreActions, TrainingPlanStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { Update } from '@ngrx/entity';
import { UiService } from 'src/app/core/services/ui.service';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { DeletePlanSessionFragmentUrlParamsKeys, PlanSessionFragment, PlanSessionFragmentKeys, ViewPlanSessionFragmentUrlParams } from 'shared-models/train/plan-session-fragment.model';
import { TrainingSessionDatabaseCategoryTypes, ViewTrainingSessionsUrlParamsKeys } from 'shared-models/train/training-session.model';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActionConfData } from 'shared-models/forms/action-conf-data.model';
import { ActionConfirmDialogueComponent } from 'src/app/shared/components/action-confirm-dialogue/action-confirm-dialogue.component';

@Component({
  selector: 'app-edit-training-plan',
  templateUrl: './edit-training-plan.component.html',
  styleUrls: ['./edit-training-plan.component.scss']
})
export class EditTrainingPlanComponent implements OnInit, OnDestroy {

  ADD_A_TRAINING_SESSION_BUTTON_VALUE = GlobalFieldValues.ADD_SESSION_TO_PLAN;
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  CREATE_TRAINING_PLAN_BUTTON_VALUE = GlobalFieldValues.CREATE_PLAN;
  CREATE_TRAINING_PLAN_TITLE_VALUE = GlobalFieldValues.CREATE_PLAN;
  DELETE_TRAINING_PLAN_BUTTON_VALUE = GlobalFieldValues.DELETE_TRAINING_PLAN;
  DELETE_TRAINING_PLAN_CONF_BODY = GlobalFieldValues.DELETE_TRAINING_PLAN_CONF_BODY;
  DELETE_TRAINING_PLAN_CONF_TITLE = GlobalFieldValues.DELETE_TRAINING_PLAN_CONF_TITLE;
  EDIT_TRAINING_PLAN_TITLE_VALUE = GlobalFieldValues.EDIT_TRAINING_PLAN;
  REMOVE_TRAINING_SESSION_CONF_BODY = GlobalFieldValues.REMOVE_TRAINING_SESSION_CONF_BODY;
  REMOVE_TRAINING_SESSION_CONF_TITLE = GlobalFieldValues.REMOVE_TRAINING_SESSION_CONF_TITLE;
  REQUEST_PROCESSING_MESSAGE = GlobalFieldValues.REQUEST_PROCESSING;
  SUBMIT_BUTTON_VALUE = GlobalFieldValues.SUBMIT;
  TITLE_FIELD_VALUE = GlobalFieldValues.TITLE;

  TITLE_MIN_LENGTH = TrainingPlanFormVars.titleMinLength;
  TITLE_MAX_LENGTH = TrainingPlanFormVars.titleMaxLength;

  FORM_VALIDATION_MESSAGES = TrainingPlanFormValidationMessages;
  trainingPlanForm = new FormGroup({
    [TrainingPlanKeys.TITLE]: new FormControl('', [Validators.required, Validators.minLength(this.TITLE_MIN_LENGTH), Validators.maxLength(this.TITLE_MAX_LENGTH)]),
  });

  private userData$!: Observable<PublicUser>;

  private createTrainingPlanError$!: Observable<{} | null>;
  private createTrainingPlanProcessing$!: Observable<boolean>;
  private $createTrainingPlanSubmitted = signal(false);
  private createNewTrainingPlanSubscription!: Subscription;

  private updateTrainingPlanProcessing$!: Observable<boolean>;
  private updateTrainingPlanSubscription!: Subscription;
  private updateTrainingPlanError$!: Observable<{} | null>;
  private $updateTrainingPlanSubmitted = signal(false);
  private $updateTrainingPlanCycleInit = signal(false);
  private $updateTrainingPlanCycleComplete = signal(false);

  $localTrainingPlan = signal(undefined as TrainingPlan | undefined);
  $localTrainingPlanId = signal(undefined as string | undefined);
  private fetchSingleTrainingPlanProcessing$!: Observable<boolean>;
  private fetchSingleTrainingPlanError$!: Observable<{} | null>;
  private $fetchSingleTrainingPlanSubmitted = signal(false);

  allPlanSessionFragmentsInStore$!: Observable<PlanSessionFragment[]>; 
  $localPlanSessionFragments = signal(undefined as PlanSessionFragment[] | undefined);
  private fetchAllPlanSessionFragmentsProcessing$!: Observable<boolean>;
  private fetchAllPlanSessionFragmentsError$!: Observable<{} | null>;
  private $fetchPlanSessionFragmentsSubmitted = signal(false);
  private $planSessionFragmentsFetched = signal(false);

  combinedTrainingDataSubscription!: Subscription;
  private fetchCombinedTrainingDataError$!: Observable<{} | null>;

  private batchModifyPlanSessionFragmentsError$!: Observable<{} | null>;
  private batchModifyPlanSessionFragmentsProcessing$!: Observable<boolean>;
  private $batchModifyPlanSessionFragmentsSubmitted = signal(false);
  private $batchModifyPlanSessionFragmentsCycleInit = signal(false);
  private $batchModifyPlanSessionFragmentsCycleComplete = signal(false);
  
  private batchDeletePlanSessionFragmentsError$!: Observable<{} | null>;
  private batchDeletePlanSessionFragmentsProcessing$!: Observable<boolean>;
  private $batchDeletePlanSessionFragmentsSubmitted = signal(false);
  private $batchDeletePlanSessionFragmentsCycleInit = signal(false);
  private $batchDeletePlanSessionFragmentsCycleComplete = signal(false);

  private deletePlanSessionFragmentError$!: Observable<{} | null>;
  private deletePlanSessionFragmentProcessing$!: Observable<boolean>;
  private $deletePlanSessionFragmentSubmitted = signal(false);
  $deletePlanSessionFragmentCycleInit = signal(false);
  private $deletePlanSessionFragmentCycleComplete = signal(false);
  private deletePlanSessionFragmentSubscription!: Subscription;
  private autoDeletePlanSessionFragmentSubscription!: Subscription;

  combinedDeletePlanSessionFragmentProcessing$!: Observable<boolean>;
  private combinedDeletePlanSessionFragmentError$!: Observable<{} | null>;

  private deleteTrainingPlanError$!: Observable<{} | null>;
  private deleteTrainingPlanProcessing$!: Observable<boolean>;
  private $deleteTrainingPlanSubmitted = signal(false);
  private $deleteTrainingPlanCycleInit = signal(false);
  private $deleteTrainingPlanCycleComplete = signal(false);
  private deleteTrainingPlanSubscription!: Subscription;

  combinedDeleteTrainingPlanProcessing$!: Observable<boolean>;
  private combinedDeleteTrainingPlanError$!: Observable<{} | null>;


  serverRequestProcessing$!: Observable<boolean>;
  
  $isNewPlan = signal(false);
  $editTrainingPlanDetails = signal(false);

  private debounceDragDropServerCall$ = new Subject<void>();
  private debounceDragDropServerCallSubscription!: Subscription;

  private store$ = inject(Store);
  private route = inject(ActivatedRoute);
  private uiService = inject(UiService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  
  
  
  constructor() { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.configureTrainingPlanInterface();
    this.initializeDebounceDragDropServerCallObserver();
  }

  private monitorProcesses() {
    
    
    this.allPlanSessionFragmentsInStore$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsInStore); // Used to contrast the server version against the local version for debounce purposes

    this.batchDeletePlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectBatchDeletePlanSessionFragmentsError);
    this.batchDeletePlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectBatchDeletePlanSessionFragmentsProcessing);

    this.batchModifyPlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectBatchModifyPlanSessionFragmentsError);
    this.batchModifyPlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectBatchModifyPlanSessionFragmentsProcessing);
    
    this.createTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectCreateTrainingPlanError);
    this.createTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectCreateTrainingPlanProcessing);

    this.deletePlanSessionFragmentError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectDeletePlanSessionFragmentError);
    this.deletePlanSessionFragmentProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectDeletePlanSessionFragmentProcessing);
    
    this.deleteTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectDeleteTrainingPlanError);
    this.deleteTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectDeleteTrainingPlanProcessing);

    this.fetchAllPlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsError);
    this.fetchAllPlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsProcessing);

    this.fetchSingleTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanError);
    this.fetchSingleTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanProcessing);

    this.updateTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectUpdateTrainingPlanError);
    this.updateTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectUpdateTrainingPlanProcessing);

    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;

    this.serverRequestProcessing$ = combineLatest(
      [
        this.batchDeletePlanSessionFragmentsProcessing$,
        this.batchModifyPlanSessionFragmentsProcessing$,
        this.createTrainingPlanProcessing$,
        this.deletePlanSessionFragmentProcessing$,
        this.fetchAllPlanSessionFragmentsProcessing$,
        this.fetchSingleTrainingPlanProcessing$,
        this.updateTrainingPlanProcessing$,
      ]
    ).pipe(
        map(([
          batchDeletePlanSessionFragmentsProcessing,
          batchModifyPlanSessionFragmentsProcessing,
          createTrainingPlanProcessing, 
          deletePlanSessionFragmentProcessing,
          fetchAllPlanSessionFragmentsProcessing,
          fetchSingleTrainingPlanProcessing, 
          updateTrainingPlanProcessing, 
        ]) => {
          if (
            batchDeletePlanSessionFragmentsProcessing ||
            batchModifyPlanSessionFragmentsProcessing ||
            createTrainingPlanProcessing || 
            deletePlanSessionFragmentProcessing ||
            fetchAllPlanSessionFragmentsProcessing ||
            fetchSingleTrainingPlanProcessing || 
            updateTrainingPlanProcessing
            ) {
            return true;
          }
          return false;
        })
      );

    this.combinedDeletePlanSessionFragmentProcessing$ = combineLatest(
      [
        this.batchModifyPlanSessionFragmentsProcessing$,
        this.deletePlanSessionFragmentProcessing$,
        this.updateTrainingPlanProcessing$,
      ]
    ).pipe(
        map(([
          batchModifyPlanSessionFragmentsProcessing,
          deletePlanSessionFragmentProcessing,
          updateTrainingPlanProcessing, 
        ]) => {
          if (
            batchModifyPlanSessionFragmentsProcessing ||
            deletePlanSessionFragmentProcessing ||
            updateTrainingPlanProcessing
            ) {
            return batchModifyPlanSessionFragmentsProcessing || deletePlanSessionFragmentProcessing || updateTrainingPlanProcessing;
          }
          return false;
        })
      );

    this.combinedDeletePlanSessionFragmentError$ = combineLatest(
      [
        this.batchModifyPlanSessionFragmentsError$,
        this.deletePlanSessionFragmentError$,
        this.updateTrainingPlanError$,
      ]
    ).pipe(
        map(([
          batchModifyPlanSessionFragmentsError,
          deletePlanSessionFragmentError,
          updateTrainingPlanError, 
        ]) => {
          if (
            batchModifyPlanSessionFragmentsError ||
            deletePlanSessionFragmentError ||
            updateTrainingPlanError
            ) {
            return batchModifyPlanSessionFragmentsError || deletePlanSessionFragmentError || updateTrainingPlanError;
          }
          return false;
        })
      );

    this.combinedDeletePlanSessionFragmentProcessing$ = combineLatest(
      [
        this.deleteTrainingPlanProcessing$,
        this.batchDeletePlanSessionFragmentsProcessing$
      ]
    ).pipe(
        map(([
          deleteTrainingPlanProcessing,
          batchDeletPlanSessionFragmentsProcessing
        ]) => {
          if (
            deleteTrainingPlanProcessing ||
            batchDeletPlanSessionFragmentsProcessing
            ) {
              return deleteTrainingPlanProcessing || batchDeletPlanSessionFragmentsProcessing;
          }
          return false;
        })
      );
    
    this.combinedDeleteTrainingPlanError$ = combineLatest(
      [
        this.deleteTrainingPlanError$,
        this.batchDeletePlanSessionFragmentsError$
      ]
    ).pipe(
      map(([
        deleteTrainingPlanError,
        batchDeletPlanSessionFragmentsError
      ]) => {
        if (
          deleteTrainingPlanError ||
          batchDeletPlanSessionFragmentsError
        ) {
          return deleteTrainingPlanError || batchDeletPlanSessionFragmentsError;
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
        map(([fetchPlanError, fetchSessionsError]) => {
          if (fetchPlanError || fetchSessionsError) {
            return fetchPlanError || fetchSessionsError;
          }
          return null;
        })
      );

  }

  private configureTrainingPlanInterface(): void {
    this.setTrainingPlanId();
    const trainingPlanId = this.$localTrainingPlanId();
    if (trainingPlanId) {
      console.log('Existing trainingPlan detected, patching existing data');
      this.patchExistingDataIntoForm(trainingPlanId)
    } else {
      console.log('New trainingPlan detected, configuring new trainingPlan');
      this.configureNewPlan();
    }
    this.checkForDeletePlanSessionFragmentRequest();
  }

  private configureNewPlan() {
    this.$isNewPlan.set(true);
    this.$editTrainingPlanDetails.set(true);
  }

  private setTrainingPlanId() {
    const trainingPlanId = this.route.snapshot.params[TrainingPlanKeys.ID] as string | undefined;
    if (trainingPlanId) {
      this.$localTrainingPlanId.set(trainingPlanId);
    }
  }

  // Automatically trigger a delete request if detected in the query params
  private checkForDeletePlanSessionFragmentRequest() {
    const planSessionFragmentId = this.route.snapshot.queryParamMap.get(DeletePlanSessionFragmentUrlParamsKeys.DELETE_PLAN_SESSION_FRAGMENT_ID);
    // Terminate function if no id found
    if (!planSessionFragmentId) {
      return;
    }
    console.log('delete planSessionFragmentId found in query params', planSessionFragmentId);

    // If the fragments are available in the signal (which is the case if they were previously loaded in store), process the delete from that data
    if (planSessionFragmentId && this.$localPlanSessionFragments()) {
      const planSessionFragmentToDelete = this.$localPlanSessionFragments()!.find(fragment => fragment.id === planSessionFragmentId);
      if (planSessionFragmentToDelete) {
        console.log('Found this planSessionFragment to delete', planSessionFragmentToDelete);
        this.onDeletePlanSessionFragment(planSessionFragmentToDelete);
        return;
      }
    }

    // Otherwise, subscribe to the observable and pull it once the fragments are available
    if (planSessionFragmentId) {
      this.autoDeletePlanSessionFragmentSubscription = this.allPlanSessionFragmentsInStore$
        .pipe(
          tap(planSessessionFragments => {
            const planSessionFragmentToDelete = planSessessionFragments.find(fragment => fragment.id === planSessionFragmentId);
            if (planSessionFragmentToDelete) {
              console.log('Found this planSessionFragment to delete', planSessionFragmentToDelete);
              this.onDeletePlanSessionFragment(planSessionFragmentToDelete);
              this.autoDeletePlanSessionFragmentSubscription?.unsubscribe();
            }
          })
        ).subscribe();
    }
  }

  // This removes the deletePlanSessionFragmentId query param from the url if it exists
  private removePlanSessionFragmentIdQueryParamFromUrl() {
    const planSessionFragmentId = this.route.snapshot.queryParamMap.get(DeletePlanSessionFragmentUrlParamsKeys.DELETE_PLAN_SESSION_FRAGMENT_ID);
    if (planSessionFragmentId) {
      this.router.navigate([], { queryParamsHandling: 'merge', queryParams: { [DeletePlanSessionFragmentUrlParamsKeys.DELETE_PLAN_SESSION_FRAGMENT_ID]: null } });
    }
  }

  private patchExistingDataIntoForm(trainingPlanId: string) {
    this.combinedTrainingDataSubscription = this.fetchCombinedTrainingDataError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.onNavigateUserToTrainingPlan();
          }
          const singleTrainingPlan$ = this.store$.select(TrainingPlanStoreSelectors.selectTrainingPlanById(trainingPlanId));
          return singleTrainingPlan$;
        }),
        withLatestFrom(this.fetchSingleTrainingPlanError$),
        filter(([trainingPlan, processingError]) => !processingError && !this.$deleteTrainingPlanSubmitted()),
        map(([trainingPlan, processingError]) => {
          if (!trainingPlan && !this.$fetchSingleTrainingPlanSubmitted()) {
            this.$fetchSingleTrainingPlanSubmitted.set(true);
            console.log(`trainingPlan ${trainingPlanId} not in store, fetching from database`);
            this.store$.dispatch(TrainingPlanStoreActions.fetchSingleTrainingPlanRequested({trainingPlanId}));
          }
          return trainingPlan;
        }),
        filter(trainingPlan => !!trainingPlan),
        switchMap(trainingPlan => {
          // Only update the local trainingPlan array if there are updates to the trainingPlan
          if (this.$localTrainingPlan() !== trainingPlan) {
            this.$localTrainingPlan.set(trainingPlan!); // Load the current trainingPlan into the instance variable
            console.log('Set currentTrainingPlan', this.$localTrainingPlan());
            this.title.setValue(trainingPlan!.title); // Update the form title
          }
          if (trainingPlan?.trainingSessionCount === 0) {
            console.log('No trainingSessions in trainingPlan, setting to planSessionFragments to empty array');
            this.$localPlanSessionFragments.set([]);
          }
          return combineLatest([of(trainingPlan), this.allPlanSessionFragmentsInStore$]);
        }),
        filter(([trainingPlan, planSessionFragments]) => trainingPlan!.trainingSessionCount > 0), // Only fetch planSessionFragments if they exist in plan
        switchMap(([trainingPlan, planSessionFragments]) => {
          // Determine if data has been fetched by checking if the legnth of the array matches the trainingPlan's count
          const filteredPlanSessionFragments = planSessionFragments.filter(fragment => fragment.trainingPlanId === trainingPlanId);
          const dataAlreadyInStore = filteredPlanSessionFragments.length === trainingPlan?.trainingSessionCount;
          this.$planSessionFragmentsFetched.set(dataAlreadyInStore);
          if (this.$planSessionFragmentsFetched()) {
            console.log('Fragments already in store, will not fetch');
          }
          if (!this.$planSessionFragmentsFetched() && !this.$fetchPlanSessionFragmentsSubmitted()) {
            this.$fetchPlanSessionFragmentsSubmitted.set(true);
            console.log('planSessionFragments not in store, fetching from database');
            this.store$.dispatch(PlanSessionFragmentStoreActions.fetchAllPlanSessionFragmentsRequested({trainingPlanId}));
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
          this.onNavigateUserToTrainingPlan();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  // This toggles visibility of the trainingPlan title edit view
  onEditTrainingPlanDetails() {
    this.$editTrainingPlanDetails.set(true);
  }

  onSubmitTrainingPlanForm(): void {
    this.$isNewPlan() ? this.createNewTrainingPlan() : this.updateExistingTrainingPlan();
  }

  private createNewTrainingPlan() {
    this.createNewTrainingPlanSubscription = this.createTrainingPlanError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating dialog');
            this.$createTrainingPlanSubmitted.set(false);
            this.store$.dispatch(TrainingPlanStoreActions.purgeNewTrainingPlanId());
          }
          return this.userData$;
        }),
        withLatestFrom(this.createTrainingPlanError$),
        filter(([userData, processingError]) => !processingError), // Halts function if processingError detected
        switchMap(([userData, processingError]) => {
          if (!this.$createTrainingPlanSubmitted()) {
            this.$createTrainingPlanSubmitted.set(true);
            const trainingPlanNoId: TrainingPlanNoIdOrTimestamp = {
              creatorId: userData.id,
              [TrainingPlanKeys.TITLE]: this.title.value,
              trainingSessionCount: 0
            };
            this.store$.dispatch(TrainingPlanStoreActions.createTrainingPlanRequested({trainingPlanNoId}));
          }
          const newTrainingPlanId = this.store$.select(TrainingPlanStoreSelectors.selectNewTrainingPlanId);
          return newTrainingPlanId;
        }),
        withLatestFrom(this.createTrainingPlanProcessing$),
        filter(([newTrainingPlanId, createTrainingPlanProcessing]) => !!newTrainingPlanId && !createTrainingPlanProcessing),
        tap(([newTrainingPlanId, createTrainingPlanProcessing]) => {
          console.log('trainingPlan creation successful.');
          this.uiService.showSnackBar(`Plan Created!`, 5000);
          this.store$.dispatch(TrainingPlanStoreActions.purgeNewTrainingPlanId()); // Clears this out of working memory since it isn't needed anymore
          this.router.navigate([PublicAppRoutes.BUILD_EDIT_TRAINING_PLAN, newTrainingPlanId!]); // Switches mode from createTrainingPlan to editTrainingPlan 
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.$createTrainingPlanSubmitted.set(false);
          return throwError(() => new Error(error));
        })
      ).subscribe();
  
  }

  private updateExistingTrainingPlan() {
    this.$updateTrainingPlanSubmitted.set(false);
    const trainingPlanId = this.$localTrainingPlanId();
    this.updateTrainingPlanSubscription = this.updateTrainingPlanError$
    .pipe(
      map(processingError => {
        if (processingError) {
          console.log('processingError detected, terminating pipe');
          this.resetUpdateExistingPlanComponentState();
        }
        return processingError;
      }),
      filter(processingError => !processingError), // Halts function if processingError detected
      switchMap(processingError => {
        const trainingPlan = this.store$.select(TrainingPlanStoreSelectors.selectTrainingPlanById(trainingPlanId!))
        return trainingPlan;
      }),
      filter(trainingPlan => !!trainingPlan),
      switchMap(trainingPlan => {
        if (!this.$updateTrainingPlanSubmitted()) {
          const updatedTrainingPlan: Update<TrainingPlan> = {
            id: trainingPlan!.id,
            changes: {
              [TrainingPlanKeys.TITLE]: this.title.value,
            }            
          };
          this.store$.dispatch(TrainingPlanStoreActions.updateTrainingPlanRequested({trainingPlanUpdates: updatedTrainingPlan}));
          this.$updateTrainingPlanSubmitted.set(true);
        }
        return this.updateTrainingPlanProcessing$;
      }),
      // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
      tap(updateProcessing => {
        if (updateProcessing) {
          this.$updateTrainingPlanCycleInit.set(true);
        }
        if (!updateProcessing && this.$updateTrainingPlanCycleInit()) {
          console.log('updateTrainingPlan successful, proceeding with pipe.');
          this.$updateTrainingPlanCycleInit.set(false);
          this.$updateTrainingPlanCycleComplete.set(true);
        }
      }),
      filter(updateProcessing => !updateProcessing && this.$updateTrainingPlanCycleComplete()),
      tap(updateProcessing => {
        this.uiService.showSnackBar(`Training Plan updated!`, 5000);
        this.updateTrainingPlanSubscription?.unsubscribe();
        this.$editTrainingPlanDetails.set(false); // Hides the plan editing interface
      }),
      // Catch any local errors
      catchError(error => {
        console.log('Error in component:', error);
        this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
        this.resetUpdateExistingPlanComponentState();
        return throwError(() => new Error(error));
      })
    ).subscribe();
   
  }

  private resetUpdateExistingPlanComponentState() {
    this.$editTrainingPlanDetails.set(false);
    this.$updateTrainingPlanSubmitted.set(false);
    this.$updateTrainingPlanCycleInit.set(false);
    this.$updateTrainingPlanCycleComplete.set(false);
  }

  onNavigateUserToTrainingPlan(): void {
    this.router.navigate([PublicAppRoutes.TRAIN_TRAINING_PLAN, this.$localTrainingPlanId()]);
  }

  // Dictates the behavior when the user aborts editing the trainingPlan title
  onCancelTitleUpdate() {
    if (this.$isNewPlan()) {
      // This effectively aborts the plan creation process
      this.uiService.routeUserToPreviousPage(); 
    } else {
      // Hide the title editing interface
      this.$editTrainingPlanDetails.set(false);
      // If any edits were made, revert to original title value (otherwise edits will be visible when clicking edit button again)
      this.title.setValue(this.$localTrainingPlan()!.title);
    }
  }

  onAddTrainingSession() {
    const queryParams: AddTrainingSessionUrlParams = {
      [AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: true,
      [AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_ID]: this.$localTrainingPlanId()!,
      [ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS]: true
    }
    const navigationExtras: NavigationExtras = {
      queryParams
    };
    this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
  }

  onSelectPlanSessionFragment(planSessionFragmentData: PlanSessionFragment) {
    const queryParams: ViewPlanSessionFragmentUrlParams = {
      canonicalId: planSessionFragmentData.canonicalId,
      databaseCategory: TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT,
      trainingPlanId: planSessionFragmentData.trainingPlanId
    };
    const navigationExtras = {queryParams};
    this.router.navigate([`${PublicAppRoutes.TRAIN_TRAINING_SESSION}`, planSessionFragmentData.id], navigationExtras);
  }

  onListItemDrop(event: CdkDragDrop<PlanSessionFragment[]>) {
    
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    // Do nothing if no change in index;
    if (previousIndex === currentIndex) {
      return;
    }

    // Update the signal locally in real-time
    this.$localPlanSessionFragments.update(planSessessionFragments => {
      if (previousIndex === currentIndex) {
        return planSessessionFragments; // No movement needed
      }
  
      const movedItem = { ...planSessessionFragments![previousIndex] }; // Clone the item to be moved
      const altUpdatedArray = [...planSessessionFragments!]; // Clone the original array
      
      // Remove the item from its old position
      altUpdatedArray.splice(previousIndex, 1);
      
      // Insert it into its new position
      altUpdatedArray.splice(currentIndex, 0, movedItem);

      // Update the indexes of the affected items
      const start = Math.min(previousIndex, currentIndex);
      const end = Math.max(previousIndex, currentIndex);
      for (let i = start; i <= end; i++) {
        const currentItem = {...altUpdatedArray[i]};
        currentItem[PlanSessionFragmentKeys.TRAINING_PLAN_INDEX] = i;
        altUpdatedArray[i] = currentItem;
      }
  
      return altUpdatedArray;
    })

    // Trigger server update request to be processed according to the debounce policy
    this.debounceDragDropServerCall$.next();
  }

  // This limits server calls when rapid changes are made to the UI
  private initializeDebounceDragDropServerCallObserver() {
    this.debounceDragDropServerCallSubscription = this.debounceDragDropServerCall$
      .pipe(
        debounceTime(2000), // Determines how frequently updates are sent to the server
        withLatestFrom(this.allPlanSessionFragmentsInStore$),
        switchMap(([empty, serverPlanSessionFragments]) => {
          return of(this.buildAndDispatchReorderRequest(serverPlanSessionFragments));
        })
      ).subscribe();
  }

  private buildAndDispatchReorderRequest(serverPlanSessionFragments: PlanSessionFragment[]) {
    // Filter the serverPlanSessionFragments for the currrent plan
    const trainingPlanId = this.$localTrainingPlanId();
    const filteredServerFragments = (serverPlanSessionFragments).filter(fragment => fragment.trainingPlanId === trainingPlanId!);

    // Build an array of server updates that only updates the items that have changed
    const planSessionFragmentUpdates = [] as Update<PlanSessionFragment>[]; // This will be used to send batch update to database
    this.$localPlanSessionFragments()?.forEach((itemToUpdate, index) => {
      // If current item matches the server item of the same index, no update is necessary, so don't push to server
      if (itemToUpdate.id === filteredServerFragments[index].id) {
        return;
      }
      // Otherwise, create an update object and push it to the update array
      const altAffectedItemUpdateObject: Update<PlanSessionFragment> = {
        id: itemToUpdate.id,
        changes: {
          trainingPlanIndex: itemToUpdate.trainingPlanIndex
        }
      };
      planSessionFragmentUpdates.push(altAffectedItemUpdateObject);
    })

    console.log('planSessionFragmentUpdates', planSessionFragmentUpdates);
    // Dispatch update array to the server
    this.store$.dispatch(PlanSessionFragmentStoreActions.batchModifyPlanSessionFragmentsRequested({trainingPlanId: trainingPlanId!, planSessionFragmentUpdates}));
  } 

  onDeletePlanSessionFragment(selectedPlanSessionFragment: PlanSessionFragment) {
    
    const trainingPlanId = this.$localTrainingPlanId()!;
    const planSessionFragmentId = selectedPlanSessionFragment.id;
    let planSessionFragmentUpdates: Update<PlanSessionFragment>[];
    let trainingPlanUpdates: Update<TrainingPlan>;
    let updatesConfigured = false;

    const dialogConfig = new MatDialogConfig();
    const actionConfData: ActionConfData = {
      title: this.REMOVE_TRAINING_SESSION_CONF_TITLE,
      body: this.REMOVE_TRAINING_SESSION_CONF_BODY,
    };

    dialogConfig.data = actionConfData;
    
    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);

    const dialogActionObserver$: Observable<boolean> = dialogRef.afterClosed();

    this.deletePlanSessionFragmentSubscription = this.combinedDeletePlanSessionFragmentError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.deletePlanSessionFragmentSubscription?.unsubscribe();
            this.resetDeletePlanSessionFragmentComponentState();
          }
          return dialogActionObserver$;
        }),
        withLatestFrom(this.combinedDeletePlanSessionFragmentError$),
        tap(([dialogAction, processingError]) => {
          if (!dialogAction) {
            console.log('User canceled delete request');
            this.removePlanSessionFragmentIdQueryParamFromUrl();
          }
        }),
        filter(([dialogAction, processingError]) => !processingError && dialogAction),
        // Update the UI with the updated array of planSessionFragments
        tap(([dialogAction, processingError]) => {
          if (!updatesConfigured) {
            [planSessionFragmentUpdates, trainingPlanUpdates] = this.processLocalPlanSessionFragmentDeletionActions(selectedPlanSessionFragment, this.$localTrainingPlan()!);
            updatesConfigured = true;
          }
        }),
        switchMap(([dialogAction, processingError]) => {
          if (!this.$deletePlanSessionFragmentSubmitted()) {
            this.$deletePlanSessionFragmentSubmitted.set(true);
            this.store$.dispatch(PlanSessionFragmentStoreActions.deletePlanSessionFragmentRequested({trainingPlanId: trainingPlanId!, planSessionFragmentId}));
          }
          return this.deletePlanSessionFragmentProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(deleteProcessing => {
          if (deleteProcessing) {
            this.$deletePlanSessionFragmentCycleInit.set(true);
          }
          if (!deleteProcessing && this.$deletePlanSessionFragmentCycleInit()) {
            console.log('deletePlanSessionFragment successful, proceeding with pipe.');
            this.$deletePlanSessionFragmentCycleInit.set(false);
            this.$deletePlanSessionFragmentCycleComplete.set(true);
          }
        }),
        filter(deleteProcessing => !deleteProcessing && this.$deletePlanSessionFragmentCycleComplete()),
        switchMap((deleteProcessing) => {
          if (!this.$batchModifyPlanSessionFragmentsSubmitted()) {
            this.$batchModifyPlanSessionFragmentsSubmitted.set(true);
            this.store$.dispatch(PlanSessionFragmentStoreActions.batchModifyPlanSessionFragmentsRequested({trainingPlanId: trainingPlanId!, planSessionFragmentUpdates}));
          }
          return this.batchModifyPlanSessionFragmentsProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(batchModifyProcessing => {
          if (batchModifyProcessing) {
            this.$batchModifyPlanSessionFragmentsCycleInit.set(true);
          }
          if (!batchModifyProcessing && this.$batchModifyPlanSessionFragmentsCycleInit()) {
            console.log('batchModifyPlanSessionFragments successful, proceeding with pipe.');
            this.$batchModifyPlanSessionFragmentsCycleInit.set(false)
            this.$batchModifyPlanSessionFragmentsCycleComplete.set(true);
          }
        }),
        filter(batchModifyProcessing => !batchModifyProcessing && this.$batchModifyPlanSessionFragmentsCycleComplete()),
        switchMap((batchModifyProcessing) => {
          if (!this.$updateTrainingPlanSubmitted()) {
            this.$updateTrainingPlanSubmitted.set(true);
            this.store$.dispatch(TrainingPlanStoreActions.updateTrainingPlanRequested({trainingPlanUpdates}));
          }
          return this.updateTrainingPlanProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(updateProcessing => {
          if (updateProcessing) {
            this.$updateTrainingPlanCycleInit.set(true);
          }
          if (!updateProcessing && this.$updateTrainingPlanCycleInit()) {
            console.log('updateTrainingPlan successful, proceeding with pipe.');
            this.$updateTrainingPlanCycleInit.set(false)
            this.$updateTrainingPlanCycleComplete.set(true);
          }
        }),
        filter(updateProcessing => !updateProcessing && this.$updateTrainingPlanCycleComplete()),
        tap(updateProcessing => {
          console.log('All steps complete: 1) planSessionFragment deleted, 2) remaining planSessionFragments updated, 3) trainingPlan updated');
          this.deletePlanSessionFragmentSubscription?.unsubscribe();
          this.resetDeletePlanSessionFragmentComponentState();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 10000);
          this.deletePlanSessionFragmentSubscription?.unsubscribe();
          this.resetDeletePlanSessionFragmentComponentState();
          return throwError(() => new Error(error));
        })

      ).subscribe();

  }

  private processLocalPlanSessionFragmentDeletionActions(selectedPlanSessionFragment: PlanSessionFragment, trainingPlanData: TrainingPlan): [Update<PlanSessionFragment>[], Update<TrainingPlan>] {
    const indexOfItemToDelete = selectedPlanSessionFragment[PlanSessionFragmentKeys.TRAINING_PLAN_INDEX];
    const deletedPlanSessionFragmentPictureIsThumbnail = trainingPlanData.thumbnailUrlSmall === selectedPlanSessionFragment.videoData.thumbnailUrlSmall;

    // Step 1: Update the sessionPlan to account for the removed planSessionFragment

    // Decrement the trainingSessionCount in the trainingPlan since we're deleting an item
    let trainingPlanUpdates: Update<TrainingPlan> = {
      id: trainingPlanData.id,
      changes: {
        trainingSessionCount: trainingPlanData.trainingSessionCount - 1,
      }
    };

    // If the plan's current thumbnail matches the deleted item, add a new one using the first fragment in the queue (or second if the first is being deleted)
    if (deletedPlanSessionFragmentPictureIsThumbnail) {
      if (selectedPlanSessionFragment.trainingPlanIndex !== 0) {
        // If deleted fragment isn't the first, use the image from the first fragment
        trainingPlanUpdates = {
          ...trainingPlanUpdates,
          changes: {
            ...trainingPlanUpdates.changes,
            thumbnailUrlSmall: this.$localPlanSessionFragments()![0].videoData.thumbnailUrlSmall,
            thumbnailUrlLarge: this.$localPlanSessionFragments()![0].videoData.thumbnailUrlLarge,
          }
        };
      } else if (this.$localPlanSessionFragments()!.length > 1) {
        // If deleted fragment is the first, use the image from the second fragment
        trainingPlanUpdates = {
          ...trainingPlanUpdates,
          changes: {
          ...trainingPlanUpdates.changes,
          thumbnailUrlSmall: this.$localPlanSessionFragments()![1].videoData.thumbnailUrlSmall,
          thumbnailUrlLarge: this.$localPlanSessionFragments()![1].videoData.thumbnailUrlLarge,
          }
        }
      } else {
        // If this is the only fragment in the plan, revert to the no-image default
        trainingPlanUpdates = {
          ...trainingPlanUpdates,
          changes: {
          ...trainingPlanUpdates.changes,
          thumbnailUrlSmall: null,
          thumbnailUrlLarge: null,
          }
        }
      }
    }

    // Step 2: Update the planSessionFragment array in the UI

    // This does two things: 1) updates the local UI 2) prepares a batch update for the server database
    const planSessionFragmentUpdates = [] as Update<PlanSessionFragment>[]; // This will be used to send batch update to database
    this.$localPlanSessionFragments.update(planSessionFragments => {
      // Get a mutable array of planSessionFragments for current trainingPlan
      const updatedArray = [...planSessionFragments!];
      // Remove item from the array
      updatedArray.splice(indexOfItemToDelete, 1); 
      // Update the indexes of the remaining items

      updatedArray.forEach((planSessionFragment, index) => {
        const itemToUpdate = {...planSessionFragment};
        itemToUpdate[PlanSessionFragmentKeys.TRAINING_PLAN_INDEX] = index;
        updatedArray[index] = itemToUpdate;
        // If itemToUpdate matches the UI item of the same index, no update is necessary, so don't push to server
        if (itemToUpdate.id === this.$localPlanSessionFragments()![index].id) {
          return;
        }
        // Otherwise, create an update object and push it to the update array
        const altAffectedItemUpdateObject: Update<PlanSessionFragment> = {
          id: itemToUpdate.id,
          changes: {
            trainingPlanIndex: itemToUpdate.trainingPlanIndex
          }
        };
        planSessionFragmentUpdates.push(altAffectedItemUpdateObject);
      })
      return updatedArray; // This updated array will replace the UI's current array in the signal
    })

    return [planSessionFragmentUpdates, trainingPlanUpdates];
  }

  private resetDeletePlanSessionFragmentComponentState() {
    this.$deletePlanSessionFragmentSubmitted.set(false);
    this.$deletePlanSessionFragmentCycleInit.set(false);
    this.$deletePlanSessionFragmentCycleComplete.set(false);

    this.$batchModifyPlanSessionFragmentsSubmitted.set(false);
    this.$batchModifyPlanSessionFragmentsCycleInit.set(false);
    this.$batchModifyPlanSessionFragmentsCycleComplete.set(false);

    this.$updateTrainingPlanSubmitted.set(false);
    this.$updateTrainingPlanCycleInit.set(false);
    this.$updateTrainingPlanCycleComplete.set(false);

    this.removePlanSessionFragmentIdQueryParamFromUrl();
  }

  onDeleteTrainingPlan() {

    const trainingPlanId = this.$localTrainingPlanId()!;
    const planSessionFragmentIds = this.$localPlanSessionFragments()!.map(planSessionFragment => planSessionFragment.id); // Gather array of planSessionFragmentIds to delete

    const dialogConfig = new MatDialogConfig();
    const actionConfData: ActionConfData = {
      title: this.DELETE_TRAINING_PLAN_CONF_TITLE,
      body: this.DELETE_TRAINING_PLAN_CONF_BODY,
    };

    dialogConfig.data = actionConfData;
    
    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);

    const dialogActionObserver$: Observable<boolean> = dialogRef.afterClosed();

    this.deleteTrainingPlanSubscription = this.combinedDeleteTrainingPlanError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.deleteTrainingPlanSubscription?.unsubscribe();
            this.resetDeleteTrainingPlanComponentState();
          }
          return dialogActionObserver$;
        }),
        withLatestFrom(this.combinedDeleteTrainingPlanError$),
        tap(([dialogAction, processingError]) => {
          if (!dialogAction) {
            console.log('User canceled delete request');
          }
        }),
        filter(([dialogAction, processingError]) => !processingError && dialogAction),
        switchMap(([dialogAction, processingError]) => {
          if (!this.$deleteTrainingPlanSubmitted()) {
            this.$deleteTrainingPlanSubmitted.set(true);
            this.store$.dispatch(TrainingPlanStoreActions.deleteTrainingPlanRequested({trainingPlanId: trainingPlanId!}));
          }
          return this.deleteTrainingPlanProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(deleteProcessing => {
          if (deleteProcessing) {
            this.$deleteTrainingPlanCycleInit.set(true);
          }
          if (!deleteProcessing && this.$deleteTrainingPlanCycleInit()) {
            console.log('deleteTrainingPlan successful, proceeding with pipe.');
            this.$deleteTrainingPlanCycleInit.set(false);
            this.$deleteTrainingPlanCycleComplete.set(true);
          }
        }),
        filter(deleteProcessing => !deleteProcessing && this.$deleteTrainingPlanCycleComplete()),
        switchMap((deleteProcessing) => {
          if (!this.$batchDeletePlanSessionFragmentsSubmitted()) {
            this.$batchDeletePlanSessionFragmentsSubmitted.set(true);
            this.store$.dispatch(PlanSessionFragmentStoreActions.batchDeletePlanSessionFragmentsRequested({trainingPlanId: trainingPlanId!, planSessionFragmentIds}));
          }
          return this.batchDeletePlanSessionFragmentsProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(batchDeleteProcessing => {
          if (batchDeleteProcessing) {
            this.$batchDeletePlanSessionFragmentsCycleInit.set(true);
          }
          if (!batchDeleteProcessing && this.$batchDeletePlanSessionFragmentsCycleInit()) {
            console.log('batchDeletePlanSessionFragments successful, proceeding with pipe.');
            this.$batchDeletePlanSessionFragmentsCycleInit.set(false)
            this.$batchDeletePlanSessionFragmentsCycleComplete.set(true);
          }
        }),
        filter(batchDeleteProcessing => !batchDeleteProcessing && this.$batchDeletePlanSessionFragmentsCycleComplete()),
        tap(batchDeleteProcessing => {
          this.uiService.showSnackBar(`Training Plan deleted!`, 10000);
          this.router.navigate([PublicAppRoutes.BROWSE]);
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 10000);
          this.deleteTrainingPlanSubscription?.unsubscribe();
          this.resetDeleteTrainingPlanComponentState();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetDeleteTrainingPlanComponentState() {
    this.$deleteTrainingPlanSubmitted.set(false);
    this.$deleteTrainingPlanCycleInit.set(false);
    this.$deleteTrainingPlanCycleComplete.set(false);

    this.$batchDeletePlanSessionFragmentsSubmitted.set(false);
    this.$batchDeletePlanSessionFragmentsCycleInit.set(false);
    this.$batchDeletePlanSessionFragmentsCycleComplete.set(false);
  }

  ngOnDestroy(): void {
    this.combinedTrainingDataSubscription?.unsubscribe();
    this.createNewTrainingPlanSubscription?.unsubscribe();
    this.updateTrainingPlanSubscription?.unsubscribe();
    this.debounceDragDropServerCallSubscription?.unsubscribe();
    this.deletePlanSessionFragmentSubscription?.unsubscribe();
    this.autoDeletePlanSessionFragmentSubscription?.unsubscribe();
    this.deleteTrainingPlanSubscription?.unsubscribe();
    
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

  get title() { return this.trainingPlanForm.get(TrainingPlanKeys.TITLE) as FormControl<string>; }

}
