import { Routes } from '@angular/router';

export const CONTENT_ROUTES: Routes = [
  {
    path: 'account',
    loadChildren: () => import('./account/account.routes').then(m => m.ACCOUNT_ROUTES)
  },
  {
    path: 'browse',
    loadChildren: () => import('./browse/browse.routes').then(m => m.BROWSE_ROUTES)
  },
  {
    path: 'build',
    loadChildren: () => import('./build/build.routes').then(m => m.BUILD_ROUTES)
  },
  {
    path: 'train',
    loadChildren: () => import('./train/train.routes').then(m => m.TRAIN_ROUTES)
  },
  {
    path: '',
    redirectTo: 'train',
    pathMatch: 'full'
  },
];