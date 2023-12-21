import { Routes } from "@angular/router";
import { AccountComponent } from "./account.component";
import { ProfileComponent } from "./profile/profile.component";
import { SettingsComponent } from "./settings/settings.component";
import { StatsComponent } from "./stats/stats.component";

export const ACCOUNT_ROUTES: Routes = [
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