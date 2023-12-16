import { Component, OnInit, inject } from '@angular/core';
import { UiService } from './core/services/ui.service';
import { GlobalFieldValues } from 'shared-models/content/string-vals.model';
import { RouterOutlet } from '@angular/router';
import { ProcessingSpinnerComponent } from "./shared/components/processing-spinner/processing-spinner.component";
import { NavBarComponent } from "./navigation/components/nav-bar/nav-bar.component";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [RouterOutlet, ProcessingSpinnerComponent, NavBarComponent]
})
export class AppComponent implements OnInit {
  TITLE = 'ignfapp-public';
  APP_VERSION = '0.2.5'

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
