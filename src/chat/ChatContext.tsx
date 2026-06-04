import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { ChatState, ChatAction, ChatMessage } from './chatTypes';

// Mirrors src/context/ConnectorContext.tsx: a reducer + dual (state / dispatch) contexts.

const STORAGE_KEY = 'yaml-builder-chat-history';
const MAX_PERSISTED_MESSAGES = 20;

const initialState: ChatState = {
  messages: [],
  streamStatus: 'idle',
  streamingMessageId: null,
  errorText: null,
  authRequired: false,
};

function loadPersistedMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Keep only the most recent messages and coerce to the expected shape.
    return parsed
      .slice(-MAX_PERSISTED_MESSAGES)
      .filter((m): m is ChatMessage => !!m && (m.role === 'user' || m.role === 'assistant'));
  } catch {
    return [];
  }
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        errorText: null,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            role: 'user',
            content: action.payload.content,
            proposedYaml: null,
            timestamp: Date.now(),
          },
        ],
      };
    case 'BEGIN_ASSISTANT_MESSAGE':
      return {
        ...state,
        streamStatus: 'streaming',
        streamingMessageId: action.payload.id,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            role: 'assistant',
            content: '',
            proposedYaml: null,
            timestamp: Date.now(),
          },
        ],
      };
    case 'APPEND_ASSISTANT_CHUNK':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, content: m.content + action.payload.chunk } : m,
        ),
      };
    case 'FINALIZE_ASSISTANT_MESSAGE':
      return {
        ...state,
        streamStatus: 'idle',
        streamingMessageId: null,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, proposedYaml: action.payload.proposedYaml } : m,
        ),
      };
    case 'SET_ERROR':
      return { ...state, streamStatus: 'error', streamingMessageId: null, errorText: action.payload };
    case 'CLEAR_ERROR':
      return {
        ...state,
        errorText: null,
        streamStatus: state.streamStatus === 'error' ? 'idle' : state.streamStatus,
      };
    case 'SET_AUTH_REQUIRED':
      return { ...state, authRequired: action.payload };
    case 'CLEAR_PROPOSAL':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, proposedYaml: null } : m,
        ),
      };
    case 'CLEAR_CONVERSATION':
      return { ...initialState };
    case 'RESTORE':
      return { ...state, messages: action.payload };
    default:
      return state;
  }
}

const ChatStateContext = createContext<ChatState>(initialState);
const ChatDispatchContext = createContext<Dispatch<ChatAction>>(() => {});

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState, (init) => ({
    ...init,
    messages: loadPersistedMessages(),
  }));

  // Persist conversation, but not on every streamed chunk — only once a turn settles.
  useEffect(() => {
    if (state.streamStatus === 'streaming') return;
    try {
      if (state.messages.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages.slice(-MAX_PERSISTED_MESSAGES)));
      }
    } catch {
      // Ignore quota / serialization errors — persistence is best-effort.
    }
  }, [state.messages, state.streamStatus]);

  return (
    <ChatStateContext.Provider value={state}>
      <ChatDispatchContext.Provider value={dispatch}>{children}</ChatDispatchContext.Provider>
    </ChatStateContext.Provider>
  );
}

export function useChatState() {
  return useContext(ChatStateContext);
}

export function useChatDispatch() {
  return useContext(ChatDispatchContext);
}
