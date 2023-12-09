import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { Observable, Subject, Subscription, catchError, combineLatest, debounceTime, filter, map, of, switchMap, take, tap, throwError, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { ActionConfData } from 'shared-models/forms/action-conf-data.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { DeletePersonalSessionFragmentUrlParamsKeys, PersonalSessionFragment, PersonalSessionFragmentKeys, ViewPersonalSessionFragmentQueryParams, ViewPersonalSessionFragmentQueryParamsKeys } from 'shared-models/train/personal-session-fragment.model';
import { TrainingSessionDatabaseCategoryTypes, BrowseTrainingSessionsQueryParams, BrowseTrainingSessionsQueryParamsKeys } from 'shared-models/train/training-session.model';
import { DialogueBoxDefaultConfig } from 'shared-models/user-interface/dialogue-box-default-config.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UiService } from 'src/app/core/services/ui.service';
import { PersonalSessionFragmentStoreActions, PersonalSessionFragmentStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { ActionConfirmDialogueComponent } from 'src/app/shared/components/action-confirm-dialogue/action-confirm-dialogue.component';

@Component({
  selector: 'app-edit-personal-queue',
  templateUrl: './edit-personal-queue.component.html',
  styleUrls: ['./edit-personal-queue.component.scss']
})
export class EditPersonalQueueComponent implements OnInit, OnDestroy {

  BACK_TO_DASHBOARD_BUTTON_VALUE = GlobalFieldValues.BACK_TO_DASHBOARD;
  BROWSE_TRAINING_PLANS_BUTTON_VALUE = GlobalFieldValues.BROWSE_TRAINING_PLANS;
  CLEAR_PERSONAL_QUEUE_BUTTON_VALUE = GlobalFieldValues.CLEAR_PERSONAL_QUEUE_CONF_TITLE;
  CLEAR_PERSONAL_QUEUE_CONF_BODY = GlobalFieldValues.CLEAR_PERSONAL_QUEUE_CONF_BODY;
  CLEAR_PERSONAL_QUEUE_CONF_TITLE = GlobalFieldValues.CLEAR_PERSONAL_QUEUE_CONF_TITLE;
  QUEUE_IS_EMPTY_BLURB = GlobalFieldValues.QUEUE_IS_EMPTY;
  REMOVE_PERSONAL_SESSION_FRAGMENT_CONF_BODY = GlobalFieldValues.REMOVE_PERSONAL_SESSION_FRAGMENT_CONF_BODY;
  REMOVE_PERSONAL_SESSION_FRAGMENT_CONF_TITLE = GlobalFieldValues.REMOVE_PERSONAL_SESSION_FRAGMENT_CONF_TITLE;
  
  private userData$!: Observable<PublicUser>;

  private $fetchPersonalSessionFragmentsSubmitted = signal(false);
  $localPersonalSessionFragments = signal(undefined as PersonalSessionFragment[] | undefined);
  private allPersonalSessionFragmentsFetched$!: Observable<boolean>;
  private allPersonalSessionFragmentsInStore$!: Observable<PersonalSessionFragment[]>;
  fetchAllPersonalSessionFragmentsProcessing$!: Observable<boolean>;
  private fetchAllPersonalSessionFragmentsError$!: Observable<{} | null>;
  private fetchPersonalSessionFragmentsSubscription!: Subscription;

  private $batchModifyPersonalSessionFragmentsSubmitted = signal(false);
  private $batchModifyPersonalSessionFragmentsCycleInit = signal(false);
  private $batchModifyPersonalSessionFragmentsCycleComplete = signal(false);
  private batchModifyPersonalSessionFragmentsProcessing$!: Observable<boolean>;
  private batchModifyPersonalSessionFragmentsError$!: Observable<{} | null>;

  $batchDeletePersonalSessionFragmentsSubmitted = signal(false);
  private $batchDeletePersonalSessionFragmentsCycleInit = signal(false);
  private $batchDeletePersonalSessionFragmentsCycleComplete = signal(false);
  private batchDeletePersonalSessionFragmentsProcessing$!: Observable<boolean>;
  private batchDeletePersonalSessionFragmentsError$!: Observable<{} | null>;
  private batchDeletePersonalSessionFragmentsSubscription!: Subscription;

  private $deletePersonalSessionFragmentSubmitted = signal(false);
  private $deletePersonalSessionFragmentCycleInit = signal(false);
  private $deletePersonalSessionFragmentCycleComplete = signal(false);
  private deletePersonalSessionFragmentError$!: Observable<{} | null>;
  private deletePersonalSessionFragmentProcessing$!: Observable<boolean>;
  private deletePersonalSessionFragmentSubscription!: Subscription;
  private autoDeletePersonalSessionFragmentSubscription!: Subscription;

  serverRequestProcessing$!: Observable<boolean>;

  combinedDeletePersonalSessionFragmentProcessing$!: Observable<boolean>;
  combinedDeletePersonalSessionFragmentError$!: Observable<{} | null>;

  private debounceDragDropServerCall$ = new Subject<void>();
  private debounceDragDropServerCallSubscription!: Subscription;
  $debounceActionPending = signal(false); // Prevents user from navigating away while list reorder is processing

  private store$ = inject(Store);
  private route = inject(ActivatedRoute);
  private uiService = inject(UiService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  
  ngOnInit(): void {
    this.monitorProcesses();
    this.checkForDeletePersonalSessionFragmentRequest();
    this.fetchAllPersonalSessionFragments();
    this.initializeDebounceDragDropServerCallObserver();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectPublicUserData) as Observable<PublicUser>;

    this.batchModifyPersonalSessionFragmentsError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectBatchModifyPersonalSessionFragmentsError);
    this.batchModifyPersonalSessionFragmentsProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectBatchModifyPersonalSessionFragmentsProcessing);
    
    this.batchDeletePersonalSessionFragmentsError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectBatchDeletePersonalSessionFragmentsError);
    this.batchDeletePersonalSessionFragmentsProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectBatchDeletePersonalSessionFragmentsProcessing);
    
    this.allPersonalSessionFragmentsFetched$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsFetched);  // We use this to determine if the initial empty array returned when the store is fetched is a pre-loaded state or the actual state
    this.allPersonalSessionFragmentsInStore$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectAllPersonalSessionFragmentsInStore); // Used to contrast the server version against the local version for debounce purposes
    this.fetchAllPersonalSessionFragmentsError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsError);
    this.fetchAllPersonalSessionFragmentsProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectFetchAllPersonalSessionFragmentsProcessing);

    this.deletePersonalSessionFragmentError$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectDeletePersonalSessionFragmentError);
    this.deletePersonalSessionFragmentProcessing$ = this.store$.select(PersonalSessionFragmentStoreSelectors.selectDeletePersonalSessionFragmentProcessing);

    this.serverRequestProcessing$ = combineLatest(
      [
        this.batchDeletePersonalSessionFragmentsProcessing$,
        this.batchModifyPersonalSessionFragmentsProcessing$,
        this.deletePersonalSessionFragmentProcessing$,
        this.fetchAllPersonalSessionFragmentsProcessing$,
      ]
    ).pipe(
        map(([
          batchDeletePersonalSessionFragmentsProcessing,
          batchModifyPersonalSessionFragmentsProcessing,
          deletePersonalSessionFragmentProcessing,
          fetchAllPersonalSessionFragmentsProcessing,
        ]) => {
          if (
            batchDeletePersonalSessionFragmentsProcessing ||
            batchModifyPersonalSessionFragmentsProcessing ||
            deletePersonalSessionFragmentProcessing ||
            fetchAllPersonalSessionFragmentsProcessing
          ) {
            return true;
          }
          return false;
        })
      );

    this.combinedDeletePersonalSessionFragmentProcessing$ = combineLatest(
      [
        this.batchModifyPersonalSessionFragmentsProcessing$,
        this.deletePersonalSessionFragmentProcessing$,
      ]
    ).pipe(
        map(([
          batchModifyPersonalSessionFragmentsProcessing,
          deletePersonalSessionFragmentProcessing,
        ]) => {
          if (
            batchModifyPersonalSessionFragmentsProcessing ||
            deletePersonalSessionFragmentProcessing
          ) {
            return batchModifyPersonalSessionFragmentsProcessing || deletePersonalSessionFragmentProcessing;
          }
          return false;
        })
      );
    
    this.combinedDeletePersonalSessionFragmentError$ = combineLatest(
      [
        this.batchModifyPersonalSessionFragmentsError$,
        this.deletePersonalSessionFragmentError$,
      ]
    ).pipe(
        map(([
          batchModifyPersonalSessionFragmentsError,
          deletePersonalSessionFragmentError,
        ]) => {
          if (
            batchModifyPersonalSessionFragmentsError ||
            deletePersonalSessionFragmentError
            ) {
            return batchModifyPersonalSessionFragmentsError || deletePersonalSessionFragmentError;
          }
          return false;
        })
      );

  }

  // Automatically trigger a delete request if detected in the query params
  private checkForDeletePersonalSessionFragmentRequest() {
    let autoDeleteRequestSubmitted = false;
    const personalSessionFragmentId = this.route.snapshot.queryParamMap.get(DeletePersonalSessionFragmentUrlParamsKeys.DELETE_PERSONAL_SESSION_FRAGMENT_ID);
    // Terminate function if no id found
    if (!personalSessionFragmentId) {
      return;
    }
    console.log('delete personalSessionFragmentId found in query params', personalSessionFragmentId);

    // If the fragments are available in the signal (which is the case if they were previously loaded in store), process the delete from that data
    if (personalSessionFragmentId && this.$localPersonalSessionFragments()) {
      const personalSessionFragmentToDelete = this.$localPersonalSessionFragments()!.find(fragment => fragment.id === personalSessionFragmentId);
      if (personalSessionFragmentToDelete && !autoDeleteRequestSubmitted) {
        autoDeleteRequestSubmitted = true;
        console.log('Found this personalSessionFragment to delete', personalSessionFragmentToDelete);
        this.onDeletePersonalSessionFragment(personalSessionFragmentToDelete);
        return;
      }
    }

    // Otherwise, subscribe to the observable and pull it once the fragments are available
    if (personalSessionFragmentId) {
      this.autoDeletePersonalSessionFragmentSubscription = this.allPersonalSessionFragmentsInStore$
        .pipe(
          tap(planSessessionFragments => {
            const personalSessionFragmentToDelete = planSessessionFragments.find(fragment => fragment.id === personalSessionFragmentId);
            if (personalSessionFragmentToDelete && !autoDeleteRequestSubmitted) {
              autoDeleteRequestSubmitted = true;
              console.log('Found this personalSessionFragment to delete', personalSessionFragmentToDelete);
              this.onDeletePersonalSessionFragment(personalSessionFragmentToDelete);
              this.autoDeletePersonalSessionFragmentSubscription?.unsubscribe();
            }
          })
        ).subscribe();
    }
  }

  // This removes the deletePersonalSessionFragmentId query param from the url if it exists
  private removePersonalSessionFragmentIdQueryParamFromUrl() {
    const personalSessionFragmentId = this.route.snapshot.queryParamMap.get(DeletePersonalSessionFragmentUrlParamsKeys.DELETE_PERSONAL_SESSION_FRAGMENT_ID);
    if (personalSessionFragmentId) {
      this.router.navigate([], { queryParamsHandling: 'merge', queryParams: { [DeletePersonalSessionFragmentUrlParamsKeys.DELETE_PERSONAL_SESSION_FRAGMENT_ID]: null } });
    }
  }

  private fetchAllPersonalSessionFragments() {
    this.fetchPersonalSessionFragmentsSubscription = this.fetchAllPersonalSessionFragmentsError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetFetchPersonalSessionFragmentsComponentState();
            this.onBackToDashboard();
          }
          return this.allPersonalSessionFragmentsInStore$;
        }),
        withLatestFrom(this.fetchAllPersonalSessionFragmentsError$, this.userData$, this.allPersonalSessionFragmentsFetched$),
        filter(([personalSessionFragments, processingError, userData, allFetched]) => !processingError),
        map(([personalSessionFragments, processingError, userData, allFetched]) => {
          if (!allFetched && !this.$fetchPersonalSessionFragmentsSubmitted()) {
            this.store$.dispatch(PersonalSessionFragmentStoreActions.fetchAllPersonalSessionFragmentsRequested({userId: userData.id}));
            this.$fetchPersonalSessionFragmentsSubmitted.set(true);
          }
          return personalSessionFragments;
        }),
        withLatestFrom(this.allPersonalSessionFragmentsFetched$),
        filter(([personalSessionFragments, allFetched ]) => allFetched),
        tap(([personalSessionFragments, allFetched ]) => {
          this.$localPersonalSessionFragments.set(personalSessionFragments);
          console.log('Set personalSessionFragments', this.$localPersonalSessionFragments());
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
          this.resetFetchPersonalSessionFragmentsComponentState();
          this.onBackToDashboard();
          return throwError(() => new Error(error));
        })
      ).subscribe();
  }

  private resetFetchPersonalSessionFragmentsComponentState() {
    this.fetchPersonalSessionFragmentsSubscription?.unsubscribe();
    this.$fetchPersonalSessionFragmentsSubmitted.set(false);
    this.store$.dispatch(PersonalSessionFragmentStoreActions.purgePersonalSessionFragmentErrors());
  }

  onSelectPersonalSessionFragment(personalSessionFragmentData: PersonalSessionFragment) {
    const queryParams: ViewPersonalSessionFragmentQueryParams = {
      [ViewPersonalSessionFragmentQueryParamsKeys.CANONICAL_ID]: personalSessionFragmentData.canonicalId,
      [ViewPersonalSessionFragmentQueryParamsKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT,
    };
    const navigationExtras = {queryParams};
    this.router.navigate([`${PublicAppRoutes.TRAIN_TRAINING_SESSION}`, personalSessionFragmentData.id], navigationExtras);
  }

  // This helps eliminate some strange clicking behavior
  onDragIconClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onListItemDrop(event: CdkDragDrop<PersonalSessionFragment[]>) {
    
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    // Do nothing if no change in index;
    if (previousIndex === currentIndex) {
      return;
    }

    // Update the signal locally in real-time
    this.$localPersonalSessionFragments.update(personalSessessionFragments => {
      if (previousIndex === currentIndex) {
        return personalSessessionFragments; // No movement needed
      }
  
      const movedItem = { ...personalSessessionFragments![previousIndex] }; // Clone the item to be moved
      const altUpdatedArray = [...personalSessessionFragments!]; // Clone the original array
      
      // Remove the item from its old position
      altUpdatedArray.splice(previousIndex, 1);
      
      // Insert it into its new position
      altUpdatedArray.splice(currentIndex, 0, movedItem);

      // Update the indexes of the affected items
      const start = Math.min(previousIndex, currentIndex);
      const end = Math.max(previousIndex, currentIndex);
      for (let i = start; i <= end; i++) {
        const currentItem = {...altUpdatedArray[i]};
        currentItem[PersonalSessionFragmentKeys.QUEUE_INDEX] = i;
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
        tap(empty => {
          this.$debounceActionPending.set(true);
        }),
        debounceTime(2000), // Determines how frequently updates are sent to the server
        withLatestFrom(this.allPersonalSessionFragmentsInStore$, this.userData$),
        switchMap(([empty, serverPersonalSessionFragments, userData]) => {
          return of(this.buildAndDispatchReorderRequest(userData.id, serverPersonalSessionFragments));
        })
      ).subscribe();
  }

  private buildAndDispatchReorderRequest(userId: string, serverPersonalSessionFragments: PersonalSessionFragment[]) {
    // Build an array of server updates that only updates the items that have changed
    const personalSessionFragmentUpdates = [] as Update<PersonalSessionFragment>[]; // This will be used to send batch update to database
    this.$localPersonalSessionFragments()?.forEach((itemToUpdate, index) => {
      // If current item matches the server item of the same index, no update is necessary, so don't push to server
      if (itemToUpdate.id === serverPersonalSessionFragments[index].id) {
        return;
      }
      // Otherwise, create an update object and push it to the update array
      const altAffectedItemUpdateObject: Update<PersonalSessionFragment> = {
        id: itemToUpdate.id,
        changes: {
          queueIndex: itemToUpdate.queueIndex
        }
      };
      personalSessionFragmentUpdates.push(altAffectedItemUpdateObject);
    })

    console.log('personalSessionFragmentUpdates', personalSessionFragmentUpdates);
    // Dispatch update array to the server
    this.store$.dispatch(PersonalSessionFragmentStoreActions.batchModifyPersonalSessionFragmentsRequested({userId, personalSessionFragmentUpdates}));
    this.$debounceActionPending.set(false);
  }

  onDeletePersonalSessionFragment(selectedPersonalSessionFragment: PersonalSessionFragment) {
    
    const personalSessionFragmentId = selectedPersonalSessionFragment.id;
    let personalSessionFragmentUpdates: Update<PersonalSessionFragment>[];
    let updatesConfigured = false;

    const dialogConfig = {...DialogueBoxDefaultConfig};
    const actionConfData: ActionConfData = {
      title: this.REMOVE_PERSONAL_SESSION_FRAGMENT_CONF_TITLE,
      body: this.REMOVE_PERSONAL_SESSION_FRAGMENT_CONF_BODY,
    };

    dialogConfig.data = actionConfData;
    
    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);

    const dialogActionObserver$: Observable<boolean> = dialogRef.afterClosed();

    this.deletePersonalSessionFragmentSubscription = this.combinedDeletePersonalSessionFragmentError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetDeletePersonalSessionFragmentComponentState();
          }
          return dialogActionObserver$;
        }),
        withLatestFrom(this.deletePersonalSessionFragmentError$, this.userData$),
        tap(([dialogAction, processingError, userData]) => {
          if (!dialogAction) {
            console.log('User canceled delete request');
            this.removePersonalSessionFragmentIdQueryParamFromUrl();
          }
        }),
        filter(([dialogAction, processingError, userData]) => !processingError && dialogAction),
        // Update the UI with the updated array of personalSessionFragments
        tap(([dialogAction, processingError, userData]) => {
          if (!updatesConfigured) {
            personalSessionFragmentUpdates = this.processLocalPersonalSessionFragmentDeletionActions(selectedPersonalSessionFragment);
            updatesConfigured = true;
          }
        }),
        switchMap(([dialogAction, processingError, userData]) => {
          if (!this.$deletePersonalSessionFragmentSubmitted()) {
            this.$deletePersonalSessionFragmentSubmitted.set(true);
            this.store$.dispatch(PersonalSessionFragmentStoreActions.deletePersonalSessionFragmentRequested({userId: userData.id, personalSessionFragmentId: personalSessionFragmentId}));
          }
          return this.deletePersonalSessionFragmentProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(deleteProcessing => {
          if (deleteProcessing) {
            this.$deletePersonalSessionFragmentCycleInit.set(true);
          }
          if (!deleteProcessing && this.$deletePersonalSessionFragmentCycleInit()) {
            console.log('deletePersonalSessionFragment successful, proceeding with pipe.');
            this.$deletePersonalSessionFragmentCycleInit.set(false);
            this.$deletePersonalSessionFragmentCycleComplete.set(true);
          }
        }),
        filter(deleteProcessing => !deleteProcessing && this.$deletePersonalSessionFragmentCycleComplete()),
        withLatestFrom(this.userData$),
        switchMap(([deleteProcessing, userData]) => {
          if (!this.$batchModifyPersonalSessionFragmentsSubmitted()) {
            this.$batchModifyPersonalSessionFragmentsSubmitted.set(true);
            this.store$.dispatch(PersonalSessionFragmentStoreActions.batchModifyPersonalSessionFragmentsRequested({userId: userData.id, personalSessionFragmentUpdates}));
          }
          return this.batchModifyPersonalSessionFragmentsProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(batchModifyProcessing => {
          if (batchModifyProcessing) {
            this.$batchModifyPersonalSessionFragmentsCycleInit.set(true);
          }
          if (!batchModifyProcessing && this.$batchModifyPersonalSessionFragmentsCycleInit()) {
            console.log('batchModifyPersonalSessionFragments successful, proceeding with pipe.');
            this.$batchModifyPersonalSessionFragmentsCycleInit.set(false)
            this.$batchModifyPersonalSessionFragmentsCycleComplete.set(true);
          }
        }),
        filter(batchModifyProcessing => !batchModifyProcessing && this.$batchModifyPersonalSessionFragmentsCycleComplete()),
        tap(batchModifyProcessing => {
          console.log('All steps complete: 1) personalSessionFragment deleted, 2) remaining personalSessionFragments updated');
          this.uiService.showSnackBar(`Training session deleted.`, 10000);
          this.resetDeletePersonalSessionFragmentComponentState();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 10000);
          this.resetDeletePersonalSessionFragmentComponentState();
          return throwError(() => new Error(error));
        })

      ).subscribe();

  }

  private processLocalPersonalSessionFragmentDeletionActions(selectedPersonalSessionFragment: PersonalSessionFragment): Update<PersonalSessionFragment>[] {
    const indexOfItemToDelete = selectedPersonalSessionFragment[PersonalSessionFragmentKeys.QUEUE_INDEX];

    // This does two things: 1) updates the local UI 2) prepares a batch update for the server database
    const personalSessionFragmentUpdates = [] as Update<PersonalSessionFragment>[]; // This will be used to send batch update to database
    this.$localPersonalSessionFragments.update(personalSessionFragments => {
      // Get a mutable array of personalSessionFragments for current trainingPlan
      const updatedArray = [...personalSessionFragments!];
      // Remove item from the array
      updatedArray.splice(indexOfItemToDelete, 1); 
      // Update the indexes of the remaining items

      updatedArray.forEach((personalSessionFragment, index) => {
        const itemToUpdate = {...personalSessionFragment};
        itemToUpdate[PersonalSessionFragmentKeys.QUEUE_INDEX] = index;
        updatedArray[index] = itemToUpdate;
        // If no change to index, don't push changes to server
        if (personalSessionFragment[PersonalSessionFragmentKeys.QUEUE_INDEX] === index) {
          return;
        }
        // Otherwise, create an update object and push it to the update array
        const affectedItemUpdateObject: Update<PersonalSessionFragment> = {
          id: itemToUpdate.id,
          changes: {
            queueIndex: itemToUpdate.queueIndex
          }
        };
        personalSessionFragmentUpdates.push(affectedItemUpdateObject);
      })
      console.log('Updated personalSessionFragment array', updatedArray);
      return updatedArray; // This updated array will replace the UI's current array in the signal
    })

    console.log('List of updates for server', personalSessionFragmentUpdates);
    return personalSessionFragmentUpdates;
  }

  private resetDeletePersonalSessionFragmentComponentState() {
    this.deletePersonalSessionFragmentSubscription?.unsubscribe();

    this.$deletePersonalSessionFragmentSubmitted.set(false);
    this.$deletePersonalSessionFragmentCycleInit.set(false);
    this.$deletePersonalSessionFragmentCycleComplete.set(false);

    this.$batchModifyPersonalSessionFragmentsSubmitted.set(false);
    this.$batchModifyPersonalSessionFragmentsCycleInit.set(false);
    this.$batchModifyPersonalSessionFragmentsCycleComplete.set(false);

    this.removePersonalSessionFragmentIdQueryParamFromUrl();
    this.store$.dispatch(PersonalSessionFragmentStoreActions.purgePersonalSessionFragmentErrors());
  }

  onClearPersonalQueue() {
    const dialogConfig = {...DialogueBoxDefaultConfig};
    const actionConfData: ActionConfData = {
      title: this.CLEAR_PERSONAL_QUEUE_CONF_TITLE,
      body: this.CLEAR_PERSONAL_QUEUE_CONF_BODY,
    };

    dialogConfig.data = actionConfData;
    
    const dialogRef = this.dialog.open(ActionConfirmDialogueComponent, dialogConfig);

    const dialogActionObserver$: Observable<boolean> = dialogRef.afterClosed();

    this.batchDeletePersonalSessionFragmentsSubscription = this.batchDeletePersonalSessionFragmentsError$
      .pipe(
        switchMap(processingError => {
          if (processingError) {
            console.log('processingError detected, terminating pipe', processingError);
            this.resetBatchDeletePersonalSessionFragmentsComponentState();
          }
          return dialogActionObserver$;
        }),
        withLatestFrom(this.batchDeletePersonalSessionFragmentsError$, this.userData$),
        tap(([dialogAction, processingError, userData]) => {
          if (!dialogAction) {
            console.log('User canceled delete request');
          }
        }),
        filter(([dialogAction, processingError, userData]) => !processingError && dialogAction && this.$localPersonalSessionFragments()!.length > 0),
        // Update the UI with the updated array of personalSessionFragments
        switchMap(([dialogAction, processingError, userData]) => {
          const personalSessionFragmentIds = this.$localPersonalSessionFragments()!.map(personalSessionFragment => personalSessionFragment.id); // Gather array of personalSessionFragmentIds to delete
          if (!this.$batchDeletePersonalSessionFragmentsSubmitted()) {
            this.$batchDeletePersonalSessionFragmentsSubmitted.set(true);
            if (personalSessionFragmentIds.length > 0) {
              this.store$.dispatch(PersonalSessionFragmentStoreActions.batchDeletePersonalSessionFragmentsRequested({userId: userData.id, personalSessionFragmentIds}));
            }
          }
          return this.batchDeletePersonalSessionFragmentsProcessing$;
        }),
        // This tap/filter pattern ensures an async action has completed before proceeding with the pipe
        tap(deleteProcessing => {
          if (deleteProcessing) {
            this.$batchDeletePersonalSessionFragmentsCycleInit.set(true);
          }
          if (!deleteProcessing && this.$batchDeletePersonalSessionFragmentsCycleInit()) {
            console.log('batchDeletePersonalSessionFragments successful, proceeding with pipe.');
            this.$batchDeletePersonalSessionFragmentsCycleInit.set(false);
            this.$batchDeletePersonalSessionFragmentsCycleComplete.set(true);
          }
        }),
        filter(deleteProcessing => !deleteProcessing && this.$batchDeletePersonalSessionFragmentsCycleComplete()),
        tap(deleteProcessing => {
          this.batchDeletePersonalSessionFragmentsSubscription?.unsubscribe();
          this.resetBatchDeletePersonalSessionFragmentsComponentState();
          this.uiService.showSnackBar(`All training sessions removed.`, 10000);
          this.onBackToDashboard();
        }),
        // Catch any local errors
        catchError(error => {
          console.log('Error in component:', error);
          this.uiService.showSnackBar(`Something went wrong. Please try again.`, 10000);
          this.resetBatchDeletePersonalSessionFragmentsComponentState();
          return throwError(() => new Error(error));
        })

      ).subscribe();
  }

  private resetBatchDeletePersonalSessionFragmentsComponentState() {
    this.batchDeletePersonalSessionFragmentsSubscription?.unsubscribe();

    this.$batchDeletePersonalSessionFragmentsSubmitted.set(false);
    this.$batchDeletePersonalSessionFragmentsCycleInit.set(false);
    this.$batchDeletePersonalSessionFragmentsCycleComplete.set(false);

    this.store$.dispatch(PersonalSessionFragmentStoreActions.purgePersonalSessionFragmentErrors());
  }

  onBackToDashboard() {
    this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
  }

  onNavigateToBrowse() {
    this.router.navigate([PublicAppRoutes.BROWSE]);
  }

  ngOnDestroy(): void {
    this.autoDeletePersonalSessionFragmentSubscription?.unsubscribe();
    this.deletePersonalSessionFragmentSubscription?.unsubscribe();
    this.fetchPersonalSessionFragmentsSubscription?.unsubscribe();
    this.debounceDragDropServerCallSubscription?.unsubscribe();
    this.batchDeletePersonalSessionFragmentsSubscription?.unsubscribe();
  }

}
