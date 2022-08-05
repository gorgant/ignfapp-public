import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';

@Component({
  selector: 'app-browse-training-plans',
  templateUrl: './browse-training-plans.component.html',
  styleUrls: ['./browse-training-plans.component.scss']
})
export class BrowseTrainingPlansComponent implements OnInit {

  CREATE_PLAN_BUTTON_VALUE = GlobalFieldValues.CREATE_PLAN;

  constructor(
    private router: Router,
  ) { }

  ngOnInit(): void {
  }

  onCreatePlan() {
    this.router.navigate([PublicAppRoutes.TRAINING_PLAN_NEW]);
  }

}
