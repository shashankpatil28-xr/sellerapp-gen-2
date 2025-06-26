import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Re-defining interfaces for clarity, or you can import them if placed in a shared types file
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


@Injectable({
  providedIn: 'root'
})
export class ChatStateService {
  // BehaviorSubject holds the current state and emits it to new subscribers.
  // We initialize it with a welcome message.
  private _messages = new BehaviorSubject<ChatMessage[]>([
    { type: 'bot', text: 'Hello! Welcome to Sellerapp. Please type your query to search.' }
  ]);

  // Expose the messages as an Observable, so components can subscribe but not directly modify.
  public readonly messages$: Observable<ChatMessage[]> = this._messages.asObservable();

  constructor() {
    console.log('ChatStateService initialized.');
  }

  /**
   * Adds a new message to the chat history.
   * @param newMessage The ChatMessage object to add.
   */
  addMessage(newMessage: ChatMessage): void {
    const currentMessages = this._messages.getValue();
    const updatedMessages = [...currentMessages, newMessage];
    this._messages.next(updatedMessages);
    console.log('ChatStateService: Message added:', newMessage);
    console.log('ChatStateService: Current messages count:', updatedMessages.length);
  }

  /**
   * Updates the last message in the chat history.
   * Useful for changing the `isSending` status or adding API response data.
   * @param updateFn A function that receives the current messages array and returns the updated array.
   */
  updateMessages(updateFn: (messages: ChatMessage[]) => ChatMessage[]): void {
    const currentMessages = this._messages.getValue();
    const updatedMessages = updateFn(currentMessages);
    this._messages.next(updatedMessages);
    console.log('ChatStateService: Messages updated via updateFn. Current messages count:', updatedMessages.length);
  }

  /**
   * Gets the current array of messages. Use sparingly; prefer subscribing to messages$.
   * @returns The current array of ChatMessage objects.
   */
  getCurrentMessages(): ChatMessage[] {
    return this._messages.getValue();
  }

  /**
   * Resets the chat history to the initial welcome message.
   */
  resetChat(): void {
    this._messages.next([
      { type: 'bot', text: 'Hello! Please type your query to search using the API.' }
    ]);
    console.log('ChatStateService: Chat history reset.');
  }
}
