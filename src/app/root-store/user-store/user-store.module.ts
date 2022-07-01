import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { PublicStoreFeatureKeys } from 'shared-models/store/feature-keys.model';
import { userMetaReducers, userStoreReducer } from './reducer';
import { UserStoreEffects } from './effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(PublicStoreFeatureKeys.USER, userStoreReducer, { metaReducers: userMetaReducers }),
    EffectsModule.forFeature([UserStoreEffects])
  ],
  providers: [UserStoreEffects]
})
export class UserStoreModule { }
