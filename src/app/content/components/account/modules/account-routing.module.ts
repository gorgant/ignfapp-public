import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountComponent } from '../components/account/account.component';
import { ProfileComponent } from '../components/profile/profile.component';
import { SettingsComponent } from '../components/settings/settings.component';
import { StatsComponent } from '../components/stats/stats.component';

const routes: Routes = [
  {
    path: '',
    component: AccountComponent
  },
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'settings',
    component: SettingsComponent
  },
  {
    path: 'stats',
    component: StatsComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule { }
