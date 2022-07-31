import { NgModule } from '@angular/core';

import { BrowseRoutingModule } from './browse-routing.module';
import { BrowseComponent } from '../components/browse/browse.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { BrowseFiltersComponent } from '../components/browse-filters/browse-filters.component';
import { TrainingSessionCardComponent } from '../components/training-session-card/training-session-card.component';


@NgModule({
  declarations: [
    BrowseComponent,
    BrowseFiltersComponent,
    TrainingSessionCardComponent
  ],
  imports: [
    SharedModule,
    BrowseRoutingModule
  ]
})
export class BrowseModule { }
