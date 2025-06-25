import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core'; // Import ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { ApiClientService } from '../../services/api-client.service'; // Import ApiClientService
import { GoogleAuthService } from '../../services/google-auth.service'; // Import GoogleAuthService
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
  currentUserDisplayName: string = 'User'; // Default, will update from GoogleAuthService
  private authSubscription!: Subscription;
  private userProfileSubscription!: Subscription;

  // Inject ApiClientService, GoogleAuthService, and ChangeDetectorRef
  private apiClientService: ApiClientService = inject(ApiClientService);
  private googleAuthService: GoogleAuthService = inject(GoogleAuthService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef); // Inject ChangeDetectorRef

  constructor() { }

  ngOnInit(): void {
    // Subscribe to authentication status
    this.authSubscription = this.googleAuthService.isAuthenticated$.subscribe(isAuthenticated => {
      // You can react to authentication status changes here if needed
      // console.log('User authenticated (GIS):', isAuthenticated);
    });

    // Subscribe to user profile from GoogleAuthService
    this.userProfileSubscription = this.googleAuthService.userProfile$.subscribe(profile => {
      if (profile && profile.email) {
        this.currentUserDisplayName = profile.email; // Use email as display name
      } else {
        this.currentUserDisplayName = 'Guest';
      }
      this.cdr.detectChanges(); // Force update after profile loads
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
      console.log('DEBUG: sendMessage: Input empty or already loading. Returning.');
      return; // Prevent sending empty messages or multiple requests
    }

    // Check if user is authenticated via GIS before sending message
    if (!this.googleAuthService.getIdToken()) {
      this.messages.push({ type: 'bot', text: 'Please sign in with Google to send messages.' });
      this.scrollToBottom();
      console.warn('DEBUG: sendMessage: User not authenticated. Displaying sign-in message.');
      return;
    }

    const userMsgText = this.currentMessage.trim();
    this.messages.push({ type: 'user', text: userMsgText, isSending: true }); // Add user message with sending indicator
    this.currentMessage = ''; // Clear input field immediately
    this.isLoading = true; // Set loading state
    this.cdr.detectChanges(); // Force change detection to show user message immediately
    this.scrollToBottom(); // Scroll to show the new user message
    console.log('DEBUG: sendMessage: User message added, isLoading set to true.');


    // Call the onSearch method from ApiClientService
    this.apiClientService.onSearch({ query: userMsgText }).subscribe({
      next: (apiResponse: any) => {
        console.log('DEBUG: API Response received (raw):', apiResponse);
        console.log('DEBUG: API Response type:', typeof apiResponse);

        // Find the last user message and remove its sending indicator
        const lastUserMessageIndex = this.messages.findIndex(msg => msg.type === 'user' && msg.isSending);
        if (lastUserMessageIndex !== -1) {
          this.messages[lastUserMessageIndex].isSending = false;
          console.log('DEBUG: sendMessage: Removed isSending from last user message.');
        }

        let botMessageText: string = '';

        // Safely extract llm_response.text and search_results based on the observed API response structure
        if (apiResponse && typeof apiResponse === 'object') {
            if (apiResponse.llm_response && apiResponse.llm_response.text) {
                botMessageText += apiResponse.llm_response.text.trim();
            }

            if (apiResponse.data && apiResponse.data.search_results && apiResponse.data.search_results.length > 0) {
                if (botMessageText) { // Add a newline if LLM response was already added
                    botMessageText += '\n\n';
                }
                botMessageText += '--- Search Results ---\n';
                apiResponse.data.search_results.forEach((item: any, index: number) => {
                    botMessageText += `Item ${index + 1}: ${item.name || 'N/A'}\n`;
                    if (item.price) {
                        botMessageText += `  Price: ${item.price.currency || ''} ${item.price.value || 'N/A'}\n`;
                    }
                    if (item.images && item.images.length > 0) {
                        botMessageText += `  Image: ${item.images[0].url || 'N/A'}\n`;
                    }
                });
                console.log('DEBUG: Processed search results.');
            } else if (apiResponse.data && apiResponse.data.search_results && apiResponse.data.search_results.length === 0) {
                 if (!botMessageText) { // Only add if LLM response wasn't already there
                    botMessageText += 'No search results found.';
                 }
            }

            // Fallback: If no specific parts were found, stringify the whole response
            if (!botMessageText.trim()) {
                try {
                    botMessageText = JSON.stringify(apiResponse, null, 2);
                    console.warn('DEBUG: No specific content extracted, falling back to full JSON stringify.');
                } catch (e) {
                    botMessageText = 'Error converting API response to JSON string for display.';
                    console.error('DEBUG: Error stringifying fallback API response:', e);
                }
            }
        } else {
            // If apiResponse is not an object, just convert it to string
            botMessageText = String(apiResponse);
            console.warn('DEBUG: API response is not an object. Converting to string directly.');
        }

        this.messages.push({ type: 'bot', text: botMessageText });
        console.log('DEBUG: sendMessage: Bot message added to messages array. Current messages:', this.messages);
        this.isLoading = false; // Reset loading state
        this.cdr.detectChanges(); // Force change detection after updating messages and isLoading
        this.scrollToBottom(); // Scroll to show the new bot message
        console.log('DEBUG: sendMessage: isLoading set to false, scrolled to bottom.');
      },
      error: (err) => {
        console.error('DEBUG: Error sending message to API:', err);
        // Find the last user message and remove its sending indicator
        const lastUserMessageIndex = this.messages.findIndex(msg => msg.type === 'user' && msg.isSending);
        if (lastUserMessageIndex !== -1) {
          this.messages[lastUserMessageIndex].isSending = false;
        }
        this.messages.push({ type: 'bot', text: 'Error: ' + (err.message || 'Something went wrong with the API call. Check console for details.') }); // Display error
        console.log('DEBUG: sendMessage: Error message added to messages array. Current messages:', this.messages);
        this.isLoading = false; // Reset loading state
        this.cdr.detectChanges(); // Force change detection after error
        this.scrollToBottom();
        console.log('DEBUG: sendMessage: isLoading set to false, scrolled to bottom (due to error).');
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
    // Adding a slight delay to ensure the DOM has rendered the new message before scrolling
    setTimeout(() => {
      if (this.chatMessagesContainer) {
        this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
        console.log('DEBUG: scrollToBottom: Scrolled to bottom.');
      } else {
        console.warn('DEBUG: scrollToBottom: chatMessagesContainer is not available yet.');
      }
    }, 50); // Increased timeout slightly for better reliability
  }
}