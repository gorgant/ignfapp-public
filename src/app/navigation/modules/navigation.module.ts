import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterModule } from '@angular/router';
import { NavBarComponent } from '../components/nav-bar/nav-bar.component';

@NgModule({
  declarations: [
    NavBarComponent,
  ],
  imports: [
    SharedModule,
    RouterModule
  ],
  // Must be exported to be used in the app component
  exports: [
    NavBarComponent
  ]
})
export class NavigationModule { }
