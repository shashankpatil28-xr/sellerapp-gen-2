// src/app/services/api-client.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GoogleAuthService } from './google-auth.service'; // Assuming this service provides GIS token

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private readonly EXTERNAL_API_PROXY_PATH = "/api/chat";

  constructor(
    private http: HttpClient,
    private googleAuthService: GoogleAuthService
  ) {}

  // Modified onSearch to accept an optional sessionId
  onSearch(payload: { query: string, sessionId?: string }): Observable<any> {
    const authToken = this.googleAuthService.getIdToken();

    if (!authToken) {
      console.error('ApiClientService: No Google ID Token available. User must sign in first.');
      return throwError(() => new Error('Authentication required: Please sign in with Google.'));
    }

    // Build the base payload
    const formated_payload: any = {
      user_id: this.googleAuthService.getUserEmail() || 'shashank',
      query: [
        {
          text: payload.query,
        },
      ],
      data: {
        location: 'bangalore', // Assuming this is always 'bangalore' as per your earlier code
      },
    };

    // Conditionally add session_id if provided
    if (payload.sessionId) {
      formated_payload.session_id = payload.sessionId;
      console.log(`ApiClientService: Sending request for existing session: ${payload.sessionId}`);
    } else {
      console.log('ApiClientService: Sending request for a NEW session (no sessionId provided).');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    });

    console.log('ApiClientService: Sending request with payload:', formated_payload);
    console.log('ApiClientService: Using Authorization header (partial token):', `Bearer ${authToken.substring(0, 30)}...`);

    return this.http.post<any>(
      this.EXTERNAL_API_PROXY_PATH,
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