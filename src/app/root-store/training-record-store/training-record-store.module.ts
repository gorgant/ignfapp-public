import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { PublicStoreFeatureKeys } from 'shared-models/store/feature-keys.model';
import { trainingRecordMetaReducers, trainingRecordStoreReducer } from './reducer';
import { TrainingRecordStoreEffects } from './effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(PublicStoreFeatureKeys.TRAINING_RECORD, trainingRecordStoreReducer, { metaReducers: trainingRecordMetaReducers }),
    EffectsModule.forFeature([TrainingRecordStoreEffects])
  ],
  providers: [TrainingRecordStoreEffects]
})
export class TrainingRecordStoreModule { }
