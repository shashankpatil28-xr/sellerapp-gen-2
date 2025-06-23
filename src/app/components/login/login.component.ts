import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service'; // <--- IMPORTANT: Import the new AuthService
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html', // Keep existing HTML
  styleUrls: ['./login.component.scss'] // Keep existing CSS
})
export class LoginComponent implements OnInit, OnDestroy {
  isAuthenticated: boolean = false;
  private authSubscription!: Subscription;

  private authService: AuthService = inject(AuthService); // <--- Inject the new AuthService
  public router: Router = inject(Router);

  ngOnInit(): void {
    // Subscribe to authentication status
    this.authSubscription = this.authService.isAuthenticated$.subscribe(status => {
      this.isAuthenticated = status;
      if (status) {
        // Redirect to chat page after successful login
        this.router.navigate(['/chat']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  /**
   * @function login
   * @description Triggers the OAuth 2.0 login flow.
   */
  login(): void {
    this.authService.login();
  }
}
