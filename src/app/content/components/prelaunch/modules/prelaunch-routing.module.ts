import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlLandingPageComponent } from '../components/pl-landing-page/pl-landing-page.component';

const routes: Routes = [
  {
    path: '',
    component: PlLandingPageComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrelaunchRoutingModule { }
