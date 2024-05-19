

import { Injectable, Signal, inject, signal } from '@angular/core';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { NoNavBarUrls, PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { filter, tap } from 'rxjs/operators';
import { ActivatedRoute, NavigationEnd, NavigationExtras, Router } from '@angular/router';
import { DOCUMENT, Location } from '@angular/common';
import { AddTrainingSessionUrlToPlanParamsKeys, TrainingPlanKeys, TrainingPlanVisibilityCategoryDbOption, ViewTrainingPlanQueryParams, ViewTrainingPlanQueryParamsKeys } from 'shared-models/train/training-plan.model';
import { SnackbarActions } from 'shared-models/utils/snackbar-actions.model';
import { DeviceDetectorService } from 'ngx-device-detector';
import { DeviceOSType } from 'shared-models/user-interface/device-os-types.model';
import { SwUpdate } from '@angular/service-worker';


@Injectable({
  providedIn: 'root'
})
export class UiService {

  private APP_VERSION = '0.2.8';

  private history: string[] = [];
  private $privateHideNavBar = signal(true);
  private $privateRouteGuardProcessing = signal(false); // Accessed by route guards to update UI loading symbol
  private $privateScreenIsMobile = signal(false);
  private $privateDeviceOS = signal('' as  DeviceOSType)
  private window: Window;

  private snackbar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private deviceDetector = inject(DeviceDetectorService);
  private swUpdate = inject(SwUpdate)

  constructor() {
    this.monitorScreenSize();
    this.evaluateNavBarVisibility();
    this.monitorNavigationHistory();
    this.monitorDeviceOS();
    this.window = this.document.defaultView as Window;
  }

  checkForAppUpdates() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          tap((event) => {
            console.log('Service worker version event detected', event);
            if (event.type === 'VERSION_READY') {
              if (confirm("A new version of IgnyteFit is available. Load New Version?")) {
                this.window.location.reload();
              }
            }
          })
        )
    }
  }

  get appVersion() {
    return this.APP_VERSION;
  }

  showSnackBar(message: string, duration: number, action: SnackbarActions = SnackbarActions.DISMISS) {
    const config = new MatSnackBarConfig();
    config.duration = duration;
    config.panelClass = ['custom-snack-bar']; // CSS managed in global styles.css

    const snackBarRef = this.snackbar.open(message, action, config);

    const trainingPlanId = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_ID) as string | undefined;
    const trainingPlanVisibilityCategory = this.route.snapshot.queryParamMap.get(TrainingPlanKeys.TRAINING_PLAN_VISIBILITY_CATEGORY) as TrainingPlanVisibilityCategoryDbOption | undefined;


    // Perform an action based on the action input
    snackBarRef.onAction().subscribe(() => {

      switch (action) {
        case SnackbarActions.DISMISS:
          snackBarRef.dismiss();
          break;
        case SnackbarActions.EDIT_PLAN:
          if (trainingPlanId && trainingPlanVisibilityCategory) {
            const queryParams: ViewTrainingPlanQueryParams = {
              [ViewTrainingPlanQueryParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: trainingPlanVisibilityCategory, // Ensures the user views training sessions vs plans
            };
            const navigationExtras: NavigationExtras = { queryParams };
            this.router.navigate([PublicAppRoutes.BUILD_EDIT_TRAINING_PLAN, trainingPlanId], navigationExtras);
          } else {
            this.router.navigate([PublicAppRoutes.BROWSE]);
          }
          break;
        case SnackbarActions.VIEW_MY_QUEUE:
          this.router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
          break;
        case SnackbarActions.VIEW_PLAN:
          if (trainingPlanId && trainingPlanVisibilityCategory) {
            const queryParams: ViewTrainingPlanQueryParams = {
              [ViewTrainingPlanQueryParamsKeys.TRAINING_PLAN_VISIBILITY_CATEGORY]: trainingPlanVisibilityCategory, // Ensures the user views training sessions vs plans
            };
            const navigationExtras: NavigationExtras = { queryParams };
            this.router.navigate([PublicAppRoutes.TRAIN_TRAINING_PLAN, trainingPlanId], navigationExtras);
          } else {
            this.router.navigate([PublicAppRoutes.BROWSE]);
          }
          break;
        default:
          snackBarRef.dismiss();
          break;
      }


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
      filter(event => event instanceof NavigationEnd
      ),
      tap(event => {
        console.log('Evaluating url validity');
        const url = this.router.url;
        const addTrainingSessionString = this.route.snapshot.queryParamMap.get(AddTrainingSessionUrlToPlanParamsKeys.TRAINING_PLAN_BUILDER_REQUEST);
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
        this.history.push(event.urlAfterRedirects);
      }
    });
  }

  private monitorDeviceOS() {
    this.$privateDeviceOS.set(this.deviceDetector.os as DeviceOSType);
    console.log('Detected this os', this.$privateDeviceOS());
  }

  get $deviceOS(): Signal<DeviceOSType> {
    return this.$privateDeviceOS.asReadonly();
  }

  // Courtesy of https://nils-mehlhorn.de/posts/angular-navigate-back-previous-page
  routeUserToPreviousPage(): void {
    this.history.pop();
    if (this.history.length > 0) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/');
    }
  }

  set routeGuardProcessing(isProcessing: boolean) {
    this.$privateRouteGuardProcessing.set(isProcessing);
  }

  get $routeGuardProcessing(): Signal<boolean> {
    return this.$privateRouteGuardProcessing.asReadonly();
  }

}
