import { Injectable, Signal, inject, signal } from '@angular/core';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { NoNavBarUrls } from 'shared-models/routes-and-paths/app-routes.model';
import { filter, tap } from 'rxjs/operators';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DOCUMENT, Location } from '@angular/common';
import { AddTrainingSessionUrlParamsKeys } from 'shared-models/train/training-plan.model';

@Injectable({
  providedIn: 'root'
})
export class UiService {

  private history: string[] = []
  private $privateHideNavBar = signal(true);
  private $privateRouteGuardProcessing = signal(false); // Accessed by route guards to update UI loading symbol
  private $privateScreenIsMobile = signal(false);
  private window: Window;

  private snackbar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private location = inject(Location);
  private route = inject(ActivatedRoute);

  constructor() {
    this.monitorScreenSize();
    this.evaluateNavBarVisibility();
    this.monitorNavigationHistory();
    this.window =this.document.defaultView as Window;
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
      .pipe(
        tap((state: BreakpointState) => {
          if (state.matches) {
            console.log('Mobile screen detected');
            this.$privateScreenIsMobile.set(true);
          } else {
            console.log('Desktop screen detected');
            this.$privateScreenIsMobile.set(false);
          }
        })
      )
      .subscribe();

  }

  get screenWidth(): number {
    return this.window.innerWidth;
  }

  get $screenIsMobile(): Signal<boolean> {
    return this.$privateScreenIsMobile.asReadonly();
  }

  private evaluateNavBarVisibility() {
    this.router.events.pipe(
      filter(event =>
        event instanceof NavigationEnd
      ),
      tap(event => {
        console.log('Evaluating url validity');
        const url = this.router.url;
        const addTrainingSessionString = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlParamsKeys.TRAINING_PLAN_BUILDER_REQUEST);
        const addTrainingSessionRequest = addTrainingSessionString ? JSON.parse(addTrainingSessionString) as boolean : false;
        const invalidUrl = NoNavBarUrls.some(invalidUrl => url.includes(invalidUrl)); // Courtesy of: https://stackoverflow.com/a/43615512/6572208
        const hideNavBar = addTrainingSessionRequest || invalidUrl;
        this.$privateHideNavBar.set(hideNavBar);
      })
    ).subscribe();
  }

  get $hideNavBar(): Signal<boolean> {
    return this.$privateHideNavBar.asReadonly();
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

  set routeGuardProcessing(isProcessing: boolean) {
    this.$privateRouteGuardProcessing.set(isProcessing);
  }

  get $routeGuardProcessing(): Signal<boolean> {
    return this.$privateRouteGuardProcessing.asReadonly();
  }

}
