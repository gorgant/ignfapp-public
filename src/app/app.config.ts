import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from 'src/environments/environment';
import { ReCaptchaEnterpriseProvider, initializeAppCheck, provideAppCheck } from '@angular/fire/app-check';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { ScreenTrackingService, UserTrackingService, getAnalytics, provideAnalytics } from '@angular/fire/analytics';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getPerformance, providePerformance } from '@angular/fire/performance';
import { getRemoteConfig, provideRemoteConfig } from '@angular/fire/remote-config';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideStore } from '@ngrx/store';
import { reducers } from './root-store/root-store.state';
import { metaReducers } from './root-store/meta-reducers';
import { provideEffects } from '@ngrx/effects';
import { AuthStoreEffects } from './root-store/auth-store/effects';
import { PersonalSessionFragmentStoreEffects } from './root-store/personal-session-fragment-store/effects';
import { PlanSessionFragmentStoreEffects } from './root-store/plan-session-fragment-store/effects';
import { TrainingPlanStoreEffects } from './root-store/training-plan-store/effects';
import { TrainingRecordStoreEffects } from './root-store/training-record-store/effects';
import { TrainingSessionStoreEffects } from './root-store/training-session-store/effects';
import { UserStoreEffects } from './root-store/user-store/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore } from '@ngrx/router-store';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    importProvidersFrom(
        // Firestore providers
        provideFirebaseApp(() => initializeApp(environment.firebase)), 
        provideAppCheck(() => initializeAppCheck(
            getApp(), 
            {
                provider: new ReCaptchaEnterpriseProvider(environment.reCaptchaEnterpriseProviderKey),
                isTokenAutoRefreshEnabled: true
            }
        )), 
        provideFirestore(() => getFirestore()), 
        provideAnalytics(() => getAnalytics()), 
        provideAuth(() => getAuth()), 
        provideFunctions(() => getFunctions()), 
        providePerformance(() => getPerformance()), 
        provideRemoteConfig(() => getRemoteConfig()), 
        provideStorage(() => getStorage())
    ),
    
    // NgRx providers
    provideStore(reducers, {
        metaReducers,
        runtimeChecks: {
            strictStateSerializability: true,
            strictActionSerializability: false,
            strictActionTypeUniqueness: true,
        }
    }),
    provideEffects([
        AuthStoreEffects,
        PersonalSessionFragmentStoreEffects,
        PlanSessionFragmentStoreEffects,
        TrainingPlanStoreEffects,
        TrainingRecordStoreEffects,
        TrainingSessionStoreEffects,
        UserStoreEffects,
    ]),
    provideStoreDevtools({ maxAge: 25, logOnly: !environment.production }),
    provideRouterStore(),

    ScreenTrackingService,
    UserTrackingService,
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    })
  ]
}