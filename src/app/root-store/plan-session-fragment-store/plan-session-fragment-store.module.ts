import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { PublicStoreFeatureKeys } from 'shared-models/store/feature-keys.model';
import { planSessionFragmentMetaReducers, planSessionFragmentStoreReducer } from './reducer';
import { PlanSessionFragmentStoreEffects } from './effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(PublicStoreFeatureKeys.PLAN_SESSSION_FRAGMENT, planSessionFragmentStoreReducer, { metaReducers: planSessionFragmentMetaReducers }),
    EffectsModule.forFeature([PlanSessionFragmentStoreEffects])
  ],
  providers: [PlanSessionFragmentStoreEffects]
})
export class PlanSessionFragmentStoreModule { }
