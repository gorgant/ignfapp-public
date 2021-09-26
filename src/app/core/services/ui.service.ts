import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, of, Observable } from 'rxjs';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { environment } from 'src/environments/environment';
import { EnvironmentTypes } from 'shared-models/environments/env-vars.model';
import { NoNavBarUrls, PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { filter, map, tap } from 'rxjs/operators';
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
    private store: Store<RootStoreState.AppState>,
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

  monitorScreenSize() {
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
          this.store.dispatch(UiStoreActions.hideNavBar());
          return;
        } 
        this.store.dispatch(UiStoreActions.showNavBar());
      }),
    ).subscribe();
  }

  getEnvironmentType(): Observable<EnvironmentTypes> {
    const envType = this.productionEnvironment ? EnvironmentTypes.PRODUCTION : EnvironmentTypes.SANDBOX;
    console.log('Environment Type: ', envType);
    return of(envType);
  }

  // Remove spaces from url string
  removeSpacesFromString(stringWithSpaces: string): string {
    return stringWithSpaces.replace(/\s/g, '');
  }

  // Replace spaces with dashes and set lower case
  convertToFriendlyUrlFormat(stringWithSpaces: string): string {
    return stringWithSpaces.split(' ').join('-').toLowerCase();
  }

  // Firebase can't handle back slashes
  createOrReverseFirebaseSafeUrl = (url: string, reverse?: boolean): string => {
    if (reverse) {
      const urlWithSlashes = url.replace(/~1/g, '/'); // Revert to normal url
      return urlWithSlashes;
    }
    const removedProtocol = url.split('//').pop() as string;
    const replacedSlashes = removedProtocol.replace(/\//g, '~1');
    return replacedSlashes;
  }

  /**
   * Rounds a number to the nearest digits desired
   * @param numb Number to round
   * @param digitsToRoundTo Number of digits desired
   */
  // Courtesy of: https://stackoverflow.com/questions/15762768/javascript-math-round-to-two-decimal-places
  generateRoundedNumber(numb: number, digitsToRoundTo: number) {
    let n = numb;
    let digits = digitsToRoundTo;
    let negative = false;
    if (digits === undefined) {
        digits = 0;
    }
    if ( n < 0) {
      negative = true;
      n = n * -1;
    }
    const multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    n = parseFloat((Math.round(n) / multiplicator).toFixed(2));
    if ( negative ) {
        n = parseFloat((n * -1).toFixed(2));
    }
    return n;
  }


}
