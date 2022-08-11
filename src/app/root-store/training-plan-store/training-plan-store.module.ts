import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { PublicStoreFeatureKeys } from 'shared-models/store/feature-keys.model';
import { trainingPlanMetaReducers, trainingPlanStoreReducer } from './reducer';
import { TrainingPlanStoreEffects } from './effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(PublicStoreFeatureKeys.TRAINING_PLAN, trainingPlanStoreReducer, { metaReducers: trainingPlanMetaReducers }),
    EffectsModule.forFeature([TrainingPlanStoreEffects])
  ],
  providers: [TrainingPlanStoreEffects]
})
export class TrainingPlanStoreModule { }
