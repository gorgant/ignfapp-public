import { NgModule } from '@angular/core';

import { AuthRoutingModule } from './auth-routing.module';

import { LoginComponent } from '../components/login/login.component';
import { EmailVerificationComponent } from '../components/email-verification/email-verification.component';
import { SignupFormComponent } from '../components/signup-form/signup-form.component';
import { AuthHeaderComponent } from '../components/auth-header/auth-header.component';
import { SignupComponent } from '../components/signup/signup.component';
import { LoginFormComponent } from '../components/login-form/login-form.component';
import { ResetPasswordDialogueComponent } from '../components/reset-password-dialogue/reset-password-dialogue.component';
import { LoginWithThirdPartyComponent } from '../components/login-with-third-party/login-with-third-party.component';


@NgModule({
    imports: [
    AuthRoutingModule,
    LoginComponent,
    LoginFormComponent,
    SignupComponent,
    SignupFormComponent,
    EmailVerificationComponent,
    AuthHeaderComponent,
    ResetPasswordDialogueComponent,
    LoginWithThirdPartyComponent,
]
})
export class AuthModule { }
