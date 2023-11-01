import { Component, OnInit, inject } from '@angular/core';
import { take } from 'rxjs';
import { TestService } from './core/services/test.service';
import { UiService } from './core/services/ui.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  TITLE = 'ignfapp-public';
  APP_VERSION = '0.2.1'

  private testService = inject(TestService);
  uiService = inject(UiService);
  
  // private testService: TestService = inject(TestService);
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

  onTestFunction() {
    this.testService.testFunction('Testing the service bro!')
      .pipe(take(1))
      .subscribe(envType => {
        console.log('Received this env type in component', envType);
      })
  }
}
