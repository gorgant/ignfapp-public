import { NgModule } from '@angular/core';

import { PlLandingPageComponent } from '../components/pl-landing-page/pl-landing-page.component';
import { PrelaunchRoutingModule } from './prelaunch-routing.module';



@NgModule({
    imports: [
    PrelaunchRoutingModule,
    PlLandingPageComponent
]
})
export class PrelaunchModule { }
