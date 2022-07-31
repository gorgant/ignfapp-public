import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, withLatestFrom } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { TrainingPlan } from 'shared-models/train/training-plan.model';
import { TrainingSession } from 'shared-models/train/training-session.model';
import { RootStoreState, TrainingSessionStoreActions, TrainingSessionStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss']
})
export class BrowseComponent implements OnInit {

  PLANS_TAB_VALUE = GlobalFieldValues.PLANS;
  SESSIONS_TAB_VALUE = GlobalFieldValues.SESSIONS;
  CREATE_SESSION_BUTTON_VALUE = GlobalFieldValues.CREATE_SESSION;
  CREATE_PLAN_BUTTON_VALUE = GlobalFieldValues.CREATE_PLAN;

  trainingSessions$!: Observable<TrainingSession[]>;
  trainingSessionsLoaded!: boolean;

  trainingPlans$!: Observable<TrainingPlan[]>;

  items = Array.from({length: 20}).map((_, i) => `Item #${i}`);

  constructor(
    private router: Router,
    private store$: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit(): void {
    this.fetchInitialTrainingSessionBatch();
  }

  private fetchInitialTrainingSessionBatch() {
    this.trainingSessions$ = this.store$.select(TrainingSessionStoreSelectors.selectAllSessionsInStore)
      .pipe(
        withLatestFrom(
          this.store$.select(TrainingSessionStoreSelectors.selectFetchMultipleTrainingSessionsProcessing),
          this.store$.select(TrainingSessionStoreSelectors.selectFetchMultipleTrainingSessionsError),
        ),
        map(([trainingSessions, loadingSessions, loadError]) => {

          if (loadError) {
            console.log('Error loading training sessions in component', loadError);
            this.trainingSessionsLoaded = false;
          }

          // Check if posts are loaded, if not fetch from server
          if (!loadingSessions && !this.trainingSessionsLoaded && trainingSessions?.length < 1) {
            this.store$.dispatch(TrainingSessionStoreActions.fetchMultipleTrainingSessionsRequested({queryParams: {limit: 25}}));
            this.trainingSessionsLoaded = true;
          }
          return trainingSessions;
        })
      )
  }

  onCreateSession() {
    this.router.navigate([PublicAppRoutes.TRAINING_SESSION_NEW]);
  }

  onCreatePlan() {
    this.router.navigate([PublicAppRoutes.TRAINING_PLAN_NEW]);
  }

  onSelectTrainingSession(sessionData: TrainingSession) {
    this.router.navigate([`${PublicAppRoutes.TRAINING_SESSION}/${sessionData.id}`]);
  }

}
