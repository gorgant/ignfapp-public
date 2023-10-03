import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmailVerificationComponent } from '../components/email-verification/email-verification.component';
import { LoginComponent } from '../components/login/login.component';
import { SignupComponent } from '../components/signup/signup.component';
import { loginGuardCanActivate } from 'src/app/core/route-guards/login.guard';

const routes: Routes = [
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [loginGuardCanActivate]
   },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuardCanActivate]
   },
   {
    path: 'email-verification',
    component: EmailVerificationComponent,
   },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
