import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, Subscription, withLatestFrom, take, tap } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { TrainingPlanFormValidationMessages } from 'shared-models/forms/validation-messages.model';
import { AddTrainingPlanUrlParams, TrainingPlan, TrainingPlanForm, TrainingPlanFormVars, TrainingPlanKeys, TrainingPlanNoIdOrTimestamp, AddTrainingPlanUrlParamsKeys } from 'shared-models/train/training-plan.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { PlanSessionFragmentStoreActions, PlanSessionFragmentStoreSelectors, RootStoreState, TrainingPlanStoreActions, TrainingPlanStoreSelectors, UserStoreSelectors } from 'src/app/root-store';
import { Update } from '@ngrx/entity';
import { UiService } from 'src/app/core/services/ui.service';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PlanSessionFragment, ViewPlanSessionFragmentUrlParams } from 'shared-models/train/plan-session-fragment.model';
import { TrainingSessionDatabaseCategoryTypes } from 'shared-models/train/training-session.model';

@Component({
  selector: 'app-edit-training-plan',
  templateUrl: './edit-training-plan.component.html',
  styleUrls: ['./edit-training-plan.component.scss']
})
export class EditTrainingPlanComponent implements OnInit, OnDestroy {

  ADD_A_TRAINING_SESSION_BUTTON_VALUE = GlobalFieldValues.ADD_TRAINING_SESSION;
  CANCEL_BUTTON_VALUE = GlobalFieldValues.CANCEL;
  CREATE_TRAINING_PLAN_BUTTON_VALUE = GlobalFieldValues.CREATE_PLAN;
  CREATE_TRAINING_PLAN_TITLE_VALUE = GlobalFieldValues.CREATE_PLAN;
  EDIT_TRAINING_PLAN_TITLE_VALUE = GlobalFieldValues.EDIT_TRAINING_PLAN;
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


  isNewPlan = true;
  editPlanDetails!: boolean;

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private route: ActivatedRoute,
    private uiService: UiService,
    private router: Router
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
    this.fetchSingleTrainingPlanError$ = this.store$.select(TrainingPlanStoreSelectors.selectFetchSingleTrainingPlanError),

    this.fetchAllPlanSessionFragmentsProcessing$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsProcessing);
    this.fetchAllPlanSessionFragmentsError$ = this.store$.select(PlanSessionFragmentStoreSelectors.selectFetchAllPlanSessionFragmentsError),

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
      this.editPlanDetails = true;
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
  onEditPlanDetails() {
    this.editPlanDetails = true;
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
          this.editPlanDetails = false;
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
          this.editPlanDetails = false;
        }
      })

  }

  // Navigates user to same page with the edit URL and id parameters active
  navigateUserToEditTrainingPlan(trainingPlanId: string): void {
    this.router.navigate([PublicAppRoutes.TRAINING_PLAN_EDIT, trainingPlanId]);
  }

  navigateUserToBrowse(): void {
    this.router.navigate([PublicAppRoutes.BROWSE]);
  }

  onCancelTitleUpdate() {
    if (this.isNewPlan) {
      this.uiService.routeUserToPreviousPage();
    } else {
      // Hide the title editing interface
      this.editPlanDetails = false;
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

  onAddTrainingPlan(trainingPlanId: string | undefined) {
    if (!trainingPlanId) {
      return;
    }

    const queryParams: AddTrainingPlanUrlParams = {
      [AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: true,
      [AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_ID]: trainingPlanId
    }

    const navigationExtras: NavigationExtras = {
      queryParams
    };

    this.router.navigate([PublicAppRoutes.BROWSE], navigationExtras);
  }

  onSelectTrainingSession(sessionData: PlanSessionFragment) {
    const queryParams: ViewPlanSessionFragmentUrlParams = {
      canonicalId: sessionData.canonicalId,
      databaseCategory: TrainingSessionDatabaseCategoryTypes.PLAN_FRAGMENT,
      trainingPlanId: sessionData.trainingPlanId
    };
    const navigationExtras = {queryParams};
    this.router.navigate([`${PublicAppRoutes.TRAINING_SESSION}/${sessionData.id}`], navigationExtras);
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
