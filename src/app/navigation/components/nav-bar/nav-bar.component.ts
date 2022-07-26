import { Component, OnInit } from '@angular/core';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {

  accountUrl = PublicAppRoutes.ACCOUNT;
  browseUrl = PublicAppRoutes.BROWSE;
  workoutUrl = PublicAppRoutes.TRAIN_DASHBOARD;


  constructor() { }

  ngOnInit(): void {
  }

}
