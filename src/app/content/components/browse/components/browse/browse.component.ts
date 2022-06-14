import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';

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

  constructor(
    private router: Router,
  ) { }

  ngOnInit(): void {
  }

  onCreateSession() {
    this.router.navigate([PublicAppRoutes.TRAINING_SESSION_NEW]);
  }

  onCreatePlan() {
    this.router.navigate([PublicAppRoutes.TRAINING_PLAN_NEW]);
  }

}
