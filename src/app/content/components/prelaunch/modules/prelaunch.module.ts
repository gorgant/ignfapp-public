import { NgModule } from '@angular/core';
import { PlSignupComponent } from '../components/pl-signup/pl-signup.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { PlLandingPageComponent } from '../components/pl-landing-page/pl-landing-page.component';
import { PrelaunchRoutingModule } from './prelaunch-routing.module';



@NgModule({
  declarations: [
    PlLandingPageComponent,
    PlSignupComponent
  ],
  imports: [
    SharedModule,
    PrelaunchRoutingModule
  ]
})
export class PrelaunchModule { }
