import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app.component';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideRemoteConfig, getRemoteConfig } from '@angular/fire/remote-config';
import { providePerformance, getPerformance } from '@angular/fire/performance';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAppCheck, initializeAppCheck, ReCaptchaEnterpriseProvider } from '@angular/fire/app-check';
import { environment } from './environments/environment';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import { provideAnimations } from '@angular/platform-browser/animations';
import { bootstrapApplication } from '@angular/platform-browser';
import { ScreenTrackingService, UserTrackingService, provideAnalytics, getAnalytics } from '@angular/fire/analytics';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from './app/app-routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore } from '@ngrx/router-store';
import { reducers } from './app/root-store/root-store.state';
import { metaReducers } from './app/root-store/meta-reducers';
import { UserStoreEffects } from './app/root-store/user-store/effects';
import { AuthStoreEffects } from './app/root-store/auth-store/effects';
import { PersonalSessionFragmentStoreEffects } from './app/root-store/personal-session-fragment-store/effects';
import { PlanSessionFragmentStoreEffects } from './app/root-store/plan-session-fragment-store/effects';
import { TrainingPlanStoreEffects } from './app/root-store/training-plan-store/effects';
import { TrainingRecordStoreEffects } from './app/root-store/training-record-store/effects';
import { TrainingSessionStoreEffects } from './app/root-store/training-session-store/effects';

// TODO: Check if angularfire modules can be provided outside the importProvidersFrom
bootstrapApplication(AppComponent, {
    providers: [
        provideRouter(APP_ROUTES),
        importProvidersFrom(
            provideFirebaseApp(() => initializeApp(environment.firebase)), 
            provideAppCheck(() => initializeAppCheck(
                getApp(), {
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
            provideStorage(() => getStorage()), 
        ),
        provideStore(
            reducers,
            { 
                metaReducers,
                runtimeChecks: {
                    strictStateSerializability: true,
                    strictActionSerializability: false, // Disabled bc need to move files like avatar image through store
                    strictActionTypeUniqueness: true,
                }
            }
        ),
        provideEffects([
            AuthStoreEffects,
            PersonalSessionFragmentStoreEffects,
            PlanSessionFragmentStoreEffects,
            TrainingPlanStoreEffects,
            TrainingRecordStoreEffects,
            TrainingSessionStoreEffects,
            UserStoreEffects,
        ]),
        provideStoreDevtools({ maxAge: 25, logOnly: !environment.production}),
        provideRouterStore(),
        ScreenTrackingService, 
        UserTrackingService,
        provideAnimations(),
    ]
})
  .catch(err => console.error(err));
