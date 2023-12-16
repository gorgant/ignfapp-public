import { Routes } from "@angular/router";
import { loginGuardCanActivate } from "../core/route-guards/login.guard";
import { EmailVerificationComponent } from "./components/email-verification/email-verification.component";
import { LoginComponent } from "./components/login/login.component";
import { SignupComponent } from "./components/signup/signup.component";

export const AUTH_ROUTES: Routes = [
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