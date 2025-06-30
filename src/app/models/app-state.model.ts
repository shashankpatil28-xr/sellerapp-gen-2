// src/app/shared/models/app-state.model.ts

/**
 * @interface UserInfo
 * @description Defines the structure for authenticated user data in the global state.
 */
export interface UserInfo {
  email: string;
  name: string;
  prefLanguage?: string; // Optional user preference
  location?: string; // Optional user preference
  userId: string; // Unique ID from auth provider
  isAuthenticated: boolean;
  // Add any other relevant user details you might store
}

/**
 * @interface SearchResult
 * @description Defines the structure for a single search result item, mirroring your existing structure.
 */
export interface SearchResult {
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
 * @description Defines the structure for a single chat message, mirroring your existing structure.
 * @property {'user' | 'bot'} type - The sender of the message.
 * @property {string} [text] - The plain text content of the message.
 * @property {boolean} [isSending] - Optional: true if the message is currently being sent (for user messages).
 * @property {SearchResult[]} [searchResults] - Optional: Array of structured search results for bot messages.
 */
export interface ChatMessage {
  id: string; // Unique ID for the message (will be generated client-side or if backend sends it)
  type: 'user' | 'bot';
  text?: string;
  timestamp: Date; // Added timestamp for display and sorting
  isSending?: boolean; // Applicable for user messages while waiting for API response
  searchResults?: SearchResult[]; // Applicable for bot messages
}

/**
 * @interface ChatSession
 * @description Defines the structure for a single chat conversation, encapsulating its history and metadata.
 */
export interface ChatSession {
  id: string; // This will now hold the backend-provided session_id. For new sessions, it might be temporary client-side ID initially.
  title: string; // A descriptive title for the session (e.g., "AI Chat about Angular components")
  messages: ChatMessage[];
  createdAt: Date;
  lastUpdatedAt: Date;
  // Add other session metadata like tags, associated project, etc. if needed
}

/**
 * @interface AppState
 * @description The top-level interface for the entire application's global state.
 */
export interface AppState {
  userInfo: UserInfo | null; // Null if not authenticated
  sessions: ChatSession[];
  currentSessionId: string | null; // ID of the currently active session
}