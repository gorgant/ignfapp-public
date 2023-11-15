import { Component, Input, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PersonalSessionFragment, ViewPersonalSessionFragmentUrlParams } from 'shared-models/train/personal-session-fragment.model';
import { PlanSessionFragment, ViewPlanSessionFragmentUrlParams } from 'shared-models/train/plan-session-fragment.model';
import { AddTrainingSessionUrlParamsKeys, AddTrainingSessionUrlParams } from 'shared-models/train/training-plan.model';
import { TrainingSession, TrainingSessionDatabaseCategoryTypes, ViewTrainingSessionsUrlParamsKeys } from 'shared-models/train/training-session.model';

@Component({
  selector: 'app-training-session-card',
  templateUrl: './training-session-card.component.html',
  styleUrls: ['./training-session-card.component.scss']
})
export class TrainingSessionCardComponent implements OnInit {

  @Input() trainingSesssionData!: TrainingSession | PlanSessionFragment | PersonalSessionFragment; 
  @Input() compressedDisplay?: boolean; // Used for edit plan display
  @Input() trainingPlanBuilderRequest?: boolean;

  COMPLEXITY_SUBTEXT = GlobalFieldValues.COMPLEXITY;
  INTENSITY_SUBTEXT = GlobalFieldValues.INTENSITY;

  $isViewTrainingSessions = signal(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.checkForViewTrainingSessions();
  }

  private checkForViewTrainingSessions() {
    const viewTrainingSessionsValue = this.route.snapshot.queryParamMap.get(ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS);
    if (viewTrainingSessionsValue && JSON.parse(viewTrainingSessionsValue)) {
      this.$isViewTrainingSessions.set(true);
    }
  }

  onSelectTrainingSession(trainingSessionData: TrainingSession) {
    let navigationExtras: NavigationExtras = {};
    if (this.trainingPlanBuilderRequest) {
      const queryParams = this.generatePlanBuilderQueryParams();
      navigationExtras = {...navigationExtras, queryParams};
    }
    if (this.trainingSesssionData.databaseCategory === TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT) {
      const planSessionFragmentData = this.trainingSesssionData as PlanSessionFragment;
      const queryParams: ViewPlanSessionFragmentUrlParams = {
        canonicalId: planSessionFragmentData.canonicalId,
        databaseCategory: TrainingSessionDatabaseCategoryTypes.PLAN_SESSION_FRAGMENT,
        trainingPlanId: planSessionFragmentData.trainingPlanId
      };
      navigationExtras = {queryParams};
    }
    if (this.trainingSesssionData.databaseCategory === TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT) {
      const planSessionFragmentData = this.trainingSesssionData as PersonalSessionFragment;
      const queryParams: ViewPersonalSessionFragmentUrlParams = {
        canonicalId: planSessionFragmentData.canonicalId,
        databaseCategory: TrainingSessionDatabaseCategoryTypes.PERSONAL_SESSION_FRAGMENT,
      };
      navigationExtras = {queryParams};
    }
    this.router.navigate([`${PublicAppRoutes.TRAIN_TRAINING_SESSION}`, trainingSessionData.id], navigationExtras);
  }

  // Indicate in URL that this is a planbuilder request
  private generatePlanBuilderQueryParams() {
    const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_ID) as string;
    const queryParams: AddTrainingSessionUrlParams = {
      [AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST]: true,
      [AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_ID]: trainingPlanId,
      [ViewTrainingSessionsUrlParamsKeys.VIEW_TRAINING_SESSIONS]: true
    }
    return queryParams
  }

}
