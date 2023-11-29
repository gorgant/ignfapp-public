import { Component, OnInit, inject } from '@angular/core';
import { UiService } from './core/services/ui.service';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  TITLE = 'ignfapp-public';
  APP_VERSION = '0.2.3'

  VERIFYING_CREDENTIALS_SPINNER_MESSAGE = GlobalFieldValues.VERIFYING_CREDENTIALS;

  uiService = inject(UiService);
  
  ngOnInit(): void {
    this.configureAppCheck();
  }

  private configureAppCheck() {
    // Enable the debug token if running in localhost
    if (location.hostname === "localhost") {
      console.log('local host detected, enabling appcheck debug token');
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
  }
}
