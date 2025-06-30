// src/app/core/services/global-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { AppState, UserInfo, ChatSession, ChatMessage, SearchResult } from '../models/app-state.model';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_KEY = 'sellerAppGlobalState';

@Injectable({
  providedIn: 'root'
})
export class GlobalStateService {
  private _appState = new BehaviorSubject<AppState>(this.loadInitialState());

  public readonly appState$: Observable<AppState> = this._appState.asObservable();
  public readonly userInfo$: Observable<UserInfo | null> = this.appState$.pipe(
    map(state => state.userInfo),
    distinctUntilChanged()
  );
  public readonly sessions$: Observable<ChatSession[]> = this.appState$.pipe(
    map(state => state.sessions),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  );
  public readonly currentSessionId$: Observable<string | null> = this.appState$.pipe(
    map(state => state.currentSessionId),
    distinctUntilChanged()
  );
  public readonly currentSession$: Observable<ChatSession | undefined> = this.appState$.pipe(
    map(state => state.sessions.find(s => s.id === state.currentSessionId)),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  );
  public readonly currentSessionMessages$: Observable<ChatMessage[]> = this.currentSession$.pipe(
    map(session => session ? session.messages : []),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  );

  constructor() {
    this.appState$.subscribe(state => {
      this.saveState(state);
      // For debugging: Log the entire state on change
      console.log('GlobalStateService: Current App State Updated:', JSON.parse(JSON.stringify(state)));
    });

    const currentStateOnConstruct = this._appState.getValue();
    if (currentStateOnConstruct.sessions.length === 0 && !currentStateOnConstruct.currentSessionId) {
      this.addSession('New Chat'); // Add a default session on app load if none exists
      console.log('GlobalStateService: Added initial default session.');
    }
  }

  private loadInitialState(): AppState {
    try {
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedState) {
        const parsedState: AppState = JSON.parse(storedState);
        parsedState.sessions.forEach(session => {
          session.createdAt = new Date(session.createdAt);
          session.lastUpdatedAt = new Date(session.lastUpdatedAt);
          session.messages.forEach(message => message.timestamp = new Date(message.timestamp));
        });
        return parsedState;
      }
    } catch (e) {
      console.error("GlobalStateService: Failed to load state from localStorage", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    return {
      userInfo: null,
      sessions: [],
      currentSessionId: null
    };
  }

  private saveState(state: AppState): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("GlobalStateService: Failed to save state to localStorage", e);
    }
  }

  updateUserInfo(userInfo: UserInfo): void {
    const currentState = this._appState.getValue();
    this._appState.next({ ...currentState, userInfo });
    console.log('GlobalStateService: UserInfo updated.');
  }

  clearUserInfo(): void {
    const currentState = this._appState.getValue();
    this._appState.next({ ...currentState, userInfo: null });
    console.log('GlobalStateService: UserInfo cleared.');
  }

  addSession(title: string, sessionId?: string): string {
    const currentState = this._appState.getValue();
    // Use provided sessionId if available, otherwise generate a temporary client-side ID
    const newSessionId = sessionId || uuidv4();
    const newSession: ChatSession = {
      id: newSessionId, // This might be a temporary client-side ID or backend ID
      title: title,
      messages: [],
      createdAt: new Date(),
      lastUpdatedAt: new Date()
    };
    const updatedSessions = [...currentState.sessions, newSession];
    this._appState.next({
      ...currentState,
      sessions: updatedSessions,
      currentSessionId: newSessionId
    });
    console.log(`GlobalStateService: Added new session '${title}' with ID: ${newSessionId}`);
    return newSessionId;
  }

  setCurrentSession(sessionId: string): void {
    const currentState = this._appState.getValue();
    if (currentState.sessions.some(s => s.id === sessionId)) {
      this._appState.next({ ...currentState, currentSessionId: sessionId });
      console.log(`GlobalStateService: Switched to session ID: ${sessionId}`);
    } else {
      console.warn(`GlobalStateService: Session with ID ${sessionId} not found. Cannot set as current.`);
    }
  }

  // NEW METHOD: To update a session's ID (e.g., when backend provides it)
  updateSessionIdForCurrentSession(newBackendSessionId: string): void {
    const currentState = this._appState.getValue();
    if (!currentState.currentSessionId) {
      console.warn("GlobalStateService: No current session to update its ID.");
      return;
    }

    const updatedSessions = currentState.sessions.map(session => {
      if (session.id === currentState.currentSessionId) {
        // Only update if the current session ID is different or still a client-side generated one
        if (session.id !== newBackendSessionId) {
            console.log(`GlobalStateService: Updating current session ID from '${session.id}' to backend ID '${newBackendSessionId}'.`);
            return { ...session, id: newBackendSessionId };
        }
      }
      return session;
    });

    // Also update currentSessionId in global state if it was the old client-side ID
    this._appState.next({
        ...currentState,
        sessions: updatedSessions,
        currentSessionId: newBackendSessionId // Ensure currentSessionId points to the new backend ID
    });
  }


  addMessageToCurrentSession(type: 'user' | 'bot', text?: string, searchResults?: SearchResult[], isSending?: boolean): void {
    const currentState = this._appState.getValue();
    if (!currentState.currentSessionId) {
      console.warn("GlobalStateService: No current session to add message to.");
      return;
    }

    const updatedSessions = currentState.sessions.map(session => {
      if (session.id === currentState.currentSessionId) {
        const newMessage: ChatMessage = {
          id: uuidv4(),
          type,
          text,
          timestamp: new Date(),
          isSending,
          searchResults
        };
        console.log(`GlobalStateService: Adding message to session '${session.id}'. Type: ${type}, Text: ${text}`);
        return {
          ...session,
          messages: [...session.messages, newMessage],
          lastUpdatedAt: new Date()
        };
      }
      return session;
    });
    this._appState.next({ ...currentState, sessions: updatedSessions });
  }

  updateLastUserMessageStatus(isSending: boolean): void {
    const currentState = this._appState.getValue();
    if (!currentState.currentSessionId) {
      console.warn("GlobalStateService: No current session to update message status in.");
      return;
    }

    const updatedSessions = currentState.sessions.map(session => {
      if (session.id === currentState.currentSessionId) {
        const messages = [...session.messages];
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].type === 'user' && messages[i].isSending !== undefined) {
            messages[i] = { ...messages[i], isSending: isSending };
            console.log(`GlobalStateService: Updated last user message 'isSending' status to ${isSending} in session '${session.id}'.`);
            break;
          }
        }
        return { ...session, messages };
      }
      return session;
    });
    this._appState.next({ ...currentState, sessions: updatedSessions });
  }

  deleteSession(sessionId: string): void {
    const currentState = this._appState.getValue();
    const updatedSessions = currentState.sessions.filter(s => s.id !== sessionId);
    let newCurrentSessionId = currentState.currentSessionId;

    if (newCurrentSessionId === sessionId) {
      newCurrentSessionId = updatedSessions.length > 0 ? updatedSessions[0].id : null;
    }

    this._appState.next({
      ...currentState,
      sessions: updatedSessions,
      currentSessionId: newCurrentSessionId
    });
    console.log(`GlobalStateService: Deleted session ID: ${sessionId}. New current session ID: ${newCurrentSessionId}`);
  }

  resetCurrentSessionMessages(): void {
    const currentState = this._appState.getValue();
    if (!currentState.currentSessionId) return;

    const updatedSessions = currentState.sessions.map(session => {
      if (session.id === currentState.currentSessionId) {
        return {
          ...session,
          messages: [{ type: 'bot', text: 'Hello! Please type your query to search.', id: uuidv4(), timestamp: new Date() } as ChatMessage],
          lastUpdatedAt: new Date()
        };
      }
      return session;
    });
    this._appState.next({ ...currentState, sessions: updatedSessions });
    console.log(`GlobalStateService: Reset messages for session ID: ${currentState.currentSessionId}`);
  }

  clearChatSessions(): void {
    const currentState = this._appState.getValue();
    this._appState.next({ ...currentState, sessions: [], currentSessionId: null });
    console.log('GlobalStateService: All chat sessions cleared.');
  }
}