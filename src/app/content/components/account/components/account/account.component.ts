import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicImagePaths } from 'shared-models/routes-and-paths/image-paths.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { selectPublicUserData } from 'src/app/root-store/user-store/selectors';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {

  PUBLIC_APP_ROUTES = PublicAppRoutes;

  STATS_BUTTON_VALUE = GlobalFieldValues.STATS;
  PROFILE_BUTTON_VALUE = GlobalFieldValues.PROFILE;
  SETTINGS_BUTTON_VALUE = GlobalFieldValues.SETTINGS;

  PROFILE_URL = PublicAppRoutes.ACCOUNT_PROFILE;
  SETTINGS_URL = PublicAppRoutes.ACCOUNT_SETTINGS;
  STATS_URL = PublicAppRoutes.ACCOUNT_STATS;


  userData$!: Observable<PublicUser>;

  DEFAULT_PROFILE_IMAGE = PublicImagePaths.DEFAULT_PROFILE_IMAGE_ICON;

  private store$ = inject(Store);
  private router = inject(Router);

  constructor() { }

  ngOnInit(): void {
    this.fetchUserData();
  }

  private fetchUserData(): void {
    this.userData$ = this.store$.select(selectPublicUserData) as Observable<PublicUser>;
  }

  onNavigateToAccountItem(route: PublicAppRoutes) {
    this.router.navigate([route]);
  }

}
