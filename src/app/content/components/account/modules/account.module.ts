import { NgModule } from '@angular/core';

import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from '../components/account/account.component';
import { ProfileComponent } from '../components/profile/profile.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { SettingsComponent } from '../components/settings/settings.component';
import { StatsComponent } from '../components/stats/stats.component';
import { EditNameDialogueComponent } from '../components/profile/edit-name-dialogue/edit-name-dialogue.component';
import { EditEmailDialogueComponent } from '../components/profile/edit-email-dialogue/edit-email-dialogue.component';
import { EditPasswordDialogueComponent } from '../components/profile/edit-password-dialogue/edit-password-dialogue.component';
import { EditAvatarDialogueComponent } from '../components/profile/edit-avatar-dialogue/edit-avatar-dialogue.component';


@NgModule({
  declarations: [
    AccountComponent,
    ProfileComponent,
    SettingsComponent,
    StatsComponent,
    EditNameDialogueComponent,
    EditEmailDialogueComponent,
    EditPasswordDialogueComponent,
    EditAvatarDialogueComponent,
  ],
  imports: [
    SharedModule,
    AccountRoutingModule,
  ]
})
export class AccountModule { }
