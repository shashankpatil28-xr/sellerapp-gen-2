import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Declare google as any to avoid TypeScript errors if @types/google.accounts is not used or for quick setup
declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  // IMPORTANT: Replace 'YOUR_GOOGLE_CLIENT_ID_HERE' with your actual Google Cloud Console Web Application Client ID
  private readonly YOUR_GOOGLE_CLIENT_ID = '903496459467-go32lt6sm8qcvb06gmr2dnhndtkrqpam.apps.googleusercontent.com';

  // BehaviorSubject to track authentication status
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  // BehaviorSubject to store user profile information (decoded from ID token)
  private userProfileSubject = new BehaviorSubject<any | null>(null);
  userProfile$: Observable<any | null> = this.userProfileSubject.asObservable();

  // Store the ID token here after successful authentication
  private currentIdToken: string | null = null;

  constructor(private ngZone: NgZone) {
    this.initializeGoogleSignIn();
  }

  /**
   * @function initializeGoogleSignIn
   * @description Initializes Google Identity Services with the client ID and callback.
   * Auto-selects a user if available.
   */
  private initializeGoogleSignIn(): void {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: this.YOUR_GOOGLE_CLIENT_ID,
        callback: (response: any) => this.ngZone.run(() => this.handleCredentialResponse(response)),
        auto_select: true // Automatically select the user if only one is logged in
      });
      console.log('Google Identity Services initialized.');
    } else {
      console.error('Google Identity Services script not loaded or initialized correctly.');
      // You might want to implement a retry mechanism or error message to the user here
    }
  }

  /**
   * @function renderSignInButton
   * @description Renders the Google Sign-In button into a specified HTML element.
   * @param {string} elementId - The ID of the HTML element where the button should be rendered.
   */
  renderSignInButton(elementId: string): void {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.renderButton(
        document.getElementById(elementId),
        { theme: 'outline', size: 'large', text: 'signin_with', width: '250' } // Customize button appearance
      );
      // Optional: prompt for One Tap sign-in (can be disruptive, use with care)
      // google.accounts.id.prompt();
    } else {
      console.error('Cannot render sign-in button: Google Identity Services not initialized.');
    }
  }

  /**
   * @function handleCredentialResponse
   * @description Callback function executed after a successful Google Sign-In.
   * Decodes the ID token and updates authentication status.
   * @param {any} response - The credential response object containing the JWT ID token.
   */
  private handleCredentialResponse(response: any): void {
    const idToken = response.credential; // This is the JWT ID token
    console.log('Encoded JWT ID token:', idToken);

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
      // It's good practice to revoke the token from Google to properly end the session.
      // This requires the email, which we get from the decoded userProfile.
      const emailToRevoke = this.userProfileSubject.value?.email;
      if (emailToRevoke) {
        google.accounts.id.revoke(emailToRevoke, (done: any) => {
          console.log('User signed out from Google Identity Services:', done);
          this.isAuthenticatedSubject.next(false);
          this.userProfileSubject.next(null);
          this.currentIdToken = null; // Clear the stored token
        });
      } else {
        // If email isn't available, just clear local state
        this.isAuthenticatedSubject.next(false);
        this.userProfileSubject.next(null);
        this.currentIdToken = null;
        console.log('User signed out locally (email not available for Google revoke).');
      }
      google.accounts.id.disableAutoSelect(); // Prevent immediate re-sign-in via One Tap
    }
  }
}
