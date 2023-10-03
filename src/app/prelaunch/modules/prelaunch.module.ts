import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { PlLandingPageComponent } from '../components/pl-landing-page/pl-landing-page.component';
import { PrelaunchRoutingModule } from './prelaunch-routing.module';



@NgModule({
  declarations: [
    PlLandingPageComponent,
  ],
  imports: [
    SharedModule,
    PrelaunchRoutingModule
  ]
})
export class PrelaunchModule { }
