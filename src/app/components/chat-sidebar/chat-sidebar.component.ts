// src/app/components/sidebar/sidebar.component.ts
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GlobalStateService } from '../../services/global-state.service'; // Adjust path
import { GoogleAuthService } from '../../services/google-auth.service'; // For sign-in/out
import { ChatSession, UserInfo } from '../../models/app-state.model'; // Adjust path
import { CommonModule } from '@angular/common'; // Needed for ngIf, ngFor
// import { map, take } from 'rxjs/operators'; // No longer strictly needed for this specific method, but keep for other uses

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-sidebar.component.html',
  styleUrls: ['./chat-sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  userInfo$: Observable<UserInfo | null>;
  sessions$: Observable<ChatSession[]>;
  currentSessionId$: Observable<string | null>;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private globalStateService: GlobalStateService,
    private googleAuthService: GoogleAuthService
  ) {
    this.userInfo$ = this.globalStateService.userInfo$;
    this.sessions$ = this.globalStateService.sessions$;
    this.currentSessionId$ = this.globalStateService.currentSessionId$;
    this.isAuthenticated$ = this.googleAuthService.isAuthenticated$;
  }

  ngOnInit(): void {
    // GlobalStateService's constructor now handles adding the initial session if none exist.
  }

  createNewChat(): void {
    // Correct way to get the current state's sessions count for naming
    const sessionsCount = this.globalStateService['_appState'].getValue().sessions.length;
    const newSessionTitle = `Chat ${sessionsCount + 1}`;
    this.globalStateService.addSession(newSessionTitle);
    console.log(`SidebarComponent: Created new chat: '${newSessionTitle}'`);
  }

  switchChat(sessionId: string): void {
    this.globalStateService.setCurrentSession(sessionId);
  }

  deleteChat(sessionId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      this.globalStateService.deleteSession(sessionId);
    }
  }

  // signIn(): void {
  //   this.googleAuthService.signInWithGoogle();
  // }

  signOut(): void {
    this.googleAuthService.signOut();
  }
}