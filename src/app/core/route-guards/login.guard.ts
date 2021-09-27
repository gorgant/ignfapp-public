import { Injectable } from '@angular/core';
import { map, take } from 'rxjs/operators';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard {

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  // Prevents user from getting to login screen if already logged in
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    console.log('Login guard activated');
    return this.authService.fetchCachedUserData()
      .pipe(
        take(1),
        map(authResultsData => {
          if (authResultsData) {
            if (state.url === PublicAppRoutes.LOGIN || state.url === PublicAppRoutes.SIGNUP) {
              // This prevents an infinite loop if coming directly from clean login path
              this.router.navigate([PublicAppRoutes.WORKOUT]);
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
