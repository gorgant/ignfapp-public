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
import { UiStoreModule } from './ui-store';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AuthStoreModule,
    UiStoreModule,
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
      !environment.production ? StoreDevtoolsModule.instrument() : [], // TODO: Figure out why this doesn't work when deployed to server
      StoreRouterConnectingModule.forRoot(
        { 
          stateKey: 'router',
          routerState: RouterState.Minimal,
          serializer: CustomSerializer
        }
      ),
  ],
  providers: [
    { provide: RouterStateSerializer, useClass: CustomSerializer },
  ],
})
export class RootStoreModule { }
