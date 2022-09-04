import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { AuthStoreActions, RootStoreState, UserStoreActions } from 'src/app/root-store';
import { selectPublicUserData } from 'src/app/root-store/user-store/selectors';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  logoutButtonValue = GlobalFieldValues.LOGOUT;
  
  userData$!: Observable<PublicUser>;

  constructor(
    private store$: Store<RootStoreState.AppState>
  ) { }

  ngOnInit(): void {
  }

  fetchUserData(): void {
    this.userData$ = this.store$.pipe(select(selectPublicUserData)) as Observable<PublicUser>;
  }

  onLogout(): void {
    console.log('Logging out user');
    this.store$.dispatch(AuthStoreActions.logout());
    // this.store$.dispatch(UserStoreActions.purgeUserData());
  }
}
