// Types for the AI chat agent that helps users build connector YAML.

export type MessageRole = 'user' | 'assistant';

// 'idle' — ready for input; 'streaming' — assistant response in flight; 'error' — last send failed.
export type StreamStatus = 'idle' | 'streaming' | 'error';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  // The complete YAML the assistant proposed in this message (extracted from a ```yaml block),
  // or null if the message contained no proposal. Cleared to null when the user dismisses it.
  proposedYaml: string | null;
  timestamp: number;
}

export interface ChatState {
  messages: ChatMessage[];
  streamStatus: StreamStatus;
  streamingMessageId: string | null;
  errorText: string | null;
}

export type ChatAction =
  | { type: 'ADD_USER_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'BEGIN_ASSISTANT_MESSAGE'; payload: { id: string } }
  | { type: 'APPEND_ASSISTANT_CHUNK'; payload: { id: string; chunk: string } }
  | { type: 'FINALIZE_ASSISTANT_MESSAGE'; payload: { id: string; proposedYaml: string | null } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_PROPOSAL'; payload: { id: string } }
  | { type: 'CLEAR_CONVERSATION' }
  | { type: 'RESTORE'; payload: ChatMessage[] };
