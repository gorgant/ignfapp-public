import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router, ActivatedRouteSnapshot, RouterStateSnapshot, Route, UrlSegment } from '@angular/router';
import { Store } from '@ngrx/store';
import { RootStoreState, AuthStoreSelectors, UserStoreSelectors, AuthStoreActions } from 'src/app/root-store';
import { take, switchMap, catchError, } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { UiService } from '../services/ui.service';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanLoad {

  constructor(
    private router: Router,
    private store$: Store<RootStoreState.AppState>,
    private uiService: UiService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean|Observable<boolean> {

    return this.store$.select(AuthStoreSelectors.selectIsLoggedIn)
      .pipe(
        take(1),
        switchMap(isAuth => {
          // If user is authenticated, wait for user data to load into store, then open up route guard
          if (isAuth) {
            // Inspired by https://stackoverflow.com/a/46386082/6572208
            return new Observable<boolean>((observer) => {
              this.store$.select(UserStoreSelectors.selectUserData)
                .subscribe(userLoaded => {
                  if (userLoaded) {
                    this.store$.dispatch(AuthStoreActions.authGuardValidated());
                    observer.next(true);
                    observer.complete();
                  }
                });
            });
          } else {
          // If user not authenticated, route to login
            this.router.navigate([PublicAppRoutes.PRELAUNCH], { queryParams: { returnUrl: state.url }}); // TODO: Once app is live, change route from PRELAUNCH to LOGIN
            this.uiService.showSnackBar('Please login to continue.', 6000);
            return of(false);
          }
        }),
        catchError(error => {
          this.store$.dispatch(AuthStoreActions.authGuardFailed({error}));
          this.uiService.showSnackBar('AuthGuard error. Please refresh the page and try again.', 10000);
          return of(error);
        })
      );
  }

  canLoad(route: Route, segments: UrlSegment[]): boolean | Observable<boolean> {

    return this.store$.select(AuthStoreSelectors.selectIsLoggedIn)
      .pipe(
        take(1),
        switchMap(isAuth => {
          // If user is authenticated, wait for user data to load into store, then open up route guard
          if (isAuth) {
            // Inspired by https://stackoverflow.com/a/46386082/6572208
            return new Observable<boolean>((observer) => {
              this.store$.select(UserStoreSelectors.selectUserData)
                .subscribe(userLoaded => {
                  if (userLoaded) {
                    this.store$.dispatch(AuthStoreActions.authGuardValidated());
                    observer.next(true);
                    observer.complete();
                  }
                });
            });
          } else {
          // If user not authenticated, route to login
            const returnUrl = this.covertSegmentsToReturnUrl(segments);
            this.router.navigate([PublicAppRoutes.PRELAUNCH], { queryParams: { returnUrl }}); // TODO: Once app is live, change route from PRELAUNCH to LOGIN
            this.uiService.showSnackBar('Please login to continue.', 6000);
            return of(false);
          }
        }),
        catchError(error => {
          this.store$.dispatch(AuthStoreActions.authGuardFailed({error}));
          this.uiService.showSnackBar('AuthGuard error. Please refresh the page and try again.', 10000);
          return of(error);
        })
      );
}

  // Collect segments and convert to a return url string
  private covertSegmentsToReturnUrl(segments: UrlSegment[]) {
    const segmentArray = segments.map(segment => segment.path);
    const returnUrl = segmentArray.join('/');
    return returnUrl;
  }
}
