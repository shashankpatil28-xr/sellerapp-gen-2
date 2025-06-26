import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { ApiClientService } from '../../services/api-client.service'; // Import ApiClientService
import { GoogleAuthService } from '../../services/google-auth.service'; // Import GoogleAuthService
import { ChatStateService } from '../../services/chat-state.service'; // Import ChatStateService
import { Subscription, Observable } from 'rxjs';

/**
 * @interface SearchResult
 * @description Defines the structure for a single search result item.
 */
interface SearchResult {
  Item_id: string;
  name: string;
  images: string[];
  price: {
    currency: string;
    value: string;
  };
  brand_name: string;
}

/**
 * @interface ChatMessage
 * @description Defines the structure for a single chat message to display in the UI.
 * Can contain either user text, bot text, or structured search results.
 * @property {'user' | 'bot'} type - The sender of the message.
 * @property {string} [text] - The plain text content of the message (optional for bot messages if only results are present).
 * @property {boolean} [isSending] - Optional: true if the message is currently being sent (for user messages).
 * @property {SearchResult[]} [searchResults] - Optional: Array of structured search results for bot messages.
 */
interface ChatMessage {
  type: 'user' | 'bot';
  text?: string;
  isSending?: boolean; // Only applicable for user messages
  searchResults?: SearchResult[]; // Only applicable for bot messages
}

// // Dummy API response object, matching the schema you provided
// // In a real scenario, you might load this from a local data.json file using Angular's HttpClient,
// // but for a quick dummy function, hardcoding here is fine for demonstration.
// const DUMMY_API_RESPONSE = {
//     "llm_response": [
//         {
//             "videoMetadata": null,
//             "thought": null,
//             "inlineData": null,
//             "fileData": null,
//             "thoughtSignature": null,
//             "codeExecutionResult": null,
//             "executableCode": null,
//             "functionCall": null,
//             "functionResponse": null,
//             "text": "Received 12 results."
//         }
//     ],
//     "session_id": "1b465fbc-3420-475e-a875-2e4a6d4b3331",
//     "data": {
//         "search_results": [
//             {
//                 "Item_id": "2170",
//                 "name": "Probase Mens Shirts",
//                 "images": [
//                     "https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/2170.jpg"
//                 ],
//                 "price": {
//                     "currency": "INR",
//                     "value": "999.0"
//                 },
//                 "brand_name": "Probase"
//             },
//             {
//                 "Item_id": "8209",
//                 "name": "Locomotive Men Stripe Lann Grey T-Shirts",
//                 "images": [
//                     "https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8209.jpg"
//                 ],
//                 "price": {
//                     "currency": "INR",
//                     "value": "519.0"
//                 },
//                 "brand_name": "LOCOMOTIVE"
//             },
//             {
//                 "Item_id": "8189",
//                 "name": "Locomotive Men Solid Poplin Laird Blue Shirts",
//                 "images": [
//                     "https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8189.jpg"
//                 ],
//                 "price": {
//                     "currency": "INR",
//                     "value": "909.0"
//                 },
//                 "brand_name": "LOCOMOTIVE"
//             },
//             {
//                 "Item_id": "8187",
//                 "name": "Locomotive Men Solid Poplin Laibrook Blue Shirts",
//                 "images": [
//                     "https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8187.jpg"
//                 ],
//                 "price": {
//                     "currency": "INR",
//                     "value": "909.0"
//                 },
//                 "brand_name": "LOCOMOTIVE"
//             },
//             {
//                 "Item_id": "8196",
//                 "name": "Locomotive Men Solid Poplin Lamech Navy Blue Shirts",
//                 "images": [
//                     "https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8196.jpg"
//                 ],
//                 "price": {
//                     "currency": "INR",
//                     "value": "909.0"
//                 },
//                 "brand_name": "LOCOMOTIVE"
//             },
//             {
//                 "Item_id": "8193",
//                 "name": "Locomotive Men Solid Poplin Lamar Blue Shirts",
//                 "images": [
//                     "https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8193.jpg"
//                 ],
//                 "price": {
//                     "currency": "INR",
//                     "value": "909.0"
//                 },
//                 "brand_name": "LOCOMOTIVE"
//             },
//             {
//                 "Item_id": "2171",
//                 "name": "Probase Mens Polo T-Shirts",
//                 "images": [
//                     "https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/2171.jpg"
//                 ],
//                 "price": {
//                     "currency": "INR",
//                     "value": "799.0"
//                 },
//                 "brand_name": "Probase"
//             },
//             {
//                 "Item_id": "8210",
//                 "name": "Locomotive Men Graphic Print Black T-Shirts",
//                 "images": [
//                     "https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8210.jpg"
//                 ],
//                 "price": {
//                     "currency": "INR",
//                     "value": "650.0"
//                 },
//                 "brand_name": "LOCOMOTIVE"
//             },
//             {
//                 "Item_id": "8190",
//                 "name": "Locomotive Men Casual Solid White Shirts",
//                 "images": [
//                     "https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8190.jpg"
//                 ],
//                 "price": {
//                     "currency": "INR",
//                     "value": "850.0"
//                 },
//                 "brand_name": "LOCOMOTIVE"
//             },
//             {
//                 "Item_id": "8188",
//                 "name": "Locomotive Men Checked Flannel Shirts",
//                 "images": [
//                     "https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8188.jpg"
//                 ],
//                 "price": {
//                     "currency": "INR",
//                     "value": "1100.0"
//                 },
//                 "brand_name": "LOCOMOTIVE"
//             },
//             {
//                 "Item_id": "8197",
//                 "name": "Locomotive Men Slim Fit Formal Shirts",
//                 "images": [
//                     "https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8197.jpg"
//                 ],
//                 "price": {
//                     "currency": "INR",
//                     "value": "1250.0"
//                 },
//                 "brand_name": "LOCOMOTIVE"
//             },
//             {
//                 "Item_id": "8194",
//                 "name": "Locomotive Men Linen Blend Shirts",
//                 "images": [
//                     "https://storage.mtls.cloud.google.com/retail_images__agenticdemo/images/8194.jpg"
//                 ],
//                 "price": {
//                     "currency": "INR",
//                     "value": "950.0"
//                 },
//                 "brand_name": "LOCOMOTIVE"
//             }
//         ]
//     }
// };

@Component({
  selector: 'app-ai-chat-interface',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat-interface.component.html',
  styleUrls: ['./ai-chat-interface.component.scss']
})
export class AiChatInterfaceComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessagesContainer') private chatMessagesContainer!: ElementRef;

  currentMessage: string = '';
  messages$: Observable<ChatMessage[]>;
  isLoading: boolean = false;
  currentUserDisplayName: string = 'User';
  private authSubscription!: Subscription;
  private userProfileSubscription!: Subscription;
  private chatMessagesSubscription!: Subscription;

  private apiClientService: ApiClientService = inject(ApiClientService);
  private googleAuthService: GoogleAuthService = inject(GoogleAuthService);
  private chatStateService: ChatStateService = inject(ChatStateService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor() {
    this.messages$ = this.chatStateService.messages$;
  }

  ngOnInit(): void {
    this.authSubscription = this.googleAuthService.isAuthenticated$.subscribe(isAuthenticated => {
      // console.log('User authenticated (GIS):', isAuthenticated);
    });

    this.userProfileSubscription = this.googleAuthService.userProfile$.subscribe(profile => {
      if (profile && profile.email) {
        this.currentUserDisplayName = profile.email;
      } else {
        this.currentUserDisplayName = 'Guest';
      }
      this.cdr.detectChanges();
    });

    this.chatMessagesSubscription = this.messages$.subscribe(() => {
      setTimeout(() => {
        this.scrollToBottom();
      }, 50);
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.userProfileSubscription) {
      this.userProfileSubscription.unsubscribe();
    }
    if (this.chatMessagesSubscription) {
      this.chatMessagesSubscription.unsubscribe();
    }
  }

  /**
   * @function sendMessage
   * @description Handles sending the user's message to the AI.
   * Adds the user message to the chat, calls the API, and displays the API's structured response.
   */
  async sendMessage(): Promise<void> {
    if (this.currentMessage.trim() === '' || this.isLoading) {
      console.log('DEBUG: sendMessage: Input empty or already loading. Returning.');
      return;
    }

    if (!this.googleAuthService.getIdToken()) {
      this.chatStateService.addMessage({ type: 'bot', text: 'Please sign in with Google to send messages.' });
      console.warn('DEBUG: sendMessage: User not authenticated. Displaying sign-in message.');
      return;
    }

    const userMsgText = this.currentMessage.trim();
    this.chatStateService.addMessage({ type: 'user', text: userMsgText, isSending: true });
    this.currentMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    console.log('DEBUG: sendMessage: User message added, isLoading set to true.');

    this.apiClientService.onSearch({ query: userMsgText }).subscribe({
      next: (apiResponse: any) => {
        this.processApiResponse(apiResponse); // Use the helper to process
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('DEBUG: sendMessage: API Response processed, isLoading set to false.');
      },
      error: (err) => {
        console.error('DEBUG: Error sending message to API:', err);
        this.chatStateService.updateMessages(messages => {
          const lastUserMessageIndex = messages.findIndex(msg => msg.type === 'user' && msg.isSending);
          if (lastUserMessageIndex !== -1) {
            messages[lastUserMessageIndex].isSending = false;
          }
          return messages;
        });

        this.chatStateService.addMessage({ type: 'bot', text: 'Error: ' + (err.message || 'Something went wrong with the API call. Check console for details.') });
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('DEBUG: sendMessage: Error handled, isLoading set to false.');
      }
    });
  }

  // /**
  //  * @function dummySendMessage
  //  * @description Simulates sending a message and receiving a dummy API response.
  //  * Useful for local UI development without hitting the actual backend.
  //  * @param queryText Optional: The dummy query text to display as a user message. Defaults to "Show me dummy products".
  //  */
  // async dummySendMessage(queryText: string = "Show me dummy products"): Promise<void> {
  //   console.log('DEBUG: dummySendMessage: Triggered.');

  //   // Simulate sending a user message
  //   this.chatStateService.addMessage({ type: 'user', text: queryText, isSending: true });
  //   this.isLoading = true;
  //   this.cdr.detectChanges(); // Update UI to show sending state

  //   // Simulate network delay
  //   await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 seconds delay

  //   // Process the dummy response directly
  //   this.processApiResponse(DUMMY_API_RESPONSE);

  //   // Update the last user message to remove the sending indicator
  //   this.chatStateService.updateMessages(messages => {
  //     const lastUserMessageIndex = messages.findIndex(msg => msg.type === 'user' && msg.isSending);
  //     if (lastUserMessageIndex !== -1) {
  //       messages[lastUserMessageIndex].isSending = false;
  //     }
  //     return messages;
  //   });

  //   this.isLoading = false;
  //   this.cdr.detectChanges(); // Force update after processing and adding bot message
  //   console.log('DEBUG: dummySendMessage: Dummy response processed, isLoading set to false.');
  // }

  /**
   * @function processApiResponse
   * @description Helper function to parse and add bot messages to the chat state.
   * @param apiResponse The raw API response object.
   */
  private processApiResponse(apiResponse: any): void {
    console.log('DEBUG: processApiResponse: Processing API response (raw):', apiResponse);

    const botMessage: ChatMessage = { type: 'bot' };

    // Extract LLM text
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
    this.chatStateService.addMessage(botMessage);
  }

  /**
   * @function handleEnterKey
   * @description Triggers sendMessage when the Enter key is pressed without Shift.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  handleEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
      // this.dummySendMessage(); // Use dummySendMessage for testing
    }
  }

  /**
   * @function scrollToBottom
   * @description Scrolls the chat messages container to the bottom.
   */
  private scrollToBottom(): void {
    if (this.chatMessagesContainer) {
      this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
      console.log('DEBUG: scrollToBottom: Scrolled to bottom.');
    } else {
      console.warn('DEBUG: scrollToBottom: chatMessagesContainer is not available yet.');
    }
  }
}
