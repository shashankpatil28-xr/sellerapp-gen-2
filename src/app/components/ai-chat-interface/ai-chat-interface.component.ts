// src/app/components/ai-chat-interface/ai-chat-interface.component.ts
import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { ApiClientService } from '../../services/api-client.service'; // Import ApiClientService
import { GoogleAuthService } from '../../services/google-auth.service'; // Import GoogleAuthService
import { GlobalStateService } from '../../services/global-state.service'; // Adjust path for GlobalStateService
import { Subscription, Observable, filter, map, take } from 'rxjs'; // Added map, take for rxjs
import { ChatMessage, SearchResult, UserInfo, ChatSession } from '../../models/app-state.model'; // Adjust path for models

// Dummy API response object, matching the schema you provided for local testing.
const DUMMY_API_RESPONSE = {
    "llm_response": [
        {
            "videoMetadata": null,
            "thought": null,
            "inlineData": null,
            "fileData": null,
            "thoughtSignature": null,
            "codeExecutionResult": null,
            "executableCode": null,
            "functionCall": null,
            "functionResponse": null,
            "text": "Received 12 results."
        }
    ],
    "session_id": "1b465fbc-3420-475e-a875-2e4a6d4b3331",
    "data": {
        "search_results": [
            { "Item_id": "2170", "name": "Probase Mens Shirts", "images": ["https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/2170.jpg"], "price": { "currency": "INR", "value": "999.0" }, "brand_name": "Probase" },
            { "Item_id": "8209", "name": "Locomotive Men Stripe Lann Grey T-Shirts", "images": ["https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8209.jpg"], "price": { "currency": "INR", "value": "519.0" }, "brand_name": "LOCOMOTIVE" },
            { "Item_id": "8189", "name": "Locomotive Men Solid Poplin Laird Blue Shirts", "images": ["https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8189.jpg"], "price": { "currency": "INR", "value": "909.0" }, "brand_name": "LOCOMOTIVE" },
            { "Item_id": "8187", "name": "Locomotive Men Solid Poplin Laibrook Blue Shirts", "images": ["https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8187.jpg"], "price": { "currency": "INR", "value": "909.0" }, "brand_name": "LOCOMOTIVE" },
            { "Item_id": "8196", "name": "Locomotive Men Solid Poplin Lamech Navy Blue Shirts", "images": ["https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8196.jpg"], "price": { "currency": "INR", "value": "909.0" }, "brand_name": "LOCOMOTIVE" },
            { "Item_id": "8193", "name": "Locomotive Men Solid Poplin Lamar Blue Shirts", "images": ["https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8193.jpg"], "price": { "currency": "INR", "value": "909.0" }, "brand_name": "LOCOMOTIVE" },
            { "Item_id": "2171", "name": "Probase Mens Polo T-Shirts", "images": ["https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/2171.jpg"], "price": { "currency": "INR", "value": "799.0" }, "brand_name": "Probase" },
            { "Item_id": "8210", "name": "Locomotive Men Graphic Print Black T-Shirts", "images": ["https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8210.jpg"], "price": { "currency": "INR", "value": "650.0" }, "brand_name": "LOCOMOTIVE" },
            { "Item_id": "8190", "name": "Locomotive Men Casual Solid White Shirts", "images": ["https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8190.jpg"], "price": { "currency": "INR", "value": "850.0" }, "brand_name": "LOCOMOTIVE" },
            { "Item_id": "8188", "name": "Locomotive Men Checked Flannel Shirts", "images": ["https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8188.jpg"], "price": { "currency": "INR", "value": "1100.0" }, "brand_name": "LOCOMOTIVE" },
            { "Item_id": "8197", "name": "Locomotive Men Slim Fit Formal Shirts", "images": ["https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8197.jpg"], "price": { "currency": "INR", "value": "1250.0" }, "brand_name": "LOCOMOTIVE" },
            { "Item_id": "8194", "name": "Locomotive Men Linen Blend Shirts", "images": ["https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8194.jpg"], "price": { "currency": "INR", "value": "950.0" }, "brand_name": "LOCOMOTIVE" }
        ]
    }
};

@Component({
  selector: 'app-ai-chat-interface',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat-interface.component.html',
  styleUrls: ['./ai-chat-interface.component.scss']
})
export class AiChatInterfaceComponent implements OnInit, OnDestroy {
  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  currentMessage: string = '';
  messages$: Observable<ChatMessage[]>;
  isLoading: boolean = false;
  currentUserDisplayName: string = 'User';
  private authSubscription!: Subscription;
  private userProfileSubscription!: Subscription;
  private chatMessagesSubscription!: Subscription;
  private currentSessionSubscription!: Subscription; // New subscription for current session details

  private apiClientService: ApiClientService = inject(ApiClientService);
  private googleAuthService: GoogleAuthService = inject(GoogleAuthService);
  private globalStateService: GlobalStateService = inject(GlobalStateService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  // Store the current session actively to easily get its ID for API calls
  private currentSession: ChatSession | undefined;

  constructor() {
    this.messages$ = this.globalStateService.currentSessionMessages$;
  }

  ngOnInit(): void {
    // Keep these subscriptions for user data display
    this.authSubscription = this.googleAuthService.isAuthenticated$.subscribe(isAuthenticated => {
      // Logic for authenticated status can go here if needed for component display
    });

    this.userProfileSubscription = this.googleAuthService.userProfile$.subscribe(profile => {
      if (profile && profile.email) {
        this.currentUserDisplayName = profile.name || profile.email.split('@')[0];
      } else {
        this.currentUserDisplayName = 'Guest';
      }
      this.cdr.detectChanges();
    });

    // Subscribe to current session to get its ID for API calls
    this.currentSessionSubscription = this.globalStateService.currentSession$.subscribe(session => {
      this.currentSession = session;
      console.log('AiChatInterfaceComponent: Current session changed:', session ? session.id : 'None');
    });

    // Subscribe to messages$ and trigger scroll to bottom
    this.chatMessagesSubscription = this.messages$
      .pipe(filter(messages => messages.length > 0))
      .subscribe(() => {
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      });

    // Ensure a session is active on load
    this.globalStateService.currentSessionId$.pipe(
      filter(sessionId => !sessionId),
      take(1), // Ensure this runs only once on init if no session is active
      map(() => this.globalStateService['_appState'].getValue().sessions)
    ).subscribe(sessions => {
      if (sessions.length > 0) {
        this.globalStateService.setCurrentSession(sessions[0].id);
        console.log('AiChatInterfaceComponent: Set initial current session from existing sessions.');
      } else {
        // If no sessions exist AT ALL, GlobalStateService's constructor should have created one.
        // This log acts as a double-check.
        console.log('AiChatInterfaceComponent: No sessions found, GlobalStateService should have created one.');
      }
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.userProfileSubscription?.unsubscribe();
    this.chatMessagesSubscription?.unsubscribe();
    this.currentSessionSubscription?.unsubscribe(); // Unsubscribe from new session subscription
  }

  /**
   * @function sendMessage
   * @description Handles sending the user's message to the AI using the real API.
   * Passes the session_id if an existing chat.
   */
  async sendMessage(): Promise<void> {
    if (this.currentMessage.trim() === '' || this.isLoading) {
      console.log('DEBUG: sendMessage: Input empty or already loading. Returning.');
      return;
    }

    // AUTH CHECK: Uncomment this when you're ready to enforce sign-in
    // if (!this.googleAuthService.getIdToken()) {
    //   this.globalStateService.addMessageToCurrentSession('bot', 'Please sign in with Google to send messages.');
    //   console.warn('DEBUG: sendMessage: User not authenticated. Displaying sign-in message.');
    //   this.currentMessage = '';
    //   return;
    // }

    const userMsgText = this.currentMessage.trim();
    this.globalStateService.addMessageToCurrentSession('user', userMsgText, undefined, true); // true for isSending
    this.currentMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    console.log('DEBUG: sendMessage: User message added, isLoading set to true.');

    // Determine if we need to send a sessionId
    const payload: { query: string; sessionId?: string } = { query: userMsgText };
    if (this.currentSession && this.currentSession.id && this.currentSession.messages.length > 1) { // messages.length > 1 means it's not the first message in a new session (welcome message + user's first query)
      payload.sessionId = this.currentSession.id;
      console.log(`DEBUG: sendMessage: Sending message with existing session ID: ${payload.sessionId}`);
    } else {
      console.log('DEBUG: sendMessage: Sending message for a NEW session (no sessionId initially).');
    }


    this.apiClientService.onSearch(payload).subscribe({
      next: (apiResponse: any) => {
        this.globalStateService.updateLastUserMessageStatus(false); // Remove 'isSending'

        // Check if the backend returned a session_id (relevant for the first message in a new chat)
        if (apiResponse.session_id && this.currentSession && this.currentSession.id !== apiResponse.session_id) {
            console.log(`DEBUG: API returned new session_id: ${apiResponse.session_id}. Updating current session.`);
            this.globalStateService.updateSessionIdForCurrentSession(apiResponse.session_id);
        }

        this.processApiResponse(apiResponse);
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('DEBUG: sendMessage: API Response processed, isLoading set to false.');
      },
      error: (err) => {
        console.error('DEBUG: Error sending message to API:', err);
        this.globalStateService.updateLastUserMessageStatus(false);
        this.globalStateService.addMessageToCurrentSession(
          'bot',
          'Error: ' + (err.message || 'Something went wrong with the API call. Check console for details.')
        );
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('DEBUG: sendMessage: Error handled, isLoading set to false.');
      }
    });
  }

  /**
   * @function dummySendMessage
   * @description Simulates sending a message and receiving a dummy API response.
   * Useful for local UI development without hitting the actual backend.
   * @param queryText Optional: The dummy query text to display as a user message. Defaults to "Show me dummy products".
   */
  async dummySendMessage(queryText: string = "Show me dummy products"): Promise<void> {
    console.log('DEBUG: dummySendMessage: Triggered.');

    const userMsgText = this.currentMessage.trim() || queryText;
    this.globalStateService.addMessageToCurrentSession('user', userMsgText, undefined, true); // true for isSending
    this.currentMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.globalStateService.updateLastUserMessageStatus(false); // Remove 'isSending' after delay

    // Use the DUMMY_API_RESPONSE_NEW, potentially updating its session_id for realism
    const dummyResponse = { ...DUMMY_API_RESPONSE };
    if (this.currentSession && this.currentSession.id && this.currentSession.messages.length > 1) {
      // If it's an ongoing session, use the current session ID for dummy response
      dummyResponse.session_id = this.currentSession.id;
      console.log(`DEBUG: Dummy response using existing session ID: ${dummyResponse.session_id}`);
    } else {
      // For a new session, backend would generate a new ID. Simulate that.
      dummyResponse.session_id = "dummy_session_id_new_" + Math.random().toString(36).substring(2, 10);
      console.log(`DEBUG: Dummy response for NEW session, generating new dummy ID: ${dummyResponse.session_id}`);
    }

    // Check if the dummy response returned a session_id and update current session if needed
    if (dummyResponse.session_id && this.currentSession && this.currentSession.id !== dummyResponse.session_id) {
      console.log(`DEBUG: Dummy API returned new session_id: ${dummyResponse.session_id}. Updating current session.`);
      this.globalStateService.updateSessionIdForCurrentSession(dummyResponse.session_id);
    }

    this.processApiResponse(dummyResponse); // Process the dummy response directly

    this.isLoading = false;
    this.cdr.detectChanges();
    console.log('DEBUG: dummySendMessage: Dummy response processed, isLoading set to false.');
  }

  /**
   * @function processApiResponse
   * @description Helper function to parse and add bot messages to the chat state.
   * @param apiResponse The raw API response object.
   */
  private processApiResponse(apiResponse: any): void {
    console.log('DEBUG: processApiResponse: Processing API response (raw):', apiResponse);

    const botMessage: ChatMessage = {
      type: 'bot',
      timestamp: new Date(),
      id: '' // ID will be assigned by GlobalStateService's uuid
    };

    // Extract LLM text (using the new sample response structure)
    if (apiResponse.llm_response && Array.isArray(apiResponse.llm_response) && apiResponse.llm_response.length > 0) {
      botMessage.text = apiResponse.llm_response[0].text;
      console.log('DEBUG: Extracted LLM Response text:', botMessage.text);
    }

    // Extract search results
    if (apiResponse.data && apiResponse.data.search_results && Array.isArray(apiResponse.data.search_results)) {
      botMessage.searchResults = apiResponse.data.search_results.map((item: any) => ({
        Item_id: item.Item_id,
        name: item.name,
        images: Array.isArray(item.images) ? item.images : [],
        price: {
          currency: item.price?.currency || 'INR',
          value: item.price?.value || 'N/A'
        },
        brand_name: item.brand_name
      })) as SearchResult[];
      console.log('DEBUG: Processed search results:', botMessage.searchResults);
    }

    // Fallback if no specific content was extracted
    if (!botMessage.text && (!botMessage.searchResults || botMessage.searchResults.length === 0)) {
      try {
        botMessage.text = JSON.stringify(apiResponse, null, 2);
        console.warn('DEBUG: No specific content extracted, falling back to full JSON stringify for bot message.');
      } catch (e: any) {
        botMessage.text = 'Error converting API response to JSON string for display: ' + e.message;
        console.error('DEBUG: Error stringifying fallback API response:', e);
      }
    }

    // Add the structured bot message to the state service
    this.globalStateService.addMessageToCurrentSession(
      botMessage.type,
      botMessage.text,
      botMessage.searchResults
    );
  }

  /**
   * @function handleEnterKey
   * @description Triggers sendMessage (or dummySendMessage) when the Enter key is pressed without Shift.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  handleEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default new line
      this.dummySendMessage(); // Call the dummy send function for testing
      // To switch back to real API, change to: this.sendMessage();
    }
  }

  /**
   * @function scrollToBottom
   * @description Scrolls the chat messages container to the bottom.
   */
  private scrollToBottom(): void {
    if (this.chatScrollContainer) {
      this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
      console.log('DEBUG: scrollToBottom: Scrolled to bottom.');
    } else {
      console.warn('DEBUG: scrollToBottom: chatScrollContainer is not available yet.');
    }
  }

  // TrackBy function for NgFor to improve performance
  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id; // Use unique message ID for tracking
  }
}