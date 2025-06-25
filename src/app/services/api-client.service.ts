import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
// import { GoogleAuthService } from './google-auth.service'; // COMMENTED OUT: Not needed for frontend auth bypass

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  // ⭐ IMPORTANT: Point to the local FastAPI proxy path.
  // This path MUST match the route defined in your FastAPI app.
  private readonly EXTERNAL_API_PROXY_PATH = "/api/chat";

  constructor(
    private http: HttpClient,
    // private googleAuthService: GoogleAuthService // COMMENTED OUT: Not needed for frontend auth bypass
  ) {}

  onSearch(payload: { query: string }): Observable<any> {
    // const authToken = this.googleAuthService.getIdToken(); // COMMENTED OUT: Frontend token not used for this call

    // if (!authToken) { // COMMENTED OUT: No frontend token check
    //   console.error('ApiClientService: No Google ID Token available. User must sign in first.');
    //   return throwError(() => new Error('Authentication required: Please sign in with Google.'));
    // }

    const formated_payload = {
      // user_id: this.googleAuthService.getUserEmail() || 'shashank', // COMMENTED OUT: Use a default or remove
      user_id: 'shashank_guest_user', // Using a fixed user_id as frontend auth is bypassed
      query: [
        {
          text: payload.query,
        },
      ],
      data: {
        location: 'bangalore',
      },
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${authToken}`, // COMMENTED OUT: Frontend token not sent
    });

    console.log('ApiClientService: Sending request with payload (no frontend auth header):', formated_payload);
    // console.log('ApiClientService: Using Authorization header (partial token):', `Bearer ${authToken.substring(0, 30)}...`); // COMMENTED OUT

    return this.http.post<any>(
      this.EXTERNAL_API_PROXY_PATH, // Use the local FastAPI proxy path
      formated_payload,
      {
        headers: headers,
      }
    ).pipe(
      catchError(error => {
        console.error("ApiClientService: Error calling local FastAPI proxy:", error);
        let errorMessage = 'Failed to connect to the API via local proxy.';
        if (error.status === 401 || error.status === 403) {
          errorMessage = 'Authentication/Authorization Error: Invalid or missing token, or IAP blocked the backend call.';
        } else if (error.error && error.error.message) {
          errorMessage = `Proxy Error: ${error.error.message}`;
        } else if (error.message) {
          errorMessage = `Network/Client Error: ${error.message}`;
        }
        return throwError(() => new Error(errorMessage + ' Please check console for details.'));
      })
    );
  }
}
