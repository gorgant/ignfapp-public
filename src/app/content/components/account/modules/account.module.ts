import { NgModule } from '@angular/core';

import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from '../components/account/account.component';
import { ProfileComponent } from '../components/profile/profile.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    AccountComponent,
    ProfileComponent,
  ],
  imports: [
    SharedModule,
    AccountRoutingModule,
  ]
})
export class AccountModule { }
