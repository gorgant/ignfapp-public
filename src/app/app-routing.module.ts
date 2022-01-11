import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/route-guards/auth.guard';

const routes: Routes = [
  {
    path: 'prelaunch',
    loadChildren: () => import('./prelaunch/modules/prelaunch.module').then(m => m.PrelaunchModule)
  },
  {
    path: '**',
    redirectTo: 'prelaunch',
    pathMatch: 'full'
  },
  {
    path: '',
    loadChildren: () => import('./content/modules/content.module').then(m => m.ContentModule),
    canLoad: [AuthGuard],
    canActivate: [AuthGuard]
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
