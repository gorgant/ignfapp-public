import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";
import { PublicStoreFeatureKeys } from "shared-models/store/feature-keys.model";
import { UiStoreEffects } from "./effects";
import { uiMetaReducers, uiStoreReducer } from "./reducers";

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(PublicStoreFeatureKeys.UI, uiStoreReducer, { metaReducers: uiMetaReducers }),
    EffectsModule.forFeature([UiStoreEffects])
  ],
  providers: [UiStoreEffects]
})
export class UiStoreModule { }