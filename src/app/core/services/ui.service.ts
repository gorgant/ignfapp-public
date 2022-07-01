import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { environment } from 'src/environments/environment';
import { NoNavBarUrls } from 'shared-models/routes-and-paths/app-routes.model';
import { filter, tap } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { RootStoreState, UiStoreActions } from 'src/app/root-store';

@Injectable({
  providedIn: 'root'
})
export class UiService {

  private sideNavSignal$ = new Subject<void>();
  private screenIsMobile$ = new BehaviorSubject(true);
  private productionEnvironment: boolean = environment.production;

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private snackbar: MatSnackBar,
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) {
    this.monitorScreenSize();
    this.evaluateNavBarVisibility();
   }

  dispatchSideNavClick() {
    this.sideNavSignal$.next();
  }

  showSnackBar(message: string, duration: number, action: string = 'Dismiss', ) {
    const config = new MatSnackBarConfig();
    config.duration = duration;
    config.panelClass = ['custom-snack-bar']; // CSS managed in global styles.css

    const snackBarRef = this.snackbar.open(message, action, config);

    snackBarRef.onAction().subscribe(() => {
      snackBarRef.dismiss();
    });
  }

  private monitorScreenSize() {
    this.breakpointObserver.observe(['(max-width: 959px)'])
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          console.log('Mobile screen detected');
          this.screenIsMobile$.next(true);
        } else {
          console.log('Desktop screen detected');
          this.screenIsMobile$.next(false);
        }
      });

  }

  get screenIsMobile(): Observable<boolean> {
    return this.screenIsMobile$;
  }

  private evaluateNavBarVisibility() {

    this.router.events.pipe(
      filter(event =>
        event instanceof NavigationEnd
      ),
      tap(event => {
        console.log('Evaluating url validity');
        const url = this.router.url;
        const hideNavBar = NoNavBarUrls.some(invalidUrl => url.includes(invalidUrl)); // Courtesy of: https://stackoverflow.com/a/43615512/6572208
        if (hideNavBar) {
          this.store$.dispatch(UiStoreActions.hideNavBar());
          return;
        } 
        this.store$.dispatch(UiStoreActions.showNavBar());
      }),
    ).subscribe();
  }
}
