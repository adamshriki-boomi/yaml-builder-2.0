import { useState, type KeyboardEvent } from 'react';
import {
  ExTextarea,
  ExInput,
  ExIconButton,
  ExButton,
  IconButtonType,
  IconButtonFlavor,
  ButtonType,
  ButtonFlavor,
} from '@boomi/exosphere';
import { useChatState, useChatDispatch } from '../../chat/ChatContext';
import { useChatStream, ACCESS_CODE_STORAGE_KEY } from '../../chat/useChatStream';
import { useConnector } from '../../context/ConnectorContext';

const QUICK_PROMPTS = [
  'Create a basic REST connector with bearer auth',
  'Add cursor pagination to my first report',
  'Add an OAuth 2.0 client credentials auth flow',
  'Explain and validate my current configuration',
];

export default function ChatComposer() {
  const { messages, streamStatus, authRequired } = useChatState();
  const chatDispatch = useChatDispatch();
  const { yamlText } = useConnector();
  const { sendMessage, cancelStream } = useChatStream();
  const [draft, setDraft] = useState('');
  const [codeDraft, setCodeDraft] = useState('');
  const isStreaming = streamStatus === 'streaming';

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || isStreaming) return;
    setDraft('');
    void sendMessage(value, yamlText);
  };

  // Enter sends; Shift+Enter inserts a newline. Keyboard events are composed, so they bubble
  // out of the textarea's shadow DOM to this wrapper.
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(draft);
    }
  };

  const unlock = () => {
    const code = codeDraft.trim();
    if (!code) return;
    try {
      localStorage.setItem(ACCESS_CODE_STORAGE_KEY, code);
    } catch {
      // ignore storage errors
    }
    setCodeDraft('');
    chatDispatch({ type: 'SET_AUTH_REQUIRED', payload: false });
    chatDispatch({ type: 'CLEAR_ERROR' });
  };

  const handleCodeKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      unlock();
    }
  };

  // Access-code gate: shown only after the proxy rejected a request for a missing/incorrect code.
  if (authRequired) {
    return (
      <div className="chat-composer">
        <p className="chat-gate-text">Enter the access code to use the AI assistant.</p>
        <div className="chat-composer-row" onKeyDown={handleCodeKeyDown}>
          <ExInput
            className="chat-composer-input"
            type="password"
            placeholder="Access code"
            value={codeDraft}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onInput={(e: any) => setCodeDraft(e.target.value)}
          />
          <ExButton
            type={ButtonType.PRIMARY}
            flavor={ButtonFlavor.BRANDED}
            disabled={!codeDraft.trim()}
            onClick={unlock}
          >
            Unlock
          </ExButton>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-composer">
      {messages.length === 0 && (
        <div className="chat-chips">
          {QUICK_PROMPTS.map((p) => (
            <ExButton
              key={p}
              type={ButtonType.TERTIARY}
              flavor={ButtonFlavor.BASE}
              disabled={isStreaming}
              onClick={() => submit(p)}
            >
              {p}
            </ExButton>
          ))}
        </div>
      )}
      <div className="chat-composer-row" onKeyDown={handleKeyDown}>
        <ExTextarea
          className="chat-composer-input"
          placeholder="Describe your connector or ask for a change…"
          value={draft}
          rows={2}
          disabled={isStreaming}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onInput={(e: any) => setDraft(e.target.value)}
        />
        {isStreaming ? (
          <ExIconButton
            type={IconButtonType.SECONDARY}
            flavor={IconButtonFlavor.BASE}
            icon="stop-filled"
            label="Stop generating"
            onClick={cancelStream}
          />
        ) : (
          <ExIconButton
            type={IconButtonType.PRIMARY}
            flavor={IconButtonFlavor.BRANDED}
            icon="send-arrow"
            label="Send message"
            disabled={!draft.trim()}
            onClick={() => submit(draft)}
          />
        )}
      </div>
    </div>
  );
}
