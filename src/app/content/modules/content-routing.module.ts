import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'account',
    loadChildren: () => import('../components/account/modules/account.module').then(m => m.AccountModule)
  },
  {
    path: 'browse',
    loadChildren: () => import('../components/browse/modules/browse.module').then(m => m.BrowseModule)
  },
  {
    path: 'workout',
    loadChildren: () => import('../components/workout/modules/workout.module').then(m => m.WorkoutModule)
  },
  {
    path: '',
    redirectTo: 'workout',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContentRoutingModule { }
