import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router, ActivatedRouteSnapshot, RouterStateSnapshot, Route, UrlSegment } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { RootStoreState, UserStoreSelectors, AuthStoreActions, UserStoreActions } from 'src/app/root-store';
import { switchMap, catchError, take, withLatestFrom } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { UiService } from '../services/ui.service';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanLoad {

  constructor(
    private router: Router,
    private store$: Store<RootStoreState.AppState>,
    private uiService: UiService,
    private authService: AuthService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean|Observable<boolean> {

    console.log('Authguard canActivate triggered');

    return this.authService.fetchCachedUserData()
      .pipe(
        switchMap(authResults => {
          // Inspired by https://stackoverflow.com/a/46386082/6572208
          return new Observable<boolean>(observer => {
            if (authResults && authResults.emailVerified) {
              this.store$.select(UserStoreSelectors.selectUserData)
                .pipe(
                  take(1),
                  withLatestFrom(this.store$.pipe(select(UserStoreSelectors.selectIsFetchingUser)))
                )
                .subscribe(([userData, isFetchingUser]) => {
                  if (!userData && !isFetchingUser) {
                    console.log('AuthGuard canActivate: creds present and email verified, fetching user data');
                    this.store$.dispatch(UserStoreActions.fetchUserRequested({userId: authResults?.id as string})); // Establish a realtime link to user data in store to mointor email verification status
                  }
                  this.store$.dispatch(AuthStoreActions.authGuardValidated());
                  observer.next(true);
                  observer.complete();
                });
            } else {
              // If user not authenticated or email not verified, route to login
              console.log('AuthGuard canActivate: user not authenticated, routing to login screen');
              this.router.navigate([PublicAppRoutes.LOGIN], { queryParams: { returnUrl: state.url }});
              if (authResults && !authResults.emailVerified) {
                this.uiService.showSnackBar('Please verify your email to continue.', 6000);  
              } else {
                this.uiService.showSnackBar('Please login to continue.', 6000);
              }
              observer.next(false);
              observer.complete();
            }
          })
        }),
        catchError(error => {
          this.store$.dispatch(AuthStoreActions.authGuardFailed({error}));
          this.uiService.showSnackBar('AuthGuard error. Please refresh the page and try again.', 10000);
          return of(error);
        })
      );

  }

  canLoad(route: Route, segments: UrlSegment[]): boolean | Observable<boolean> {

    console.log('Authguard canLoad triggered');

    return this.authService.fetchCachedUserData()
      .pipe(
        switchMap(authResults => {
          // Inspired by https://stackoverflow.com/a/46386082/6572208
          return new Observable<boolean>(observer => {
            if (authResults && authResults.emailVerified) {
              this.store$.select(UserStoreSelectors.selectUserData)
                .pipe(
                  take(1),
                  withLatestFrom(this.store$.pipe(select(UserStoreSelectors.selectIsFetchingUser)))
                )
                .subscribe(([userData, isFetchingUser]) => {
                  if (!userData && !isFetchingUser) {
                    console.log('AuthGuard canLoad: creds present and email verified, fetching user data');
                    this.store$.dispatch(UserStoreActions.fetchUserRequested({userId: authResults?.id as string})); // Establish a realtime link to user data in store to mointor email verification status
                  }
                  this.store$.dispatch(AuthStoreActions.authGuardValidated());
                  observer.next(true);
                  observer.complete();
                });
            } else {
              // If user not authenticated, route to login
              console.log('AuthGuard canLoad: user not authenticated, routing to login screen');
              const returnUrl = this.covertSegmentsToReturnUrl(segments);
              this.router.navigate([PublicAppRoutes.LOGIN], { queryParams: { returnUrl }});
              if (authResults && !authResults.emailVerified) {
                this.uiService.showSnackBar('Please verify your email to continue.', 6000);  
              } else {
                this.uiService.showSnackBar('Please login to continue.', 6000);
              }
              observer.next(false);
              observer.complete();
            }
          })
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
