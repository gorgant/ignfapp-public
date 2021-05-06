import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'prelaunch',
    loadChildren: () => import('../components/prelaunch/modules/prelaunch.module').then(m => m.PrelaunchModule)
  },
  {
    path: '',
    redirectTo: 'prelaunch', // TODO: Change to dashboard once app is live
    pathMatch: 'full'
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContentRoutingModule { }
