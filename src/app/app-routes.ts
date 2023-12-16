import { Routes } from '@angular/router';
import { authGuardCanLoad, authGuardCanActivate } from './core/route-guards/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    loadChildren: () => import('./content/content-routes').then(m => m.CONTENT_ROUTES),
    canLoad: [authGuardCanLoad],
    canActivate: [authGuardCanActivate]
  },
  {
    path: '**', 
    redirectTo: '',
    pathMatch: 'full'
  },

];