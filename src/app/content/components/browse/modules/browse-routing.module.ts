import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicAppRoutes } from 'shared-models/routes-and-paths/app-routes.model';
import { BrowseFiltersComponent } from '../components/browse-filters/browse-filters.component';
import { BrowseComponent } from '../components/browse/browse.component';

const routes: Routes = [
  {
    path: '',
    component: BrowseComponent
  },
  {
    path: 'filters',
    component: BrowseFiltersComponent
  },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BrowseRoutingModule { }
