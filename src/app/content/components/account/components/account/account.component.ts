import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { PublicImagePaths } from 'shared-models/routes-and-paths/image-paths.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { RootStoreState } from 'src/app/root-store';
import { selectIsFetchingUser, selectUserData } from 'src/app/root-store/user-store/selectors';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {


  statsButtonValue = GlobalFieldValues.STATS;
  profileButtonValue = GlobalFieldValues.PROFILE;
  settingsButtonValue = GlobalFieldValues.SETTINGS;

  profileUrl = PublicAppRoutes.PROFILE;
  settingsUrl = PublicAppRoutes.SETTINGS;
  statsUrl = PublicAppRoutes.STATS;


  userData$!: Observable<PublicUser>;
  loading$!: Observable<boolean>;

  defaultProfileImage = PublicImagePaths.DEFAULT_PROFILE_IMAGE_ICON;

  
  constructor(
    private store: Store<RootStoreState.AppState>
  ) { }

  ngOnInit(): void {
    this.fetchUserData();
  }

  private fetchUserData(): void {
    this.userData$ = this.store.pipe(select(selectUserData)) as Observable<PublicUser>;
    this.loading$ = this.store.pipe(select(selectIsFetchingUser));
  }

}
