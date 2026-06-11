import ChatConversation from './ChatConversation';
import ChatComposer from './ChatComposer';

// The position-agnostic chat body (message list + composer), shared by the bottom-drawer
// ChatPanel and the right-side ChatSidePanel. Both read the same ChatContext, so the
// conversation is identical across layout variants. Keeps the `.chat-panel-body` class so
// existing styling applies unchanged.
export default function ChatBody() {
  return (
    <div className="chat-panel-body">
      <ChatConversation />
      <ChatComposer />
    </div>
  );
}
