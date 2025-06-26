// Inside ai-chat-interface.component.ts, replace your existing ChatMessage interface with this:

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