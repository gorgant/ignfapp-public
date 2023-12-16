import { Component, OnInit } from '@angular/core';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss'],
    standalone: true,
    imports: [MatButtonModule, RouterLink, MatIconModule]
})
export class NavBarComponent implements OnInit {

  accountUrl = PublicAppRoutes.ACCOUNT;
  browseUrl = PublicAppRoutes.BROWSE;
  workoutUrl = PublicAppRoutes.TRAIN_DASHBOARD;


  constructor() { }

  ngOnInit(): void {
  }

}
