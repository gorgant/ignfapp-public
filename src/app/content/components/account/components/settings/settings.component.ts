import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { AuthStoreActions } from 'src/app/root-store';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  LOGOUT_BUTTON_VALUE = GlobalFieldValues.LOGOUT;
  SETTINGS_TITLE_VALUE = GlobalFieldValues.SETTINGS;
  
  private store$ = inject(Store);

  constructor(
    
  ) { }

  ngOnInit(): void {
    
  }

  onLogout(): void {
    console.log('Logging out user');
    this.store$.dispatch(AuthStoreActions.logout());
  }
}
