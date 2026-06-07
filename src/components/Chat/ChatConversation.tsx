import { useEffect, useRef } from 'react';
import {
  ExLoader,
  ExAlertBanner,
  LoaderVariant,
  SpinnerSize,
  AlertBannerType,
  AlertBannerVariant,
} from '@boomi/exosphere';
import { useChatState } from '../../chat/ChatContext';
import ChatMessage from './ChatMessage';
import ChatEmptyState from './ChatEmptyState';

export default function ChatConversation() {
  const { messages, streamStatus, errorText } = useChatState();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest content in view as messages arrive / stream.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamStatus]);

  const isEmpty = messages.length === 0 && streamStatus !== 'streaming' && !errorText;

  return (
    <div className={`chat-conversation${isEmpty ? ' chat-conversation--empty' : ''}`} ref={scrollRef}>
      {isEmpty && <ChatEmptyState />}
      {messages.map((m) => (
        <ChatMessage key={m.id} message={m} />
      ))}
      {streamStatus === 'streaming' && (
        <div className="chat-streaming-indicator">
          <ExLoader
            variant={LoaderVariant.SPINNER}
            inline
            spinnerSize={SpinnerSize.SMALL}
            label="Thinking…"
          />
        </div>
      )}
      {errorText && (
        <div className="chat-error-banner">
          <ExAlertBanner type={AlertBannerType.ERROR} variant={AlertBannerVariant.INLINE}>
            {errorText}
          </ExAlertBanner>
        </div>
      )}
    </div>
  );
}
