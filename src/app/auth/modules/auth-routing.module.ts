import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '../components/login/login.component';
import { SignupComponent } from '../components/signup/signup.component';

const routes: Routes = [
  {
    path: 'signup',
    component: SignupComponent, // TODO: Add a canActivate Login Guard (see Zentimer)
   },
  {
    path: 'login',
    component: LoginComponent, // TODO: Add a canActivate Login Guard (see Zentimer)
   },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
