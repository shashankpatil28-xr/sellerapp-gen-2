import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { ApiClientService } from '../../services/api-client.service'; // Import ApiClientService
import { AuthService } from '../../services/auth.service'; // <--- IMPORTANT: Import the new AuthService
import { Subscription } from 'rxjs';

/**
 * @interface ChatMessage
 * @description Defines the structure for a single chat message to display in the UI.
 * @property {'user' | 'bot'} type - The sender of the message.
 * @property {string} text - The content of the message.
 * @property {boolean} [isSending] - Optional: true if the message is currently being sent (for user messages).
 */
interface ChatMessage {
  type: 'user' | 'bot';
  text: string;
  isSending?: boolean;
}

@Component({
  selector: 'app-ai-chat-interface',
  standalone: true,
  imports: [CommonModule, FormsModule], // Import CommonModule for ngIf/ngFor and FormsModule for ngModel
  templateUrl: './ai-chat-interface.component.html',
  styleUrls: ['./ai-chat-interface.component.scss']
})
export class AiChatInterfaceComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessagesContainer') private chatMessagesContainer!: ElementRef;

  currentMessage: string = '';
  messages: ChatMessage[] = [];
  isLoading: boolean = false;
  currentUserDisplayName: string = 'User'; // Default, will update from AuthService
  private authSubscription!: Subscription;
  private userProfileSubscription!: Subscription;

  // Inject ApiClientService and AuthService
  private apiClientService: ApiClientService = inject(ApiClientService);
  private authService: AuthService = inject(AuthService); // <--- Inject the new AuthService

  constructor() { }

  ngOnInit(): void {
    // Subscribe to authentication status
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      // You can react to authentication status changes here if needed
      console.log('User authenticated (OAuth2/OIDC):', isAuthenticated);
    });

    // Subscribe to user profile from AuthService
    this.userProfileSubscription = this.authService.userProfile$.subscribe(profile => {
      if (profile && profile.info && profile.info.email) {
        this.currentUserDisplayName = profile.info.email; // Use email as display name
      } else {
        this.currentUserDisplayName = 'Guest';
      }
    });

    // Add a welcome message
    this.messages.push({ type: 'bot', text: 'Hello! Please type your query to search using the API.' });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.userProfileSubscription) {
      this.userProfileSubscription.unsubscribe();
    }
  }

  /**
   * @function sendMessage
   * @description Handles sending the user's message to the AI.
   * Adds the user message to the chat, calls the API, and displays the API's raw JSON response.
   */
  async sendMessage(): Promise<void> {
    if (this.currentMessage.trim() === '' || this.isLoading) {
      return; // Prevent sending empty messages or multiple requests
    }

    // Check if user is authenticated via AuthService before sending message
    if (!this.authService.getIdToken()) {
      this.messages.push({ type: 'bot', text: 'Please sign in to send messages.' });
      this.scrollToBottom();
      return;
    }

    const userMsgText = this.currentMessage.trim();
    this.messages.push({ type: 'user', text: userMsgText, isSending: true }); // Add user message with sending indicator
    this.currentMessage = ''; // Clear input field immediately
    this.isLoading = true; // Set loading state
    this.scrollToBottom(); // Scroll to show the new user message

    // Call the onSearch method from ApiClientService
    this.apiClientService.onSearch({ query: userMsgText }).subscribe({
      next: (apiResponse: any) => {
        // Find the last user message and remove its sending indicator
        const lastUserMessageIndex = this.messages.findIndex(msg => msg.type === 'user' && msg.isSending);
        if (lastUserMessageIndex !== -1) {
          this.messages[lastUserMessageIndex].isSending = false;
        }

        // Display the raw JSON response, pretty-printed
        this.messages.push({ type: 'bot', text: JSON.stringify(apiResponse, null, 2) });
        this.isLoading = false; // Reset loading state
        this.scrollToBottom(); // Scroll to show the new bot message
      },
      error: (err) => {
        console.error('Error sending message to API:', err);
        // Find the last user message and remove its sending indicator
        const lastUserMessageIndex = this.messages.findIndex(msg => msg.type === 'user' && msg.isSending);
        if (lastUserMessageIndex !== -1) {
          this.messages[lastUserMessageIndex].isSending = false;
        }
        this.messages.push({ type: 'bot', text: 'Error: ' + (err.message || 'Something went wrong with the API call. Check console for details.') }); // Display error
        this.isLoading = false; // Reset loading state
        this.scrollToBottom();
      }
    });
  }

  /**
   * @function handleEnterKey
   * @description Triggers sendMessage when the Enter key is pressed without Shift.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  handleEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent new line in textarea
      this.sendMessage();
    }
  }

  /**
   * @function scrollToBottom
   * @description Scrolls the chat messages container to the bottom.
   */
  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatMessagesContainer) {
        this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
      }
    }, 0); // Use setTimeout to ensure DOM is updated before scrolling
  }

  /**
   * @function signOut
   * @description Logs out the user via the AuthService.
   */
  signOut(): void {
    this.authService.logout();
    this.messages = []; // Clear messages on logout
    this.messages.push({ type: 'bot', text: 'You have been signed out. Please sign in again.' });
  }
}
