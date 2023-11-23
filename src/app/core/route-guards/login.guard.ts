import { inject, signal } from '@angular/core';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn, UrlTree } from '@angular/router';
import { Observable, combineLatest, of, throwError } from 'rxjs';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { AuthService } from '../services/auth.service';
import { Store, select } from '@ngrx/store';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UserStoreSelectors, UserStoreActions, AuthStoreActions } from 'src/app/root-store';
import { UiService } from '../services/ui.service';
import { AuthResultsData } from 'shared-models/auth/auth-data.model';
import { FirebaseError } from '@angular/fire/app';

let loopProtectionCount = 0;

// Prevents logged in users from accessing the auth pages
// Fetch cached data if it exists, if so, fetch user db data, and either way process the routes accordingly
export const loginGuardCanActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
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

  const processUserRouting = (userData: PublicUser | null, authData: AuthResultsData | null): boolean => {
    const userLoggedIn = authData;
    const emailVerifiedInAuth = authData?.emailVerified;
    const emailVerifiedInDb = userData?.emailVerified;

    // Permit user who isn't logged in to access auth page
    if (!userLoggedIn) {
      console.log('LoginGuard canActivate: no credentials present. Access to auth page permitted');
      resetComponentState();
      return true;
    }

    // Permit user who hasn't verified email to access auth page (will automatically display the verify email request to user)
    if (!emailVerifiedInAuth || !emailVerifiedInDb) {
      console.log('LoginGuard canActivate: credentials present but email not verified. Acccess to auth page permitted.');  
      resetComponentState();
      return true;
    }

    // Otherwise the user is logged in, in which case route to the requested url (or training dashboard)
    console.log('Auth credentials present and email verified in auth and db. Access to auth page denied. Routing to requested URL.');
    if (state.url === PublicAppRoutes.AUTH_LOGIN || state.url === PublicAppRoutes.AUTH_SIGNUP) {
      // This prevents an infinite loop if coming directly from clean login path
      router.navigate([PublicAppRoutes.TRAIN_DASHBOARD]);
    } else {
      // Otherwise pull the return url and route to that
      const returnUrl = route.queryParamMap.get('returnUrl') || '/';
      router.navigate([returnUrl]);
    }
    resetComponentState();
    return false;
  }

  console.log('LoginGuard canActivate activated');
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
        if (loopProtectionCount > 10) {
          console.log('Loop protection triggered');
          resetComponentState();
          throw Error('Loop protection triggered, halting function');
        }
        return processUserRouting(userData, authData);
      }),
      catchError(error => {
        console.log('Error in component:', error);
        uiService.showSnackBar(`Something went wrong. Please try again.`, 7000);
        resetComponentState();
        store$.dispatch(AuthStoreActions.authGuardFailed({ error }));
        store$.dispatch(AuthStoreActions.logout());
        return throwError(() => new Error(error));
      })
    );
}


