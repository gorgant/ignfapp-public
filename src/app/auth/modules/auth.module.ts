import { NgModule } from '@angular/core';

import { AuthRoutingModule } from './auth-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { LoginComponent } from '../components/login/login.component';
import { StoreModule } from '@ngrx/store';
import * as fromAuth from '../reducers';
import { EmailVerificationComponent } from '../components/email-verification/email-verification.component';
import { SignupFormComponent } from '../components/signup-form/signup-form.component';
import { AuthHeaderComponent } from '../components/auth-header/auth-header.component';
import { SignupComponent } from '../components/signup/signup.component';
import { LoginFormComponent } from '../components/login-form/login-form.component';


@NgModule({
  declarations: [
    LoginComponent,
    LoginFormComponent,
    SignupComponent,
    SignupFormComponent,
    EmailVerificationComponent,
    AuthHeaderComponent,
  ],
  imports: [
    SharedModule,
    AuthRoutingModule,
    StoreModule.forFeature(fromAuth.authFeatureKey, fromAuth.reducers, { metaReducers: fromAuth.metaReducers })
  ]
})
export class AuthModule { }
