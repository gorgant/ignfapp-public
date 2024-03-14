import { inject, signal } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, Route, UrlSegment, CanActivateFn, UrlTree, CanMatchFn } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { UserStoreSelectors, AuthStoreActions, UserStoreActions } from 'src/app/root-store';
import { switchMap, catchError, take, withLatestFrom, map, filter } from 'rxjs/operators';
import { Observable, combineLatest, of, throwError } from 'rxjs';
import { UiService } from '../services/ui.service';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { AuthService } from '../services/auth.service';
import { PublicUser } from 'shared-models/user/public-user.model';
import { FirebaseError } from '@angular/fire/app';

// Collect segments and convert to a return url string
const covertSegmentsToReturnUrl = (segments: UrlSegment[]) => {
  const segmentArray = segments.map(segment => segment.path);
  const returnUrl = segmentArray.join('/');
  console.log('Produced this returnUrl', returnUrl);
  return returnUrl;
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

  const authData$ = authService.fetchAuthData();
  const userData$ = store$.select(UserStoreSelectors.selectPublicUserData);

  const $fetchPublicUserSubmitted = signal(false);
  const fetchPublicUserError$ = store$.pipe(select(UserStoreSelectors.selectFetchPublicUserError)) as Observable<FirebaseError>;
  const fetchPublicUserProcessing$ = store$.pipe(select(UserStoreSelectors.selectFetchPublicUserProcessing));

  const resetComponentState = () => {
    $fetchPublicUserSubmitted.set(false);
    uiService.routeGuardProcessing = false;
  };

  
  // Prevents unauthorized users from accessing the app
  // Fetch cached data if it exists, if so, fetch user db data, and either way process the routes accordingly
  return fetchPublicUserError$
    .pipe(
      switchMap(processingError => {
        
        if (processingError) {
          console.log('processingError detected, terminating pipe', processingError);
          resetComponentState();
          store$.dispatch(AuthStoreActions.authGuardFailed({ error: processingError }));
          store$.dispatch(AuthStoreActions.logout());
        }
        return authData$;
      }),
      withLatestFrom(fetchPublicUserError$, userData$),
      // Don't filter for authData here since we want to handle a situation where it doesn't exist
      filter(([authData, processingError, userData]) => !processingError), // Halts function if processingError detected
      switchMap(([authData, processingError, userData]) => {
        uiService.routeGuardProcessing = true; // This is a setter for a signal to initiate a spinner
        if (authData && !userData && !$fetchPublicUserSubmitted()) {
          $fetchPublicUserSubmitted.set(true);
          console.log('No user data in store, fetching from database');
          store$.dispatch(UserStoreActions.fetchPublicUserRequested({ publicUserId: authData.id }));
        }
        return userData$;
      }),
      withLatestFrom(authData$, fetchPublicUserProcessing$,),
      filter(([userData, authData, fetchProcessing]) => !fetchProcessing),
      map(([userData, authData, fetchProcessing]) => {
        loopProtectionCount++;

        if (loopProtectionCount > 50) {
          console.log('Loop protection triggered');
          resetComponentState();
          throw Error('Loop protection triggered, halting function');
        }

        const userLoggedIn = authData;
        const emailVerifiedInAuth = authData?.emailVerified;
        const emailVerifiedInDb = userData?.emailVerified;

        // Redirect to login if no auth present
        if (!userLoggedIn) {
          console.log(`AuthGuard ${guardType}: user not authenticated, routing to login screen`);
          uiService.showSnackBar('Please login to continue.', 6000);
          redirectToLogin(returnUrl, router);
          resetComponentState();
          return false;
        }

        // Redirect to login if email not verified
        if (!emailVerifiedInAuth || !emailVerifiedInDb) {
          console.log(`AuthGuard ${guardType}: email not verified, routing to login screen`);
          uiService.showSnackBar('Please verify your email to continue. Check your inbox.', 10000);
          redirectToLogin(returnUrl, router);
          resetComponentState();
          return false;
        }

        // Otherwise proceed
        console.log(`AuthGuard ${guardType}: auth present and email verified in both auth and db, proceeding with route request`);
        resetComponentState();
        return true;
      }),
      catchError(error => {
        console.log('Error in component:', error);
        uiService.showSnackBar(`AuthGuard ${guardType} error. Please refresh the page and try again.`, 10000);
        resetComponentState();
        store$.dispatch(AuthStoreActions.authGuardFailed({ error }));
        store$.dispatch(AuthStoreActions.logout());
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
