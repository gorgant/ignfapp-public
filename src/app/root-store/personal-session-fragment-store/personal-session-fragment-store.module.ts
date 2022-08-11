import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { PublicStoreFeatureKeys } from 'shared-models/store/feature-keys.model';
import { personalSessionFragmentMetaReducers, personalSessionFragmentStoreReducer } from './reducer';
import { PersonalSessionFragmentStoreEffects } from './effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(PublicStoreFeatureKeys.PERSONAL_SESSSION_FRAGMENT, personalSessionFragmentStoreReducer, { metaReducers: personalSessionFragmentMetaReducers }),
    EffectsModule.forFeature([PersonalSessionFragmentStoreEffects])
  ],
  providers: [PersonalSessionFragmentStoreEffects]
})
export class PersonalSessionFragmentStoreModule { }
