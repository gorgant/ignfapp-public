import { NgModule } from '@angular/core';

import { BrowseRoutingModule } from './browse-routing.module';
import { BrowseComponent } from '../components/browse/browse.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { BrowseTrainingSessionsComponent } from '../components/browse/browse-training-sessions/browse-training-sessions.component';
import { BrowseTrainingPlansComponent } from '../components/browse/browse-training-plans/browse-training-plans.component';
import { TrainingSessionFiltersComponent } from '../components/browse/training-session-filters/training-session-filters.component';


@NgModule({
  declarations: [
    BrowseComponent,
    BrowseTrainingSessionsComponent,
    BrowseTrainingPlansComponent,
    TrainingSessionFiltersComponent,
  ],
  imports: [
    SharedModule,
    BrowseRoutingModule
  ]
})
export class BrowseModule { }
