import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, Route, UrlSegment, CanActivateFn, UrlTree, CanMatchFn } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { UserStoreSelectors, AuthStoreActions, UserStoreActions } from 'src/app/root-store';
import { switchMap, catchError, take, withLatestFrom, map, filter } from 'rxjs/operators';
import { Observable, combineLatest, of, throwError } from 'rxjs';
import { UiService } from '../services/ui.service';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { AuthService } from '../services/auth.service';
import { PublicUser } from 'shared-models/user/public-user.model';

// Collect segments and convert to a return url string
const covertSegmentsToReturnUrl = (segments: UrlSegment[]) => {
  const segmentArray = segments.map(segment => segment.path);
  const returnUrl = segmentArray.join('/');
  console.log('Produced this returnUrl', returnUrl);
  return returnUrl;
}

const fetchUserData = (publicUserId: string, store$: Store): Observable<PublicUser> => {
  return store$.select(UserStoreSelectors.selectPublicUserData)
    .pipe(
      withLatestFrom(store$.pipe(select(UserStoreSelectors.selectFetchPublicUserProcessing))),
      map(([userData, isFetchingUser]) => {
        if (!userData && !isFetchingUser) {
          console.log('No user data in store, fetching from database');
          store$.dispatch(UserStoreActions.fetchPublicUserRequested({ publicUserId }));
        }
        return userData;
      }),
      filter(userData => !!userData),
      map(userData => userData!)
    );
} 

const redirectToLogin = (returnUrl: string, router: Router) => {
  // This if-statement prevents an infinite loop
  if (`/${returnUrl}` !== PublicAppRoutes.AUTH_LOGIN) {
    console.log('Redirecting to this returnUrl', returnUrl);
    router.navigate([PublicAppRoutes.AUTH_LOGIN], { queryParams: { returnUrl } });
  } else {
    console.log('Return url is already login!');
  }
}

let loopProtectionCount = 0;

const getAuthGuardResult = (returnUrl: string, guardType: 'canActivate' | 'canLoad') => {
  console.log(`Authguard ${guardType}: triggered`);
  const authService = inject(AuthService);
  const router = inject(Router);
  const uiService = inject(UiService);
  const store$ = inject(Store);

  // Prevents unauthorized users from accessing the app
  // Fetch cached data if it exists, if so, fetch user db data, and either way process the routes accordingly
  return authService.fetchCachedUserData()
    .pipe(
      switchMap(authResults => {
        uiService.routeGuardProcessing = true;
        let userData: Observable<PublicUser | undefined> = of(undefined);
        if (authResults?.id) {
          userData = fetchUserData(authResults.id, store$);
        }
        return combineLatest([userData, of(authResults)]); // If this isn't pushing authResults through, then try withLatestFrom instead
      }),
      map(([userData, authResults]) => {
        loopProtectionCount++;

        if (loopProtectionCount > 10) {
          console.log('Loop protection triggered');
          uiService.routeGuardProcessing = false;
          throw Error('Loop protection triggered, halting function');
        }

        const userLoggedIn = authResults && userData;
        const emailVerifiedInAuth = authResults?.emailVerified;
        const emailVerifiedInDb = userData?.emailVerified;

        // Redirect to login if no auth present
        if (!userLoggedIn) {
          console.log(`AuthGuard ${guardType}: user not authenticated, routing to login screen`);
          uiService.showSnackBar('Please login to continue.', 6000);
          redirectToLogin(returnUrl, router);
          uiService.routeGuardProcessing = false;
          return false;
        }

        // Redirect to login if email not verified
        if (!emailVerifiedInAuth || !emailVerifiedInDb) {
          console.log(`AuthGuard ${guardType}: email not verified, routing to login screen`);
          uiService.showSnackBar('Please verify your email to continue. Check your inbox.', 10000);
          redirectToLogin(returnUrl, router);
          uiService.routeGuardProcessing = false;
          return false;
        }

        console.log(`AuthGuard ${guardType}: auth present and email verified in both auth and db, proceeding with route request`);

        // Otherwise proceed
        uiService.routeGuardProcessing = false;
        return true;
      }),
      catchError(error => {
          store$.dispatch(AuthStoreActions.authGuardFailed({ error }));
          uiService.showSnackBar(`AuthGuard ${guardType} error. Please refresh the page and try again.`, 10000);
          return throwError(() => new Error(error));
      })
    );
} 

export const authGuardCanActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const returnUrl = state.url;
  return getAuthGuardResult(returnUrl, 'canActivate');
}

export const authGuardCanLoad: CanMatchFn = (route: Route, segments: UrlSegment[]): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> => {
  const returnUrl = covertSegmentsToReturnUrl(segments);
  return getAuthGuardResult(returnUrl, 'canLoad');
}
