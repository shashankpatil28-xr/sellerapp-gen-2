    import { ApplicationConfig, importProvidersFrom } from '@angular/core';
    import { provideRouter } from '@angular/router';
    import { provideHttpClient } from '@angular/common/http'; // This remains crucial

    import routes from './app.routes';
    // Remove these Firebase imports:
    // import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
    // import { getAuth, provideAuth } from '@angular/fire/auth';
    // import { environment } from '../environments/environment'; // This import might also be removed if not used elsewhere

    export const appConfig: ApplicationConfig = {
      providers: [
        provideRouter(routes),
        provideHttpClient() // Keep this for HTTP requests
        // Remove the entire importProvidersFrom for Firebase if you're not using other Firebase services (e.g., Firestore)
        // If you are using other Firebase services (like Firestore), only remove `provideAuth(() => getAuth())`
        // importProvidersFrom(
        //   initializeApp(environment.firebaseConfig),
        //   provideAuth(() => getAuth())
        // )
      ]
    };
    