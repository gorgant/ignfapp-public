import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStoreModule } from './auth-store/auth-store.module';
import { UserStoreModule } from './user-store/user-store.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { metaReducers } from './meta-reducers';
import { environment } from 'src/environments/environment';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { StoreRouterConnectingModule, RouterStateSerializer, RouterState } from '@ngrx/router-store';
import { CustomSerializer } from '../core/utils/custom-route-serializer';
import { reducers } from './root-store.state';
import { PersonalSessionFragmentStoreModule } from './personal-session-fragment-store';
import { PlanSessionFragmentStoreModule } from './plan-session-fragment-store';
import { TrainingPlanStoreModule } from './training-plan-store';
import { TrainingRecordStoreModule } from './training-record-store';
import { TrainingSessionStoreModule } from './training-session-store';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AuthStoreModule,
    PersonalSessionFragmentStoreModule,
    PlanSessionFragmentStoreModule,
    TrainingPlanStoreModule,
    TrainingRecordStoreModule,
    TrainingSessionStoreModule,
    UserStoreModule,
    StoreModule.forRoot(
        reducers, 
        { 
          metaReducers,
          runtimeChecks: {
            strictStateSerializability: true,
            strictActionSerializability: false, // Disabled bc need to move files like avatar image through store
            strictActionTypeUniqueness: true,
        }
      }),
      EffectsModule.forRoot([]),
      StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: !environment.production}), // Try adding 'connectInZone: true' to this object if running into issues, default is false
      StoreRouterConnectingModule.forRoot({ serializer: CustomSerializer }),
  ],
  providers: [
    { provide: RouterStateSerializer, useClass: CustomSerializer },
  ],
})
export class RootStoreModule { }
