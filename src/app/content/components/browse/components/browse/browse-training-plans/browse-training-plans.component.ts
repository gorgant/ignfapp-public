import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { RootStoreState, UserStoreSelectors } from 'src/app/root-store';

@Component({
  selector: 'app-browse-training-plans',
  templateUrl: './browse-training-plans.component.html',
  styleUrls: ['./browse-training-plans.component.scss']
})
export class BrowseTrainingPlansComponent implements OnInit {

  // TODO: Implement similar configuration to Browse Training Sessions with filters etc

  CREATE_PLAN_BUTTON_VALUE = GlobalFieldValues.CREATE_PLAN;

  userData$!: Observable<PublicUser | null>;

  constructor(
    private router: Router,
    private store$: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit(): void {
    this.monitorProcesses();
  }

  private monitorProcesses() {
    this.userData$ = this.store$.select(UserStoreSelectors.selectUserData);
  }


  onCreatePlan() {
    this.router.navigate([PublicAppRoutes.TRAINING_PLAN_NEW]);
  }

}
