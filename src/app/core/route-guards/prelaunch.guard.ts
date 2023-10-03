import { inject } from "@angular/core";
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from "@angular/router";
import { Observable, filter, map, of, switchMap } from "rxjs";
import { Store, select } from "@ngrx/store";
import { UserStoreSelectors } from "src/app/root-store";
import { PublicAppRoutes } from "shared-models/routes-and-paths/app-routes.model";

// During the prelaunch phase, ensure that only admin can view the app. Otherwise, user is redirected to prelaunch page.
export const prelaunchGuardCanActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const store$ = inject(Store);
  const userData$ = store$.pipe(select(UserStoreSelectors.selectPublicUserData));
  const router = inject(Router);
  
  console.log('prelaunchGuard canActivate activated');

  return userData$.
    pipe(
      filter(userData => !!userData),
      map(userData => {
        if(userData?.isAdmin) {
          console.log('prelaunchGuard canActivate: user is admin, loading app');
          return true;
        } else {
          console.log('prelaunchGuard canActivate: user is not admin, redirecting to prelaunch');
          router.navigate([PublicAppRoutes.PRELAUNCH]);
          return false;
        }
      })
    )
}