import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, Subscription, withLatestFrom, take, tap, switchMap, filter, of, catchError, throwError, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingPlanFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { AddTrainingSessionUrlParams, TrainingPlan, TrainingPlanFormVars, TrainingPlanKeys, TrainingPlanNoIdOrTimestamp, AddTrainingPlanUrlParamsKeys } from 'shared-models/train/training-plan.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { PlanSessionFragmentStoreActions, PlanSessionFragmentStoreSelectors, TrainingPlanStoreActions, TrainingPlanStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { Update } from '@ngrx/entity';
import { UiService } from 'src/app/core/services/ui.service';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PlanSessionFragment, PlanSessionFragmentKeys, ViewPlanSessionFragmentUrlParams } from 'shared-models/train/plan-session-fragment.model';
import { TrainingSessionDatabaseCategoryTypes } from 'shared-models/train/training-session.model';
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

  serverRequestProcessing$!: Observable<boolean>;
  batchRequestProcessing$!: Observable<boolean>;

  $currentTrainingPlan = signal(undefined as TrainingPlan | undefined);
  $currentTrainingPlanId = signal(undefined as string | undefined);
  private fetchSingleTrainingPlanProcessing$!: Observable<boolean>;
  private fetchSingleTrainingPlanError$!: Observable<{} | null>;
  private $singleTrainingPlanRequested = signal(false);

  allPlanSessionFragmentsInStore$!: Observable<PlanSessionFragment[]>; 
  $currentPlanSessionFragments = signal(undefined as PlanSessionFragment[] | undefined);
  private fetchAllPlanSessionFragmentsProcessing$!: Observable<boolean>;
  private fetchAllPlanSessionFragmentsError$!: Observable<{} | null>;
  private $planSessionFragmentsRequested = signal(false);
  private allPlanSessionFragmentsFetched$!: Observable<boolean>;

  private batchModifyPlanSessionFragmentsProcessing$!: Observable<boolean>;
  private batchModifyPlanSessionFragmentsError$!: Observable<{} | null>;
  
  private batchDeletePlanSessionFragmentsProcessing$!: Observable<boolean>;
  private batchDeletePlanSessionFragmentsError$!: Observable<{} | null>;

  combinedTrainingDataSubscription!: Subscription;
  fetchCombinedTrainingDataError$!: Observable<boolean>;

  $isNewPlan = signal(false);
  $editTrainingPlanDetails = signal(false);

  private debounceDragDropServerCall$ = new Subject<void>();
  private debounceDragDropServerCallSubscription!: Subscription;

  private store$ = inject(Store);
  private route = inject(ActivatedRoute);
  private uiService = inject(UiService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private deletePlanSessionFragmentError$!: Observable<{} | null>;
  deletePlanSessionFragmentProcessing$!: Observable<boolean>;
  
  constructor() { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.configureTrainingPlanInterface();
    this.initializeDebounceDragDropServerCallObserver();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;

    this.batchModifyPlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectBatchModifyPlanSessionFragmentsError);
    this.batchModifyPlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectBatchModifyPlanSessionFragmentsProcessing);
    
    this.batchDeletePlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectBatchDeletePlanSessionFragmentsError);
    this.batchDeletePlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectBatchDeletePlanSessionFragmentsProcessing);

    this.createTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectCreateTrainingPlanError);
    this.createTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectCreateTrainingPlanProcessing);

    this.deletePlanSessionFragmentError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectDeletePlanSessionFragmentError);
    this.deletePlanSessionFragmentProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectDeletePlanSessionFragmentProcessing);

    this.updateTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectUpdateTrainingPlanError);
    this.updateTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectUpdateTrainingPlanProcessing);

    this.fetchSingleTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanError);
    this.fetchSingleTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanProcessing);

    this.allPlanSessionFragmentsFetched$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsFetched); // We use this to determine if the initial empty array returned when the store is fetched is a pre-loaded state or the actual state
    this.allPlanSessionFragmentsInStore$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectAllPlanSessionFragmentsInStore); // Used to contrast the server version against the local version for debounce purposes
    
    this.fetchAllPlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsError);
    this.fetchAllPlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsProcessing);

    this.serverRequestProcessing$ = combineLatest(
      [
        this.createTrainingPlanProcessing$,
        this.updateTrainingPlanProcessing$,
        this.fetchSingleTrainingPlanProcessing$,
        this.fetchAllPlanSessionFragmentsProcessing$,
        this.batchDeletePlanSessionFragmentsProcessing$,
        this.batchModifyPlanSessionFragmentsProcessing$
      ]
    ).pipe(
        map(([
          creatingTrainingPlan, 
          updatingTrainingPlan, 
          fetchSingleTrainingPlanProcessing, 
          fetchAllPlanSessionFragmentProcessing,
          batchDeletePlanSessionFragmentsProcessing,
          batchModifyPlanSessionFragmentsProcessing,
        ]) => {
          if (
            creatingTrainingPlan || 
            updatingTrainingPlan || 
            fetchSingleTrainingPlanProcessing || 
            fetchAllPlanSessionFragmentProcessing ||
            batchDeletePlanSessionFragmentsProcessing ||
            batchModifyPlanSessionFragmentsProcessing
            ) {
            return true;
          }
          return false;
        })
      );

    this.batchRequestProcessing$ = combineLatest(
      [
        this.batchDeletePlanSessionFragmentsProcessing$,
        this.batchModifyPlanSessionFragmentsProcessing$
      ]
    ).pipe(
        map(([
          batchDeletePlanSessionFragmentsProcessing,
          batchModifyPlanSessionFragmentsProcessing,
        ]) => {
          if (
            batchDeletePlanSessionFragmentsProcessing ||
            batchModifyPlanSessionFragmentsProcessing
            ) {
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
        map(([fetchPlanError, fetchSessionsError]) => {
          if (fetchPlanError || fetchSessionsError) {
            return true;
          }
          return false;
        })
      );

  }

  private configureTrainingPlanInterface(): void {
    this.setTrainingPlanId();
    const trainingPlanId = this.$currentTrainingPlanId();
    trainingPlanId ? this.patchExistingDataIntoForm(trainingPlanId) : this.configureNewPlan();
  }

  private configureNewPlan() {
    this.$isNewPlan.set(true);
    this.$editTrainingPlanDetails.set(true);
  }

  private setTrainingPlanId() {
    const trainingPlanId = this.route.snapshot.params[TrainingPlanKeys.ID] as string | undefined;
    if (trainingPlanId) {
      this.$currentTrainingPlanId.set(trainingPlanId);
    }
  }

  private patchExistingDataIntoForm(trainingPlanId: string) {
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
          this.$currentTrainingPlan.set(trainingPlan!); // Load the current trainingPlan into the instance variable
          console.log('Set currentTrainingPlan', this.$currentTrainingPlan());
          this.title.setValue(trainingPlan!.title); // Update the form title
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
            const trainingPlanNoId: TrainingPlanNoIdOrTimestamp = {
              creatorId: userData.id,
              [TrainingPlanKeys.TITLE]: this.title.value,
              trainingSessionCount: 0
            };
            console.log('trainingPlan Data', trainingPlanNoId);
            this.store$.dispatch(TrainingPlanStoreActions.createTrainingPlanRequested({trainingPlanNoId}));
            this.$createTrainingPlanSubmitted.set(true);
          }
          const newTrainingPlanId = this.store$.select(TrainingPlanStoreSelectors.selectNewTrainingPlanId);
          return newTrainingPlanId;
        }),
        withLatestFrom(this.createTrainingPlanProcessing$),
        filter(([createTrainingPlanProcessing, newTrainingPlanId]) => !!newTrainingPlanId && !createTrainingPlanProcessing),
        tap(([createTrainingPlanProcessing, newTrainingPlanId]) => {
          console.log('trainingPlan creation successful.');
          this.uiService.showSnackBar(`Plan Created!`, 5000);
          this.store$.dispatch(TrainingPlanStoreActions.purgeNewTrainingPlanId()); // Clears this out of working memory since it isn't needed anymore
          this.router.navigate([PublicAppRoutes.TRAINING_PLAN_EDIT, newTrainingPlanId!]); // Switches mode from createTrainingPlan to editTrainingPlan 
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
    const trainingPlanId = this.$currentTrainingPlanId();
    this.updateTrainingPlanSubscription = this.updateTrainingPlanError$
    .pipe(
      map(processingError => {
        if (processingError) {
          console.log('processingError detected, terminating dialog');
          this.$updateTrainingPlanSubmitted.set(false);
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
          console.log('trainingPlan Updates to submit', updatedTrainingPlan);
          this.store$.dispatch(TrainingPlanStoreActions.updateTrainingPlanRequested({trainingPlanUpdates: updatedTrainingPlan}));
          this.$updateTrainingPlanSubmitted.set(true);
        }
        return this.updateTrainingPlanProcessing$;
      }),
      filter(updateProcessing => !updateProcessing && this.$updateTrainingPlanSubmitted()),
      tap(updateProcessing => {
        console.log('trainingPlan update successful.');
        this.uiService.showSnackBar(`Training Plan updated!`, 5000);
        this.updateTrainingPlanSubscription?.unsubscribe();
        this.$editTrainingPlanDetails.set(false);
      }),
      // Catch any local errors
      catchError(error => {
        console.log('Error in component:', error);
        this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
        this.$updateTrainingPlanSubmitted.set(false);
        return throwError(() => new Error(error));
      })
    ).subscribe();
   
  }

  onNavigateUserToBrowse(): void {
    this.router.navigate([PublicAppRoutes.BROWSE]);
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
      this.title.setValue(this.$currentTrainingPlan()!.title);
    }
  }

  onAddTrainingSession(trainingPlanId: string | undefined) {
    if (!trainingPlanId) {
      return;
    }

    const queryParams: AddTrainingSessionUrlParams = {
      [AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: true,
      [AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_ID]: trainingPlanId
    }

    const navigationExtras: NavigationExtras = {
      queryParams
    };

    this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
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

  onListItemDrop(event: CdkDragDrop<PlanSessionFragment[]>) {
    
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    // Do nothing if no change in index;
    if (previousIndex === currentIndex) {
      return;
    }

    // Update the signal locally in real-time
    this.$currentPlanSessionFragments.update(planSessessionFragments => {
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
        debounceTime(3000), // Determines how frequently updates are sent to the server
        withLatestFrom(this.allPlanSessionFragmentsInStore$),
        switchMap(([empty, serverPlanSessionFragments]) => {
          return of(this.buildAndDispatchReorderRequest(serverPlanSessionFragments));
        })
      ).subscribe();
  }

  private buildAndDispatchReorderRequest(serverPlanSessionFragments: PlanSessionFragment[]) {
    // Filter the serverPlanSessionFragments for the currrent plan
    const trainingPlanId = this.$currentTrainingPlanId();
    const filteredServerFragments = (serverPlanSessionFragments).filter(fragment => fragment.trainingPlanId === trainingPlanId!);

    // Build an array of server updates that only updates the items that have changed
    const planSessionFragmentUpdates = [] as Update<PlanSessionFragment>[]; // This will be used to send batch update to database
    this.$currentPlanSessionFragments()?.forEach((itemToUpdate, index) => {
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

  onDeletePlanSessionFragment(selectedPlanSessionFragment: PlanSessionFragment, trainingPlan: TrainingPlan | undefined) {
    const dialogConfig = new MatDialogConfig();
    const actionConfData: ActionConfData = {
      title: this.REMOVE_TRAINING_SESSION_CONF_TITLE,
      body: this.REMOVE_TRAINING_SESSION_CONF_BODY,
    };

    dialogConfig.data = actionConfData;
    
    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);

    dialogRef.afterClosed()
      .pipe(
        take(1),
        tap(confirmed => {
          if (!confirmed) {
            console.log('Deletion requestion canceled');
            return;
          }
          const trainingPlanId = this.$currentTrainingPlanId();
          const planSessionFragmentId = selectedPlanSessionFragment.id;
          const trainingPlanData = trainingPlan as TrainingPlan;
          const indexOfItemToDelete = selectedPlanSessionFragment[PlanSessionFragmentKeys.TRAINING_PLAN_INDEX];
          const deletedPlanSessionFragmentPictureIsThumbnail = trainingPlanData.thumbnailUrlSmall === selectedPlanSessionFragment.videoData.thumbnailUrlSmall;
      
          // Step 1: Update the sessionPlan to account for the removed planSessionFragment

          // Decrement the trainingSessionCount in the trainingPlan since we're deleting an item
          let trainingPlanUpdates: Update<TrainingPlan> = {
            id: trainingPlanId!,
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
                  thumbnailUrlSmall: this.$currentPlanSessionFragments()![0].videoData.thumbnailUrlSmall,
                  thumbnailUrlLarge: this.$currentPlanSessionFragments()![0].videoData.thumbnailUrlLarge,
                }
              };
            } else if (this.$currentPlanSessionFragments()!.length > 1) {
              // If deleted fragment is the first, use the image from the second fragment
              trainingPlanUpdates = {
                ...trainingPlanUpdates,
                changes: {
                ...trainingPlanUpdates.changes,
                thumbnailUrlSmall: this.$currentPlanSessionFragments()![1].videoData.thumbnailUrlSmall,
                thumbnailUrlLarge: this.$currentPlanSessionFragments()![1].videoData.thumbnailUrlLarge,
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

          // Step 2: Update the planSessionFragment array in the UI and the server

          // This does two things: 1) updates the local UI 2) prepares a batch update for the server database
          const planSessionFragmentUpdates = [] as Update<PlanSessionFragment>[]; // This will be used to send batch update to database
          this.$currentPlanSessionFragments.update(planSessionFragments => {
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
              if (itemToUpdate.id === this.$currentPlanSessionFragments()![index].id) {
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
          
          // Dispatch all requests to database
          this.store$.dispatch(PlanSessionFragmentStoreActions.deletePlanSessionFragmentRequested({trainingPlanId: trainingPlanId!, planSessionFragmentId}));
          this.store$.dispatch(PlanSessionFragmentStoreActions.batchModifyPlanSessionFragmentsRequested({trainingPlanId: trainingPlanId!, planSessionFragmentUpdates}));
          this.store$.dispatch(TrainingPlanStoreActions.updateTrainingPlanRequested({trainingPlanUpdates}));
        })
      )
    .subscribe();
  }

  onDeleteTrainingPlan() {
    const dialogConfig = new MatDialogConfig();
    const actionConfData: ActionConfData = {
      title: this.DELETE_TRAINING_PLAN_CONF_TITLE,
      body: this.DELETE_TRAINING_PLAN_CONF_BODY,
    };

    dialogConfig.data = actionConfData;
    
    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);

    dialogRef.afterClosed()
      .pipe(
        take(1),
        tap(confirmed => {
          if (confirmed) {
            const trainingPlanId = this.$currentTrainingPlanId();
            const planSessionFragmentIds = this.$currentPlanSessionFragments()!.map(planSessionFragment => planSessionFragment.id); // Gather array of planSessionFragmentIds to delete
            this.store$.dispatch(TrainingPlanStoreActions.deleteTrainingPlanRequested({trainingPlanId: trainingPlanId!})); // Delete trainingPlan
            if (planSessionFragmentIds.length > 0) {
              this.store$.dispatch(PlanSessionFragmentStoreActions.batchDeletePlanSessionFragmentsRequested({trainingPlanId: trainingPlanId!, planSessionFragmentIds})); // Batch delete all the associated fragments
            }
            this.onNavigateUserToBrowse();
          }
        })
      )
    .subscribe();
  }

  ngOnDestroy(): void {
    this.combinedTrainingDataSubscription?.unsubscribe();
    this.createNewTrainingPlanSubscription?.unsubscribe();
    this.updateTrainingPlanSubscription?.unsubscribe();
    this.debounceDragDropServerCallSubscription?.unsubscribe();
    
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
