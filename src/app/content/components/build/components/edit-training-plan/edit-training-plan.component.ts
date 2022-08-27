import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, Subscription, withLatestFrom, take, tap, Subject, takeUntil } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingPlanFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { AddTrainingSessionUrlParams, TrainingPlan, TrainingPlanForm, TrainingPlanFormVars, TrainingPlanKeys, TrainingPlanNoIdOrTimestamp, AddTrainingPlanUrlParamsKeys } from 'shared-models/train/training-plan.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { PlanSessionFragmentStoreActions, PlanSessionFragmentStoreSelectors, RootStoreState, TrainingPlanStoreActions, TrainingPlanStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { Update } from '@ngrx/entity';
import { UiService } from 'src/app/core/services/ui.service';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PlanSessionFragment, ViewPlanSessionFragmentUrlParams } from 'shared-models/train/plan-session-fragment.model';
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
  trainingPlanForm = new FormGroup<TrainingPlanForm>({
    [TrainingPlanKeys.TITLE]: new FormControl('', [Validators.required, Validators.minLength(this.TITLE_MIN_LENGTH), Validators.maxLength(this.TITLE_MAX_LENGTH)]),
  });

  userDataSubscription!: Subscription;
  userData$!: Observable<PublicUser>;

  createTrainingPlanProcessing$!: Observable<boolean>;
  createTrainingPlanSubscription!: Subscription;
  createTrainingPlanError$!: Observable<{} | null>;
  createTrainingPlanSubmitted!: boolean;

  updateTrainingPlanProcessing$!: Observable<boolean>;
  updateTrainingPlanSubscription!: Subscription;
  updateTrainingPlanError$!: Observable<{} | null>;
  updateTrainingPlanSubmitted!: boolean;

  serverRequestProcessing$!: Observable<boolean>;

  existingTrainingPlanData$!: Observable<TrainingPlan | undefined>;
  fetchSingleTrainingPlanProcessing$!: Observable<boolean>;
  fetchSingleTrainingPlanError$!: Observable<{} | null>;
  singleTrainingPlanRequested!: boolean;

  planSessionFragmentData$!: Observable<PlanSessionFragment[]>;
  fetchAllPlanSessionFragmentsProcessing$!: Observable<boolean>;
  fetchAllPlanSessionFragmentsError$!: Observable<{} | null>;
  planSessionFragmentsRequested!: boolean;

  combinedTrainingPlanAndPlanSessionFragmentData$!: Observable<{trainingPlan: TrainingPlan | undefined, planSessionFragments: PlanSessionFragment[]}>;
  localPlanSessionFragments!: PlanSessionFragment[]; // Used to manage optimistic reordering in the UI (vs waiting for updates in databse)

  isNewPlan = true;
  editTrainingPlanDetails!: boolean;

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private route: ActivatedRoute,
    private uiService: UiService,
    private router: Router,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.monitorProcesses();
    this.checkIfNewPlan();
    
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectUserData) as Observable<PublicUser>;

    this.createTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectCreateTrainingPlanProcessing);
    this.createTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectCreateTrainingPlanError);

    this.updateTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectUpdateTrainingPlanProcessing);
    this.updateTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectUpdateTrainingPlanError);

    this.fetchSingleTrainingPlanProcessing$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanProcessing);
    this.fetchSingleTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanError);

    this.fetchAllPlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsProcessing);
    this.fetchAllPlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsError);

    this.serverRequestProcessing$ = combineLatest(
      [
        this.createTrainingPlanProcessing$,
        this.updateTrainingPlanProcessing$,
        this.fetchSingleTrainingPlanProcessing$,
        this.fetchAllPlanSessionFragmentsProcessing$
      ]
    ).pipe(
        map(([creatingTrainingPlan, updatingTrainingPlan, fetchSingleTrainingPlanProcessing, fetchAllPlanSessionFragmentProcessing]) => {
          if (creatingTrainingPlan || updatingTrainingPlan || fetchSingleTrainingPlanProcessing || fetchAllPlanSessionFragmentProcessing) {
            return true
          }
          return false
        })
    );
    
  }

  private checkIfNewPlan(): void {
    const trainingPlanId = this.getExistingTrainingPlanId();
    this.isNewPlan = !trainingPlanId;
    if (this.isNewPlan) {
      this.editTrainingPlanDetails = true;
    } 
    if (trainingPlanId) {
      this.patchExistingDataIntoForm(trainingPlanId);
    }
  }

  private getExistingTrainingPlanId(): string | null {
    const idParamName = 'id';
    const trainingPlanId = this.route.snapshot.params[idParamName];
    if (trainingPlanId) {
      return trainingPlanId
    }
    return null;
  }

  private patchExistingDataIntoForm(trainingPlanId: string) {
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
        tap(trainingPlan => {
          if (trainingPlan) {
            this.title.setValue(trainingPlan.title);
          }
        })
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
        }),
        tap(planSessionFragments => {
          if (planSessionFragments) {
            this.localPlanSessionFragments = planSessionFragments;
          }
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

  // This reveales the plan details form
  onEditTrainingPlanDetails() {
    this.editTrainingPlanDetails = true;
  }

  onSubmitTrainingPlanForm(): void {

    console.log('Submit trainingPlanForm detected');

    if (this.isNewPlan) {
      this.createNewTrainingPlan();
    } else {
      this.updateExistingTrainingPlan();
    }
  }

  private createNewTrainingPlan() {
    this.userDataSubscription = this.userData$
      .subscribe(userData => {
        const trainingPlanNoId: TrainingPlanNoIdOrTimestamp = {
          creatorId: userData.id,
          [TrainingPlanKeys.TITLE]: this.title.value,
          trainingSessionCount: 0
        };
        console.log('trainingPlan Data', trainingPlanNoId);
        this.store$.dispatch(TrainingPlanStoreActions.createTrainingPlanRequested({trainingPlanNoId}));
        this.postCreateTrainingPlanActions();
      })
  }

  private updateExistingTrainingPlan() {
    const trainingPlanId = this.getExistingTrainingPlanId() as string;
    this.store$.select(TrainingPlanStoreSelectors.selectTrainingPlanById(trainingPlanId))
      .pipe(take(1))
      .subscribe(trainingPlan => {
        if (trainingPlan) {
          const updatedTrainingPlan: Update<TrainingPlan> = {
            id: trainingPlan.id,
            changes: {
              [TrainingPlanKeys.TITLE]: this.title.value,
            }            
          };
          console.log('trainingPlan Updates', updatedTrainingPlan);
          this.store$.dispatch(TrainingPlanStoreActions.updateTrainingPlanRequested({trainingPlanUpdates: updatedTrainingPlan}));
          this.postUpdateTrainingPlanActions();
        }
      })
  }

  private postCreateTrainingPlanActions() {
    this.createTrainingPlanSubscription = this.createTrainingPlanProcessing$
      .pipe(
        withLatestFrom(
          this.createTrainingPlanError$,
          this.store$.select(TrainingPlanStoreSelectors.selectNewTrainingPlanId)
        ),
      )
      .subscribe(([creatingTrainingPlan, creationError, newTrainingPlanId]) => {
        if (creatingTrainingPlan) {
          this.createTrainingPlanSubmitted = true;
        }

        if (creationError) {
          console.log('Error creating training plan in database, terminating function');
          this.createTrainingPlanSubscription.unsubscribe();
          this.createTrainingPlanSubmitted = false;
          return;
        }

        if (!creatingTrainingPlan && this.createTrainingPlanSubmitted) {
          console.log('trainingPlan creation successful.');
          this.uiService.showSnackBar(`Plan Created!`, 5000);
          this.createTrainingPlanSubscription.unsubscribe();
          this.editTrainingPlanDetails = false;
          if (newTrainingPlanId) {
            this.store$.dispatch(TrainingPlanStoreActions.purgeNewTrainingPlanId());
            this.navigateUserToEditTrainingPlan(newTrainingPlanId); 
          }
        }
      })
  }

  private postUpdateTrainingPlanActions() {
    this.updateTrainingPlanSubscription = this.updateTrainingPlanProcessing$
      .pipe(
        withLatestFrom(this.updateTrainingPlanError$)
      )
      .subscribe(([updatingTrainingPlan, updateError]) => {
        if (updatingTrainingPlan) {
          this.updateTrainingPlanSubmitted = true;
        }

        if (updateError) {
          console.log('Error updating training plan in database, terminating function');
          this.updateTrainingPlanSubscription.unsubscribe();
          this.updateTrainingPlanSubmitted = false;
          return;
        }

        if (!updatingTrainingPlan && this.updateTrainingPlanSubmitted) {
          console.log('trainingPlan update successful.');
          this.uiService.showSnackBar(`trainingPlan updated!`, 5000);
          this.updateTrainingPlanSubscription.unsubscribe();
          this.editTrainingPlanDetails = false;
        }
      })

  }

  // Navigates user to same page with the edit URL and id parameters active
  navigateUserToEditTrainingPlan(trainingPlanId: string): void {
    this.router.navigate([PublicAppRoutes.TRAINING_PLAN_EDIT, trainingPlanId]);
  }

  onNavigateUserToBrowse(): void {
    this.router.navigate([PublicAppRoutes.BROWSE]);
  }

  onCancelTitleUpdate() {
    if (this.isNewPlan) {
      this.uiService.routeUserToPreviousPage();
    } else {
      // Hide the title editing interface
      this.editTrainingPlanDetails = false;
      // If any edits were made, revert to original title value
      this.existingTrainingPlanData$
        .pipe(take(1))
        .subscribe(trainingPlan => {
          if (trainingPlan) {
            this.title.setValue(trainingPlan.title)
          }
        })
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
    const tempPlanSessionFragmentList = [...this.localPlanSessionFragments];
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    // Do nothing if no change in index;
    if (previousIndex === currentIndex) {
      return;
    }

    const planSessionFragmentUpdates = [] as Update<PlanSessionFragment>[]; // This will be used to send batch update to database

    // Part 1
    // Move item in local array and update trainingPlanIndex
    // Basic splice/move logic courtesy of https://stackoverflow.com/a/6470794/6572208
    const itemToMove = tempPlanSessionFragmentList[previousIndex]; // Fetch item to move
    tempPlanSessionFragmentList.splice(previousIndex, 1); // Remove item from the array
    const itemWithUpdatedIndex = {...itemToMove}; // Create a mutatable copy of item
    itemWithUpdatedIndex.trainingPlanIndex = currentIndex; // Update item index
    tempPlanSessionFragmentList.splice(currentIndex, 0, itemWithUpdatedIndex); // Insert updated item in new position

    // Create item update object to push to database
    const itemUpdateObject: Update<PlanSessionFragment> = {
      id: itemWithUpdatedIndex.id,
      changes: {
        trainingPlanIndex: itemWithUpdatedIndex.trainingPlanIndex
      }
    };
    planSessionFragmentUpdates.push(itemUpdateObject); // Push the item update object to the update array

    // Part 2
    // Once the item has been moved and updated, then update all the other affected items between the previous index and the current index
    const indexChangeSize = (currentIndex - previousIndex);
    const itemMovedDown = indexChangeSize > 0;
    const qtyOfOtherAffectedItems = itemMovedDown ? indexChangeSize : (indexChangeSize * -1);
    
    // Start loop either at the previous location of the moved item (if item moved down the list) or at the location of the next item (if moved up the list)
    const startingIndex = itemMovedDown ? previousIndex : currentIndex + 1; 
    // End loop either at the affected item count after the previous location of the item (if item moved down the list) or that count after the new location of the moved item (if moved up the list)
    const endingIndex = itemMovedDown ? previousIndex + qtyOfOtherAffectedItems : startingIndex + qtyOfOtherAffectedItems; 

    // Initiate the loop to update the affected items
    for (let i = startingIndex; i < endingIndex; i++) {
      const affectedItemToUpdate: PlanSessionFragment = {...tempPlanSessionFragmentList[i]}; // Create a mutateable copy
      const affectedItemId = affectedItemToUpdate.id;
      affectedItemToUpdate.trainingPlanIndex = i; // Set the trainingPlanIndex value to match the array index
      tempPlanSessionFragmentList.splice(i, 1, affectedItemToUpdate); // Swap updated item into local array (removing original item)
      
      // Create item update object to push to database
      const affectedItemUpdateObject: Update<PlanSessionFragment> = {
        id: affectedItemId,
        changes: {
          trainingPlanIndex: affectedItemToUpdate.trainingPlanIndex
        }
      };
      planSessionFragmentUpdates.push(affectedItemUpdateObject); // Push the item update object to the update array
    }

    // Part 3
    // Update the local array for the UI
    this.localPlanSessionFragments = tempPlanSessionFragmentList; 
    // Dispatch updates to database
    const trainingPlanId = this.getExistingTrainingPlanId() as string;
    this.store$.dispatch(PlanSessionFragmentStoreActions.batchModifyPlanSessionFragmentsRequested({trainingPlanId, planSessionFragmentUpdates}));
  }

  onDeletePlanSessionFragment(selectedPlanSessionFragment: PlanSessionFragment, trainingPlan: TrainingPlan | undefined) {

    const dialogConfig = new MatDialogConfig();
    const actionConfData: ActionConfData = {
      title: this.REMOVE_TRAINING_SESSION_CONF_TITLE,
      body: this.REMOVE_TRAINING_SESSION_CONF_BODY,
    };

    dialogConfig.data = actionConfData;
    
    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const trainingPlanId = this.getExistingTrainingPlanId() as string;
        const planSessionFragmentId = selectedPlanSessionFragment.id;
        const trainingPlanData = trainingPlan as TrainingPlan;
        const deletedPlanSessionFragmentPictureIsThumbnail = trainingPlanData.thumbnailUrlSmall === selectedPlanSessionFragment.videoData.thumbnailUrlSmall;
    
        // Update the training plan count
        let trainingPlanUpdates: Update<TrainingPlan> = {
          id: trainingPlanId,
          changes: {
            trainingSessionCount: trainingPlanData.trainingSessionCount - 1,
          }
        };
    
        // If the plan's current thumbnail matches the deleted item, add a new one using the first plan in the queue (or second if the first is being deleted)
        if (deletedPlanSessionFragmentPictureIsThumbnail) {
          if (selectedPlanSessionFragment.trainingPlanIndex !== 0) {
            trainingPlanUpdates = {
              ...trainingPlanUpdates,
              changes: {
                ...trainingPlanUpdates.changes,
                thumbnailUrlSmall: this.localPlanSessionFragments[0].videoData.thumbnailUrlSmall,
                thumbnailUrlLarge: this.localPlanSessionFragments[0].videoData.thumbnailUrlLarge,
              }
            };
          } else if (this.localPlanSessionFragments.length > 1) {
            trainingPlanUpdates = {
              ...trainingPlanUpdates,
              changes: {
              ...trainingPlanUpdates.changes,
              thumbnailUrlSmall: this.localPlanSessionFragments[1].videoData.thumbnailUrlSmall,
              thumbnailUrlLarge: this.localPlanSessionFragments[1].videoData.thumbnailUrlLarge,
              }
            }
          } else {
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
    
        // Update the remaining trainingPlanIndexes
        const planSessionFragmentUpdates = [] as Update<PlanSessionFragment>[]; // This will be used to send batch update to database
    
        // Part 1
        // Remove item from local array
        const tempPlanSessionFragmentList = [...this.localPlanSessionFragments];
        const indexOfItemToDelete = selectedPlanSessionFragment.trainingPlanIndex;
        tempPlanSessionFragmentList.splice(indexOfItemToDelete, 1); // Remove item from the array
    
        // Part 2
        // Once the item has been removed, update all the other affected items between the previous index and the current index (if they exist)
        
        if (this.localPlanSessionFragments.length > 1) {
          // Start loop either at the previous location of the moved item (if item moved down the list) or at the location of the next item (if moved up the list)
          const startingIndex = indexOfItemToDelete; 
          // End loop either at the affected item count after the previous location of the item (if item moved down the list) or that count after the new location of the moved item (if moved up the list)
          const endingIndex = tempPlanSessionFragmentList.length - indexOfItemToDelete;
    
          // Initiate the loop to update the affected items
          for (let i = startingIndex; i < endingIndex; i++) {
            const affectedItemToUpdate: PlanSessionFragment = {...tempPlanSessionFragmentList[i]}; // Create a mutateable copy
            const affectedItemId = affectedItemToUpdate.id;
            affectedItemToUpdate.trainingPlanIndex = i; // Set the trainingPlanIndex value to match the array index
            tempPlanSessionFragmentList.splice(i, 1, affectedItemToUpdate); // Swap updated item into local array (removing original item)
            
            // Create item update object to push to database
            const affectedItemUpdateObject: Update<PlanSessionFragment> = {
              id: affectedItemId,
              changes: {
                trainingPlanIndex: affectedItemToUpdate.trainingPlanIndex
              }
            };
            planSessionFragmentUpdates.push(affectedItemUpdateObject); // Push the item update object to the update array
          }
    
          // Part 3
          // Update the local array for the UI
          this.localPlanSessionFragments = tempPlanSessionFragmentList; 
        }
    
        // Dispatch all requests to database
        this.store$.dispatch(PlanSessionFragmentStoreActions.deletePlanSessionFragmentRequested({trainingPlanId, planSessionFragmentId}));
        this.store$.dispatch(PlanSessionFragmentStoreActions.batchModifyPlanSessionFragmentsRequested({trainingPlanId, planSessionFragmentUpdates}));
        this.store$.dispatch(TrainingPlanStoreActions.updateTrainingPlanRequested({trainingPlanUpdates}));
      }
    });
  }

  onDeleteTrainingPlan() {
    const dialogConfig = new MatDialogConfig();
    const actionConfData: ActionConfData = {
      title: this.DELETE_TRAINING_PLAN_CONF_TITLE,
      body: this.DELETE_TRAINING_PLAN_CONF_BODY,
    };

    dialogConfig.data = actionConfData;
    
    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const trainingPlanId = this.getExistingTrainingPlanId() as string;
        const planSessionFragmentIds = this.localPlanSessionFragments.map(planSessionFragment => planSessionFragment.id);
        this.store$.dispatch(TrainingPlanStoreActions.deleteTrainingPlanRequested({trainingPlanId}));
        this.store$.dispatch(PlanSessionFragmentStoreActions.batchDeletePlanSessionFragmentsRequested({trainingPlanId, planSessionFragmentIds}));
        this.onNavigateUserToBrowse();
      }
    });
  }

  ngOnDestroy(): void {
    
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }

    if (this.createTrainingPlanSubscription) {
      this.createTrainingPlanSubscription.unsubscribe();
    }

    if (this.updateTrainingPlanSubscription) {
      this.updateTrainingPlanSubscription.unsubscribe();
    }
  }

  get title() { return this.trainingPlanForm.get(TrainingPlanKeys.TITLE) as FormControl<string>; }

}
