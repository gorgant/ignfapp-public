import { NgModule } from '@angular/core';

import { BrowseRoutingModule } from './browse-routing.module';
import { BrowseComponent } from '../components/browse/browse.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    BrowseComponent
  ],
  imports: [
    SharedModule,
    BrowseRoutingModule
  ]
})
export class BrowseModule { }
