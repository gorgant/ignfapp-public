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
    path: 'build',
    loadChildren: () => import('../components/build/modules/build.module').then(m => m.BuildModule)
  },
  {
    path: 'train',
    loadChildren: () => import('../components/train/modules/train.module').then(m => m.TrainModule)
  },
  {
    path: '',
    redirectTo: 'train',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContentRoutingModule { }
