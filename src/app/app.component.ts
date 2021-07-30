import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { RootStoreState, UiStoreActions } from './root-store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ignfapp-public';
  appVersion = '0.0.4'

  constructor(
    private store: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit(): void {
    this.initializeEnvironmentType();
  }

  private initializeEnvironmentType() {
    this.store.dispatch(UiStoreActions.environmentTypeRequested());
  }

}
