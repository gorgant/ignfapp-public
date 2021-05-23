import { NgModule } from '@angular/core';

import { AuthRoutingModule } from './auth-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { LoginComponent } from '../components/login/login.component';
import { SignupComponent } from '../components/signup/signup.component';
import { StoreModule } from '@ngrx/store';
import * as fromAuth from '../reducers';
import { EmailVerificationComponent } from '../components/email-verification/email-verification.component';


@NgModule({
  declarations: [
    LoginComponent,
    SignupComponent,
    EmailVerificationComponent
  ],
  imports: [
    SharedModule,
    AuthRoutingModule,
    StoreModule.forFeature(fromAuth.authFeatureKey, fromAuth.reducers, { metaReducers: fromAuth.metaReducers })
  ]
})
export class AuthModule { }
