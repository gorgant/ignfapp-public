import { Component, Input, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PersonalSessionFragment, ViewPersonalSessionFragmentQueryParams, ViewPersonalSessionFragmentQueryParamsKeys } from 'shared-models/train/personal-session-fragment.model';
import { PlanSessionFragment, PlanSessionFragmentKeys, ViewPlanSessionFragmentQueryParams, ViewPlanSessionFragmentQueryParamsKeys } from 'shared-models/train/plan-session-fragment.model';
import { AddTrainingSessionUrlToPlanParamsKeys, AddTrainingSessionToPlanQueryParams, TrainingPlanKeys, TrainingPlanVisibilityCategoryDbOption } from 'shared-models/train/training-plan.model';
import { CanonicalTrainingSession, TrainingSessionDatabaseCategoryTypes, TrainingSessionKeys, BrowseTrainingSessionsQueryParamsKeys, ViewCanonicalTrainingSessionQueryParams, ViewCanonicalTrainingSessionQueryParamsKeys } from 'shared-models/train/training-session.model';
import { DurationMsToMmSsPipe } from '../../pipes/duration-ms-to-mm-ss.pipe';
import { AddTrainingSessionToPersonalQueueButtonComponent } from '../add-training-session-to-personal-queue-button/add-training-session-to-personal-queue-button.component';
import { AddTrainingSessionToPlanButtonComponent } from '../add-training-session-to-plan-button/add-training-session-to-plan-button.component';

@Component({
    selector: 'app-training-session-card',
    templateUrl: './training-session-card.component.html',
    styleUrls: ['./training-session-card.component.scss'],
    imports: [AddTrainingSessionToPlanButtonComponent, AddTrainingSessionToPersonalQueueButtonComponent, DurationMsToMmSsPipe]
})
export class TrainingSessionCardComponent implements OnInit {

  @Input() trainingSesssionData!: CanonicalTrainingSession | PlanSessionFragment | PersonalSessionFragment; 
  @Input() useCompressedDisplay?: boolean; // Used for edit plan display
  @Input() trainingPlanBuilderRequest?: boolean;

  $localCanonicalTrainingSession = signal(undefined as CanonicalTrainingSession | undefined);
  $localPlanSessionFragment = signal(undefined as PlanSessionFragment | undefined);
  $localPersonalSessionFragment = signal(undefined as PersonalSessionFragment | undefined);
  $combinedLocalTrainingSessionData = computed(() => {
    return this.$localCanonicalTrainingSession() || this.$localPlanSessionFragment() || this.$localPersonalSessionFragment();
  });

  COMPLEXITY_SUBTEXT = GlobalFieldValues.COMPLEXITY;
  INTENSITY_SUBTEXT = GlobalFieldValues.INTENSITY;

  $isViewTrainingSessions = signal(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.checkForViewTrainingSessions();
    this.patchLocalValues();
  }

  private checkForViewTrainingSessions() {
    const viewTrainingSessionsValue = this.route.snapshot.queryParamMap.get(BrowseTrainingSessionsQueryParamsKeys.VIEW_TRAINING_SESSIONS);
    if (viewTrainingSessionsValue && JSON.parse(viewTrainingSessionsValue)) {
      this.$isViewTrainingSessions.set(true);
    }
  }

  private patchLocalValues() {
    const trainingSession = this.trainingSesssionData;
    switch (trainingSession[TrainingSessionKeys.DATABASE_CATEGORY]) {
      case TrainingSessionDatabaseCategoryTypes.CANONICAL:
        this.$localCanonicalTrainingSession.set(trainingSession as CanonicalTrainingSession);
        break;
      case TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT:
        this.$localPlanSessionFragment.set(trainingSession as PlanSessionFragment);
        break;
      case TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT:
        this.$localPersonalSessionFragment.set(trainingSession as PersonalSessionFragment);
        break;
    }
  }

  onSelectTrainingSession() {
    let navigationExtras: NavigationExtras = {};
    if (this.trainingPlanBuilderRequest && this.$localCanonicalTrainingSession()) {
      const viewCanonicalTrainingSessionQueryParams: ViewCanonicalTrainingSessionQueryParams = {
        [ViewCanonicalTrainingSessionQueryParamsKeys.DATABASE_CATEGORY]: this.$localCanonicalTrainingSession()![TrainingSessionKeys.DATABASE_CATEGORY],
        [ViewCanonicalTrainingSessionQueryParamsKeys.TRAINING_SESSION_VISIBILITY_CATEGORY]: this.$localCanonicalTrainingSession()![TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY]!
      };
      const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_ID) as string | undefined;
      const trainingPlanVisibilityCategory = this.route.snapshot.queryParamMap.get(TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY) as TrainingPlanVisibilityCategoryDbOption | undefined;
      const addTrainingSessionToPlanQueryParams: AddTrainingSessionToPlanQueryParams = {
        [AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: true,
        [AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_ID]: trainingPlanId!,
        [AddTrainingSessionUrlToPlanParamsKeys.VIEW_TRAINING_SESSIONS]: false,
        [AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: trainingPlanVisibilityCategory!,
      };
      const queryParams = {
        ...viewCanonicalTrainingSessionQueryParams,
        ...addTrainingSessionToPlanQueryParams
      };
      navigationExtras = {queryParams};
      this.router.navigate([`${PublicAppRoutes.TRAIN_TRAINING_SESSION}`, this.$combinedLocalTrainingSessionData()!.id], navigationExtras);
      return;
    }
    if (this.$localPlanSessionFragment()) {
      const planSessionFragmentData = this.$localPlanSessionFragment()!;
      const queryParams: ViewPlanSessionFragmentQueryParams = {
        [ViewPlanSessionFragmentQueryParamsKeys.CANONICAL_ID]: planSessionFragmentData.canonicalId,
        [ViewPlanSessionFragmentQueryParamsKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT,
        [ViewPlanSessionFragmentQueryParamsKeys.TRAINING_PLAN_ID]: planSessionFragmentData.trainingPlanId,
        [ViewPlanSessionFragmentQueryParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: planSessionFragmentData[PlanSessionFragmentKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]
      };
      navigationExtras = {queryParams};
      this.router.navigate([`${PublicAppRoutes.TRAIN_TRAINING_SESSION}`, this.$combinedLocalTrainingSessionData()!.id], navigationExtras);
      return;
    }
    if (this.$localPersonalSessionFragment()) {
      const personalSessionFragmentData = this.$localPersonalSessionFragment()!;
      const queryParams: ViewPersonalSessionFragmentQueryParams = {
        [ViewPersonalSessionFragmentQueryParamsKeys.CANONICAL_ID]: personalSessionFragmentData.canonicalId,
        [ViewPersonalSessionFragmentQueryParamsKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT,
      };
      navigationExtras = {queryParams};
      this.router.navigate([`${PublicAppRoutes.TRAIN_TRAINING_SESSION}`, this.$combinedLocalTrainingSessionData()!.id], navigationExtras);
      return;
    }
    if (this.$localCanonicalTrainingSession()) {
      const canonicalTrainingSessionData = this.$localCanonicalTrainingSession()!;
      const queryParams: ViewCanonicalTrainingSessionQueryParams = {
        [ViewCanonicalTrainingSessionQueryParamsKeys.DATABASE_CATEGORY]: TrainingSessionDatabaseCategoryTypes.CANONICAL,
        [ViewCanonicalTrainingSessionQueryParamsKeys.TRAINING_SESSION_VISIBILITY_CATEGORY]: canonicalTrainingSessionData[TrainingSessionKeys.TRAINING_SESSION_VISIBILITY_CATEGORY],
      };
      navigationExtras = {queryParams};
      this.router.navigate([`${PublicAppRoutes.TRAIN_TRAINING_SESSION}`, this.$combinedLocalTrainingSessionData()!.id], navigationExtras);
      return;
    }

    this.router.navigate([`${PublicAppRoutes.TRAIN_TRAINING_SESSION}`, this.$combinedLocalTrainingSessionData()!.id], navigationExtras);
  }

}
