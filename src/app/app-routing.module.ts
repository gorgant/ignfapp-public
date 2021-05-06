import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'signup',
    loadChildren: () => import('./content/modules/content.module').then(m => m.ContentModule), // TODO: Swap out for auth module once auth is live
  },
  {
    path: 'login',
    loadChildren: () => import('./content/modules/content.module').then(m => m.ContentModule), // TODO: Swap out for auth module once auth is live
  },
  {
    path: '',
    loadChildren: () => import('./content/modules/content.module').then(m => m.ContentModule), // TODO: Add an auth route guard once auth is live
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
