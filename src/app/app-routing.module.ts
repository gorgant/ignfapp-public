import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuardCanActivate, authGuardCanLoad } from './core/route-guards/auth.guard';
import { prelaunchGuardCanActivate } from './core/route-guards/prelaunch.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/modules/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'prelaunch',
    loadChildren: () => import('./prelaunch/modules/prelaunch.module').then(m => m.PrelaunchModule)
  },
  {
    path: '',
    loadChildren: () => import('./content/modules/content.module').then(m => m.ContentModule),
    canLoad: [authGuardCanLoad],
    canActivate: [authGuardCanActivate, prelaunchGuardCanActivate] // TODO: Remove prelaunchGuard once app is live
  },
  {
    path: '**', 
    redirectTo: '',
    pathMatch: 'full'
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
