import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs'; // Import Subscription
import { filter, take } from 'rxjs/operators';

// Declare google as any to avoid TypeScript errors
declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private readonly YOUR_GOOGLE_CLIENT_ID = '903496459467-go32lt6sm8qcvb06gmr2dnhndtkrqpam.apps.googleusercontent.com';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  private userProfileSubject = new BehaviorSubject<any | null>(null);
  userProfile$: Observable<any | null> = this.userProfileSubject.asObservable();

  private currentIdToken: string | null = null;

  // NEW: BehaviorSubject to track when Google Identity Services is fully loaded and ready
  private _gsiClientReady = new BehaviorSubject<boolean>(false);
  public gsiClientReady$: Observable<boolean> = this._gsiClientReady.asObservable().pipe(
    filter(ready => ready), // Only emit when true
    take(1) // Complete after the first true emission
  );

  private initializationAttempted = false; // Flag to ensure initialize is called only once

  constructor(private ngZone: NgZone) {
    // Start checking for GSI availability immediately when the service is created.
    // This replaces the problematic direct call to initializeGoogleSignIn() in the constructor.
    this.checkGsiAvailability();
  }

  /**
   * @function checkGsiAvailability
   * @description Periodically checks for the availability of the global 'google.accounts.id' object.
   * Once available, it updates the _gsiClientReady BehaviorSubject and triggers internal initialization.
   */
  private checkGsiAvailability(): void {
    const interval = setInterval(() => {
      this.ngZone.run(() => { // Ensure Angular zone is aware of changes
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
          clearInterval(interval); // Stop checking once found
          this._gsiClientReady.next(true); // Signal that GSI is ready

          console.log('Google Identity Services object is now available.');
          // Initialize GSI only once after it's confirmed ready
          if (!this.initializationAttempted) {
            this.initializeGoogleSignInInternal();
            this.initializationAttempted = true;
          }
        } else {
          // console.log('Waiting for Google Identity Services script to load...'); // Good for debugging
        }
      });
    }, 100); // Check every 100 milliseconds
  }

  /**
   * @function initializeGoogleSignInInternal
   * @description Internal method to initialize Google Identity Services.
   * This method should only be called once the GSI script is confirmed loaded.
   */
  private initializeGoogleSignInInternal(): void {
    if (this._gsiClientReady.value) { // Double check if it's truly ready
      try {
        google.accounts.id.initialize({
          client_id: this.YOUR_GOOGLE_CLIENT_ID,
          // Use a function that calls handleCredentialResponse inside the Angular Zone
          callback: (response: any) => this.ngZone.run(() => this.handleCredentialResponse(response)),
          auto_select: true // Automatically select the user if only one is logged in
        });
        console.log('Google Identity Services initialized successfully.');
      } catch (error) {
        console.error('Error during GSI initialization:', error);
      }
    } else {
      console.error('Attempted to initialize GSI before client was ready. This should not happen.');
    }
  }

  /**
   * @function renderSignInButton
   * @description Renders the Google Sign-In button into a specified HTML element.
   * This method now waits for GSI to be ready before attempting to render the button.
   * @param {string} elementId - The ID of the HTML element where the button should be rendered.
   */
  renderSignInButton(elementId: string): void {
    // If GSI is already ready, render immediately.
    // Otherwise, subscribe to its readiness and then render.
    this.gsiClientReady$.subscribe(isReady => {
      if (isReady) {
        const buttonElement = document.getElementById(elementId);
        if (buttonElement) {
          try {
            google.accounts.id.renderButton(
              buttonElement,
              { theme: 'outline', size: 'large', text: 'signin_with', width: '250' } // Customize button appearance
            );
            console.log('Google Sign-In button rendered successfully for element:', elementId);
          } catch (error) {
            console.error('Error rendering GSI button:', error);
          }
        } else {
          console.error(`HTML element with ID "${elementId}" not found for rendering Google Sign-In button.`);
        }
      } else {
        // This case should ideally be handled by the subscription, but good for logs.
        console.warn('GSI client not ready when renderSignInButton was called. Waiting...');
      }
    });
  }

  /**
   * @function handleCredentialResponse
   * @description Callback function executed after a successful Google Sign-In.
   * Decodes the ID token and updates authentication status.
   * @param {any} response - The credential response object containing the JWT ID token.
   */
  private handleCredentialResponse(response: any): void {
    const idToken = response.credential; // This is the JWT ID token
    console.log('Encoded JWT ID token received:', idToken);

    if (idToken) {
      this.currentIdToken = idToken; // Store the ID token
      this.isAuthenticatedSubject.next(true);

      try {
        const decodedToken = this.decodeJwt(idToken);
        this.userProfileSubject.next(decodedToken);
        console.log('Decoded User Profile:', decodedToken);
      } catch (e) {
        console.error('Error decoding ID token:', e);
        this.userProfileSubject.next(null);
      }
    } else {
      this.isAuthenticatedSubject.next(false);
      this.userProfileSubject.next(null);
      this.currentIdToken = null;
      console.error('Failed to get ID token from Google.');
    }
  }

  /**
   * @function decodeJwt
   * @description Helper function to decode a JWT for client-side display.
   * @param {string} token - The JWT string.
   * @returns {any} The decoded JWT payload.
   * @remarks DO NOT RELY ON THIS FOR SECURITY. Server-side validation is mandatory.
   */
  private decodeJwt(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  getUserEmail(): string | null {
    const userProfile = this.userProfileSubject.value;
    return userProfile ? userProfile.email || null : null;
  }

  /**
   * @function getIdToken
   * @description Returns the currently stored Google ID token.
   * @returns {string | null} The ID token or null if not authenticated.
   */
  getIdToken(): string | null {
    return this.currentIdToken;
  }

  /**
   * @function signOut
   * @description Signs out the user from Google Identity Services.
   */
  signOut(): void {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      const emailToRevoke = this.userProfileSubject.value?.email;
      if (emailToRevoke) {
        google.accounts.id.revoke(emailToRevoke, (done: any) => {
          console.log('User signed out from Google Identity Services:', done);
          this.isAuthenticatedSubject.next(false);
          this.userProfileSubject.next(null);
          this.currentIdToken = null; // Clear the stored token
        });
      } else {
        this.isAuthenticatedSubject.next(false);
        this.userProfileSubject.next(null);
        this.currentIdToken = null;
        console.log('User signed out locally (email not available for Google revoke).');
      }
      google.accounts.id.disableAutoSelect(); // Prevent immediate re-sign-in via One Tap
    }
  }
}
