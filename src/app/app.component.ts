import { Component } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { RootStoreState, UiStoreActions, UiStoreSelectors } from './root-store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  TITLE = 'ignfapp-public';
  APP_VERSION = '0.0.7'

  showNavBar$!: Observable<boolean>;

  constructor(
    private store$: Store<RootStoreState.AppState>,
  ) { }

  ngOnInit(): void {
    this.initializeEnvironmentType();
    this.initializeNavBarVisibility();
  }

  private initializeEnvironmentType() {
    this.store$.dispatch(UiStoreActions.environmentTypeRequested());
  }

  private initializeNavBarVisibility() {
    this.showNavBar$ = this.store$.pipe(select(UiStoreSelectors.selectShowNavBar));
  }

}
