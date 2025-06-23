import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service'; // <--- IMPORTANT: Import the new AuthService

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  // Use the proxy path, not the full external URL.
  // The proxy (proxy.conf.json) will redirect '/api/chat' to 'https://deepa-onix-agent-903496459467.asia-east1.run.app/chat'

  private readonly EXTERNAL_API_PROXY_PATH = "https://dpi-agent-demo-903496459467.asia-east1.run.app/chat";
  
  constructor(
    private http: HttpClient,
    private authService: AuthService // <--- IMPORTANT: Inject the new AuthService
  ) {}

  /**
   * @function onSearch
   * @description Sends a search query to the external API with a specific payload and headers,
   * including the Google Identity Services ID token for IAP authentication.
   * @param {any} payload - The input payload containing the query text.
   * @returns {Observable<any>} An observable emitting the raw JSON response from the API.
   */
  onSearch(payload: { query: string }): Observable<any> {
    // Get the Google ID token from the AuthService
    const authToken = this.authService.getIdToken();

    // If no token is available, throw an error immediately
    if (!authToken) {
      console.error('No Google ID Token available. User must sign in first.');
      return throwError(() => new Error('Authentication required: Please sign in.'));
    }

    // Construct the formatted payload as specified by the user
    const formated_payload = {
      // Use the user's email from the AuthService profile, or fall back to 'anonymous'
      user_id: 'shashank',
      query: [
        {
          text: payload.query, // Use the query text from the input payload
        },
      ],
      data: {
        location: 'bangalore', // Hardcoding 'bangalore' as per previous payload structure
      },
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`, // Add the Authorization header with the GIS ID token
    });

    console.log('Sending request with payload:', formated_payload);
    // Log a partial token for debugging while protecting the full token
    console.log('Using Authorization header (partial token):', `Bearer ${authToken.substring(0, 30)}...`);

    return this.http.post<any>(
      this.EXTERNAL_API_PROXY_PATH, // Use the proxy path
      formated_payload,
      {
        headers: headers,
      }
    ).pipe(
      // Add error handling to catch network errors or API errors
      catchError(error => {
        console.error("Error calling external API:", error);
        // Provide more specific error messages if possible
        let errorMessage = 'Failed to connect to the external API.';
        if (error.status === 401 || error.status === 403) {
          errorMessage = 'Unauthorized: Invalid or missing authentication. Please sign in again.';
        } else if (error.error && error.error.message) {
          errorMessage = `API Error: ${error.error.message}`;
        }
        return throwError(() => new Error(errorMessage + ' Please check console for details.'));
      })
    );
  }
}
