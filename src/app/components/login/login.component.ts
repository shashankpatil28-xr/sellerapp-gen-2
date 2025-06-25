// import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GoogleAuthService } from '../../services/google-auth.service';
// import { Router } from '@angular/router';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.scss']
// })
// export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
//   isAuthenticated: boolean = false;
//   private authSubscription!: Subscription;

//   private googleAuthService: GoogleAuthService = inject(GoogleAuthService);
//   public router: Router = inject(Router);

//   ngOnInit(): void {
//     // IMPORTANT: Expose the service's handleCredentialResponse method globally
//     // This is necessary if the 'g_id_onload' div's 'data-callback' attribute is used.
//     // Ensure 'handleCredentialResponse' is public or accessible for this.
//     (window as any).handleCredentialResponse = (response: any) => {
//       // Delegate to the service's private method (using bracket notation to access)
//       this.googleAuthService['handleCredentialResponse'](response);
//     };

//     // Subscribe to authentication status
//     this.authSubscription = this.googleAuthService.isAuthenticated$.subscribe(status => {
//       this.isAuthenticated = status;
//       if (status) {
//         // Redirect to chat page after successful login
//         this.router.navigate(['/chat']);
//       }
//     });
//   }

//   ngAfterViewInit(): void {
//     // Render the Google Sign-In button only if not already authenticated
//     // The service now internally waits for GIS readiness before attempting to render.
//     if (!this.isAuthenticated) {
//       this.googleAuthService.renderSignInButton('google-signin-button');
//     }
//   }

//   ngOnDestroy(): void {
//     if (this.authSubscription) {
//       this.authSubscription.unsubscribe();
//     }
//     // Clean up the global function to prevent memory leaks/conflicts
//     if ((window as any).handleCredentialResponse) {
//       delete (window as any).handleCredentialResponse;
//     }
//   }
// }


import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// import { GoogleAuthService } from '../../service/google-auth.service'; // COMMENTED OUT
// import { CommonModule } from '@angular/common'; // COMMENTED OUT if not used elsewhere

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    // CommonModule // COMMENTED OUT if not used elsewhere
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  // constructor(private googleAuthService: GoogleAuthService, private router: Router) {} // COMMENTED OUT
  constructor(private router: Router) {} // Updated constructor

  ngOnInit(): void {
    // Automatically redirect to chat when login component loads (bypassing auth)
    console.log('Login component loaded, redirecting to chat (authentication disabled).');
    this.router.navigate(['/chat']);

    // Original authentication logic (COMMENTED OUT)
    // this.googleAuthService.isAuthenticated$.subscribe(isAuthenticated => {
    //   if (isAuthenticated) {
    //     this.router.navigate(['/chat']);
    //   }
    // });
    // this.googleAuthService.initializeGoogleSignIn();
  }

  // Original handleCredentialResponse (COMMENTED OUT)
  // handleCredentialResponse(response: any): void {
  //   this.googleAuthService.handleCredentialResponse(response);
  // }
}
