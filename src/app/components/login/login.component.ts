import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleAuthService } from '../../services/google-auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  isAuthenticated: boolean = false;
  private authSubscription!: Subscription;

  private googleAuthService: GoogleAuthService = inject(GoogleAuthService);
  public router: Router = inject(Router);

  ngOnInit(): void {
    // Subscribe to authentication status
    this.authSubscription = this.googleAuthService.isAuthenticated$.subscribe(status => {
      this.isAuthenticated = status;
      if (status) {
        // Redirect to chat page after successful login
        this.router.navigate(['/chat']);
      }
    });
  }

  ngAfterViewInit(): void {
    // Render the Google Sign-In button only if not already authenticated
    if (!this.isAuthenticated) {
      this.googleAuthService.renderSignInButton('google-signin-button');
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
