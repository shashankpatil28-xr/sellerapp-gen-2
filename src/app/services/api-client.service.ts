import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { GoogleAuthService } from './google-auth.service'; // Import the new GIS auth service

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  // Use the proxy path for development
  private readonly EXTERNAL_API_PROXY_PATH = "https://dpi-agent-demo-903496459467.asia-east1.run.app/chat"; // This routes through proxy.conf.json

  constructor(
    private http: HttpClient,
    private googleAuthService: GoogleAuthService // Inject GoogleAuthService
  ) {}

  /**
   * @function onSearch
   * @description Sends a search query to the external API with specific payload and headers,
   * using the Google Identity Services ID token.
   * @param {any} payload - The input payload containing the query text.
   * @returns {Observable<any>} An observable emitting the raw JSON response from the API.
   */
  onSearch(payload: { query: string }): Observable<any> {
    // Get the ID token from GoogleAuthService
    const authToken = this.googleAuthService.getIdToken();

    if (!authToken) {
      console.error('No Google ID Token available. User must sign in first.');
      return throwError(() => new Error('Authentication required: Please sign in with Google.'));
    }

    // Construct the formatted payload as specified by the user
    const formated_payload = {
      user_id: this.googleAuthService.getUserEmail() || 'shashank', // Use email from GIS profile or 'shashank'
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
      'Authorization': `Bearer ${authToken}`, // Use the dynamically obtained GIS ID token
    });

    console.log('Sending request with payload:', formated_payload);
    console.log('Using Authorization header (partial token):', `Bearer ${authToken.substring(0, 30)}...`); // Log partial token for safety

    return this.http.post<any>(
      this.EXTERNAL_API_PROXY_PATH, // Use the configured proxy path
      formated_payload,
      {
        headers: headers,
      }
    ).pipe(
      catchError(error => {
        console.error("Error calling external API:", error);
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
