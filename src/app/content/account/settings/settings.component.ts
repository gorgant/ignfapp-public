import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { AuthStoreActions } from 'src/app/root-store';
import { MatButtonModule } from '@angular/material/button';
import { UiService } from 'src/app/core/services/ui.service';
@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    imports: [MatButtonModule]
})
export class SettingsComponent implements OnInit {

  APP_VERSION_FIELD_VALUE = GlobalFieldValues.APP_VERSION;
  LOGOUT_BUTTON_VALUE = GlobalFieldValues.LOGOUT;
  SETTINGS_TITLE_VALUE = GlobalFieldValues.SETTINGS;
  
  private store$ = inject(Store);
  uiService = inject(UiService);

  constructor(
    
  ) { }

  ngOnInit(): void {
    
  }

  onLogout(): void {
    console.log('Logging out user');
    this.store$.dispatch(AuthStoreActions.logout());
  }
}
