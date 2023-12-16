import { Routes } from "@angular/router";
import { AccountComponent } from "./components/account/account.component";
import { ProfileComponent } from "./components/profile/profile.component";
import { SettingsComponent } from "./components/settings/settings.component";
import { StatsComponent } from "./components/stats/stats.component";

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