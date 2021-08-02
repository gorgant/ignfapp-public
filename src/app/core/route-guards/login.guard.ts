import { Injectable } from '@angular/core';
import { map, take } from 'rxjs/operators';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { RootStoreState, AuthStoreSelectors } from 'src/app/root-store';
import { Observable } from 'rxjs';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard {

  constructor(
    private router: Router,
    private store$: Store<RootStoreState.AppState>,
  ) { }

  // Prevents user from getting to login screen if already logged in
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.store$.select(AuthStoreSelectors.selectIsLoggedIn)
      .pipe(
        take(1),
        map(authStatus => {
          if (authStatus) {
            if (state.url === PublicAppRoutes.LOGIN || state.url === PublicAppRoutes.SIGNUP) {
              // This prevents an infinite loop if coming directly from clean login path
              this.router.navigate([PublicAppRoutes.DASHBOARD]);
            } else {
              // Otherwise pull the return url and route to that
              const returnUrl = route.queryParamMap.get('returnUrl') || '/';
              this.router.navigate([returnUrl]);
            }
            return false;
          }
          return true;
        }),
      );
  }
}
