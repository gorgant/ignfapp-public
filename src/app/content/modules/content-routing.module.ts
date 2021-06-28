import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('../components/dashboard/modules/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'prelaunch',
    loadChildren: () => import('../components/prelaunch/modules/prelaunch.module').then(m => m.PrelaunchModule)
  },
  {
    path: '',
    redirectTo: 'prelaunch', // TODO: Change default landing page to dashboard once app is live
    pathMatch: 'full'
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContentRoutingModule { }
