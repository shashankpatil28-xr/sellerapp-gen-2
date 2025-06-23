import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { CommonModule } from '@angular/common'; // Import CommonModule

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule], // Add CommonModule for standalone component
  template: `
    <div class="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 class="text-2xl font-bold mb-4">Processing authentication...</h1>
        <p class="text-gray-600">Please wait while we log you in.</p>
        <div class="mt-4 animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    </div>
  `,
  styles: []
})
export class CallbackComponent implements OnInit {
  private oauthService: OAuthService = inject(OAuthService);
  private router: Router = inject(Router);

  ngOnInit(): void {
    // This component's primary role is to catch the redirect and process the token.
    // The OAuthService.loadDiscoveryDocumentAndTryLogin() in AuthService will handle
    // the actual processing of the URL parameters and token exchange.
    // After that, we navigate to the desired page.
    // We navigate to /chat directly here, as the AuthService should have already handled the login logic.
    this.oauthService.events.subscribe(e => {
      if (e.type === 'token_received' || e.type === 'discovery_document_loaded') {
        if (this.oauthService.hasValidIdToken() && this.oauthService.hasValidAccessToken()) {
          this.router.navigate(['/chat']); // Redirect to the main chat page after successful login
        }
      }
    });

    // If the component loads and OAuthService already has valid tokens,
    // it means the redirect was successful and tokens are processed.
    if (this.oauthService.hasValidIdToken() && this.oauthService.hasValidAccessToken()) {
      this.router.navigate(['/chat']);
    }
  }
}
