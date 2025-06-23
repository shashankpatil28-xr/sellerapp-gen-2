import { Injectable, NgZone } from '@angular/core';
import { OAuthService, OAuthEvent, JwksValidationHandler } from 'angular-oauth2-oidc';
import { authConfig } from '../app.config'; // Import the authConfig from app.config.ts
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  getUserEmail() {
    throw new Error('Method not implemented.');
  }
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  private userProfileSubject = new BehaviorSubject<any | null>(null);
  userProfile$: Observable<any | null> = this.userProfileSubject.asObservable();

  constructor(private oauthService: OAuthService, private ngZone: NgZone) {
    this.configureOAuth();
  }

  /**
   * @function configureOAuth
   * @description Configures the OAuthService and sets up event listeners.
   */
  private configureOAuth(): void {
    this.oauthService.configure(authConfig); // Apply the shared authConfig
    this.oauthService.tokenValidationHandler = new JwksValidationHandler();

    // Load discovery document and try to login automatically
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      // After trying to login, update authentication status
      this.updateAuthenticationStatus();
    }).catch(error => {
      console.error('Error loading discovery document or logging in:', error);
      this.isAuthenticatedSubject.next(false);
      this.userProfileSubject.next(null);
    });

    // Listen to OAuth events for changes in authentication status
    this.oauthService.events
      .pipe(filter(e => ['token_received', 'discovery_document_loaded', 'token_expires', 'session_terminated', 'user_profile_loaded'].includes(e.type)))
      .subscribe((event: OAuthEvent) => {
        console.log('OAuth Event:', event.type, event);
        this.ngZone.run(() => this.updateAuthenticationStatus());
      });
  }

  /**
   * @function updateAuthenticationStatus
   * @description Checks the current authentication status and updates observables.
   */
  private updateAuthenticationStatus(): void {
    const isAuthenticated = this.oauthService.hasValidIdToken() && this.oauthService.hasValidAccessToken();
    this.isAuthenticatedSubject.next(isAuthenticated);

    if (isAuthenticated) {
      this.oauthService.loadUserProfile().then(profile => {
        this.userProfileSubject.next(profile);
        console.log('User Profile Loaded:', profile);
      }).catch(error => {
        console.error('Error loading user profile:', error);
        this.userProfileSubject.next(null);
      });
    } else {
      this.userProfileSubject.next(null);
    }
  }

  /**
   * @function login
   * @description Initiates the OAuth login flow.
   */
  login(): void {
    this.oauthService.initCodeFlow(); // Starts the authorization code flow
  }

  /**
   * @function logout
   * @description Logs out the user from the OAuth provider.
   */
  logout(): void {
    this.oauthService.logOut();
    this.isAuthenticatedSubject.next(false);
    this.userProfileSubject.next(null);
    console.log('User logged out.');
  }

  /**
   * @function getIdToken
   * @description Returns the current ID token.
   * @returns {string | null} The ID token or null if not available.
   */
  getIdToken(): string | null {
    return this.oauthService.getIdToken();
  }

  /**
   * @function getAccessToken
   * @description Returns the current Access token.
   * @returns {string | null} The Access token or null if not available.
   */
  getAccessToken(): string | null {
    return this.oauthService.getAccessToken();
  }
}
