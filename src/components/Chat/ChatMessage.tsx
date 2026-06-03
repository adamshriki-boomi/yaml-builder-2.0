import type { ChatMessage as ChatMessageType } from '../../chat/chatTypes';
import ProseRenderer from './ProseRenderer';
import ChatProposal from './ChatProposal';

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  if (message.role === 'user') {
    return (
      <div className="chat-message chat-message--user">
        <div className="chat-bubble chat-bubble--user">{message.content}</div>
      </div>
    );
  }

  // While streaming, the assistant message starts empty — don't render an empty bubble
  // (the conversation shows a separate "Thinking…" indicator until the first token arrives).
  if (!message.content.trim() && !message.proposedYaml) {
    return null;
  }

  return (
    <div className="chat-message chat-message--assistant">
      <div className="chat-bubble chat-bubble--assistant">
        <ProseRenderer content={message.content} />
        {message.proposedYaml && <ChatProposal messageId={message.id} yaml={message.proposedYaml} />}
      </div>
    </div>
  );
}
