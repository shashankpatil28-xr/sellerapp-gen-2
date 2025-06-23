import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { OAuthModule, AuthConfig, JwksValidationHandler } from 'angular-oauth2-oidc'; // Import OAuthModule and AuthConfig

import routes from './app.routes';

// Your Angular App's OAuth Client ID from Google Cloud Console (Web application type)
// This is the 'client_id' from the JSON you provided:
// "903496459467-go32lt6sm8qcvb06gmr2dnhndtkrqpam.apps.googleusercontent.com"
const angularAppClientId = '903496459467-go32lt6sm8qcvb06gmr2dnhndtkrqpam.apps.googleusercontent.com'; // REPLACE THIS!

// The Client ID of the OAuth client that IAP uses to protect your API.
// YOU MUST REPLACE THIS WITH THE ACTUAL CLIENT ID YOU FOUND IN STEP 0!
// Example: '1234567890-abcdef1234567890abcdef123456.apps.googleusercontent.com'
const iapAudienceClientId = '903496459467-snue73b7f9tccsd2mih5blv23u6r96do.apps.googleusercontent.com'; // REPLACE THIS!

// The redirect URI for your Angular app. Make sure this matches an
// "Authorized redirect URI" in your Angular App's OAuth Client ID in GCP.
// It should be your app's base URL followed by '/callback'.
// Example: 'https://sellerapp-generative-new-903496459467.asia-east1.run.app/callback'
const googleRedirectUri = 'https://sellerapp-generative-new-903496459467.asia-east1.run.app/callback'; // REPLACE THIS!

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  redirectUri: googleRedirectUri,
  clientId: angularAppClientId,
  scope: 'openid email profile', // Required scopes for ID token and basic user info
  responseType: 'code', // Use 'code' flow (Authorization Code Flow with PKCE)
  strictDiscoveryDocumentValidation: false, // Set to true in production if discovery endpoint is stable
  showDebugInformation: true, // For development, useful for debugging

  // ⭐ ⭐ ⭐ CRITICAL FOR IAP: Add the resource parameter ⭐ ⭐ ⭐
  // This tells Google to issue an ID Token with an audience claim that includes
  // the IAP-protected resource's client ID.
  resource: iapAudienceClientId, // This makes the ID token valid for IAP
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(), // Essential for HTTP requests
    // Configure OAuthModule
    
    importProvidersFrom(
      OAuthModule.forRoot({
        resourceServer: { allowedUrls: [], sendAccessToken: true }, // Add a dummy resourceServer config to satisfy the type
      })
    )
  ]
};
