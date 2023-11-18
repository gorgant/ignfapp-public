import { inject } from '@angular/core';
import { filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn, UrlTree } from '@angular/router';
import { Observable, combineLatest, of } from 'rxjs';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { AuthService } from '../services/auth.service';
import { Store, select } from '@ngrx/store';
import { PublicUser } from 'shared-models/user/public-user.model';
import { UserStoreSelectors, UserStoreActions } from 'src/app/root-store';
import { UiService } from '../services/ui.service';

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

let loopProtectionCount = 0;

// Prevents logged in users from accessing the auth pages
// Fetch cached data if it exists, if so, fetch user db data, and either way process the routes accordingly
export const loginGuardCanActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const uiService = inject(UiService);
  const store$ = inject(Store);
  
  console.log('LoginGuard canActivate activated');
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

        const userLoggedIn = authResults;
        const emailVerifiedInAuth = authResults?.emailVerified;
        const emailVerifiedInDb = userData?.emailVerified;

        // Permit user who isn't logged in to access auth page
        if (!userLoggedIn) {
          console.log('LoginGuard canActivate: no credentials present. Access to auth page permitted');
          uiService.routeGuardProcessing = false;
          return true;
        }

        // Permit user who hasn't verified email to access auth page (will automatically display the verify email request to user)
        if (!emailVerifiedInAuth || !emailVerifiedInDb) {
          console.log('LoginGuard canActivate: credentials present but email not verified. Acccess to auth page permitted.');  
          uiService.routeGuardProcessing = false;
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
        uiService.routeGuardProcessing = false;
        return false;
      }),
    );
}


