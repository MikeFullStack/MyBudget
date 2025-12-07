import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeFirebase } from './core/firebase-init';
import { provideServiceWorker } from '@angular/service-worker';

export function loadConfig() {
  return () => fetch('/config.json')
    .then(response => response.json())
    .then(config => {
      initializeFirebase(config);
    })
    .catch(err => console.error('Failed to load config', err));
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: loadConfig,
      multi: true
    }, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
};
