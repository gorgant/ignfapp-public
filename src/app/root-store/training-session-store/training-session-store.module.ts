import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { PublicStoreFeatureKeys } from 'shared-models/store/feature-keys.model';
import { trainingSessionMetaReducers, trainingSessionStoreReducer } from './reducer';
import { TrainingSessionStoreEffects } from './effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(PublicStoreFeatureKeys.TRAINING_SESSION, trainingSessionStoreReducer, { metaReducers: trainingSessionMetaReducers }),
    EffectsModule.forFeature([TrainingSessionStoreEffects])
  ],
  providers: [TrainingSessionStoreEffects]
})
export class TrainingSessionStoreModule { }
