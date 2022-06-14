import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { PublicStoreFeatureKeys } from 'shared-models/store/feature-keys.model';
import { trainMetaReducers, trainStoreReducer } from './reducers';
import { TrainStoreEffects } from './effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(PublicStoreFeatureKeys.TRAIN, trainStoreReducer, { metaReducers: trainMetaReducers }),
    EffectsModule.forFeature([TrainStoreEffects])
  ],
  providers: [TrainStoreEffects]
})
export class TrainStoreModule { }
