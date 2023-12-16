import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app.component';
import { RootStoreModule } from './app/root-store';
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
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { ScreenTrackingService, UserTrackingService, provideAnalytics, getAnalytics } from '@angular/fire/analytics';


bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, AppRoutingModule, provideFirebaseApp(() => initializeApp(environment.firebase)), provideAppCheck(() => initializeAppCheck(getApp(), {
            provider: new ReCaptchaEnterpriseProvider(environment.reCaptchaEnterpriseProviderKey),
            isTokenAutoRefreshEnabled: true
        })), provideFirestore(() => getFirestore()), provideAnalytics(() => getAnalytics()), provideAuth(() => getAuth()), provideFunctions(() => getFunctions()), providePerformance(() => getPerformance()), provideRemoteConfig(() => getRemoteConfig()), provideStorage(() => getStorage()), AppRoutingModule, RootStoreModule),
        ScreenTrackingService, UserTrackingService,
        provideAnimations()
    ]
})
  .catch(err => console.error(err));
