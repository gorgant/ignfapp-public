import { Inject, Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { NoNavBarUrls } from 'shared-models/routes-and-paths/app-routes.model';
import { filter, tap } from 'rxjs/operators';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { RootStoreState, UiStoreActions } from 'src/app/root-store';
import { DOCUMENT, Location } from '@angular/common';
import { AddTrainingPlanUrlParamsKeys } from 'shared-models/train/training-plan.model';

@Injectable({
  providedIn: 'root'
})
export class UiService {

  private sideNavSignal$ = new Subject<void>();
  private screenIsMobile$ = new BehaviorSubject(true);
  private window: Window;
  private history: string[] = []

  constructor(
    private store$: Store<RootStoreState.AppState>,
    private snackbar: MatSnackBar,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
    private location: Location,
    private route: ActivatedRoute,
  ) {
    this.monitorScreenSize();
    this.evaluateNavBarVisibility();
    this.monitorNavigationHistory();
    this.window =this.document.defaultView as Window;
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



  get screenWidth() {
    return this.window.innerWidth;
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
        const addTrainingSessionString = this.route.snapshot.queryParamMap.get(AddTrainingPlanUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST);
        const addTrainingSessionRequest = addTrainingSessionString ? JSON.parse(addTrainingSessionString) as boolean : false;
        const invalidUrl = NoNavBarUrls.some(invalidUrl => url.includes(invalidUrl)); // Courtesy of: https://stackoverflow.com/a/43615512/6572208
        const hideNavBar = addTrainingSessionRequest || invalidUrl;
        if (hideNavBar) {
          this.store$.dispatch(UiStoreActions.hideNavBar());
          return;
        } 
        this.store$.dispatch(UiStoreActions.showNavBar());
      }),
    ).subscribe();
  }

  // Used to avoid a back naviagation request when no navigation history available (e.g., user just loaded app)
  private monitorNavigationHistory() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.history.push(event.urlAfterRedirects)
      }
    })
  }

  // Courtesy of https://nils-mehlhorn.de/posts/angular-navigate-back-previous-page
  routeUserToPreviousPage(): void {
    this.history.pop();
    if (this.history.length > 0) {
      this.location.back()
    } else {
      this.router.navigateByUrl('/')
    }
  }

}
