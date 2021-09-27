import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { UserRegistrationButtonValues } from 'shared-models/forms/user-registration-form-vals.model';
import { PublicUser } from 'shared-models/user/public-user.model';
import { RootStoreState, AuthStoreActions, UserStoreActions } from 'src/app/root-store';
import { selectUserData } from 'src/app/root-store/user-store/selectors';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  logoutButtonValue = UserRegistrationButtonValues.LOGOUT;
  
  userData$!: Observable<PublicUser>;

  constructor(
    private store: Store<RootStoreState.AppState>
  ) { }

  ngOnInit(): void {
  }

  fetchUserData(): void {
    this.userData$ = this.store.pipe(select(selectUserData)) as Observable<PublicUser>;
  }

  onLogout(): void {
    console.log('Logging out user');
    this.store.dispatch(AuthStoreActions.logout());
    this.store.dispatch(UserStoreActions.purgeUserData());
  }

}
