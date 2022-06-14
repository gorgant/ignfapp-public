import { NgModule } from '@angular/core';

import { BrowseRoutingModule } from './browse-routing.module';
import { BrowseComponent } from '../components/browse/browse.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { BrowseFiltersComponent } from '../components/browse-filters/browse-filters.component';


@NgModule({
  declarations: [
    BrowseComponent,
    BrowseFiltersComponent
  ],
  imports: [
    SharedModule,
    BrowseRoutingModule
  ]
})
export class BrowseModule { }
