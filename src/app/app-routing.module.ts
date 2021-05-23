import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./content/modules/content.module').then(m => m.ContentModule), // TODO: Add canLoad/canActivate Auth Guards (see zentimer)
  },
  // {
  //   path: 'email-verification',
  //   loadChildren: () => import('./auth/modules/auth.module').then(m => m.AuthModule),
  // },
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
