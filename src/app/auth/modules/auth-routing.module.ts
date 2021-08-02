import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginGuard } from 'src/app/core/route-guards/login.guard';
import { EmailVerificationComponent } from '../components/email-verification/email-verification.component';
import { LoginComponent } from '../components/login/login.component';
import { SignupComponent } from '../components/signup/signup.component';

const routes: Routes = [
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [LoginGuard]
   },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginGuard]
   },
   {
    path: 'email-verification/:uId/:eId/:isPl',
    component: EmailVerificationComponent,
   },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
