import { Routes } from '@angular/router';

export const CONTENT_ROUTES: Routes = [
  {
    path: 'account',
    loadChildren: () => import('./components/account/account-routes').then(m => m.ACCOUNT_ROUTES)
  },
  {
    path: 'browse',
    loadChildren: () => import('./components/browse/browse-routes').then(m => m.BROWSE_ROUTES)
  },
  {
    path: 'build',
    loadChildren: () => import('./components/build/build-routes').then(m => m.BUILD_ROUTES)
  },
  {
    path: 'train',
    loadChildren: () => import('./components/train/train-routes').then(m => m.TRAIN_ROUTES)
  },
  {
    path: '',
    redirectTo: 'train',
    pathMatch: 'full'
  },
];