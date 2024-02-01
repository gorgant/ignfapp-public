import { Routes } from "@angular/router";
import { AccountComponent } from "./account.component";
import { ProfileComponent } from "./profile/profile.component";
import { SettingsComponent } from "./settings/settings.component";
import { StatsComponent } from "./stats/stats.component";
import { TrainingHistoryComponent } from "./training-history/training-history.component";
import { TrainingRecordComponent } from "./training-record/training-record.component";
import { TrainingRecordKeys } from "shared-models/train/training-record.model";

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
  {
    path: 'training-history',
    component: TrainingHistoryComponent
  },
  {
    path: `training-record/:${TrainingRecordKeys.ID}`,
    component: TrainingRecordComponent
  }
];