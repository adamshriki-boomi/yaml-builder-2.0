import {
  ExRichInput,
  ExButton,
  RichInputType,
  ButtonType,
  ButtonFlavor,
} from '@boomi/exosphere';
import { useChatState } from '../../chat/ChatContext';
import { useChatStream } from '../../chat/useChatStream';
import { useConnector } from '../../context/ConnectorContext';

export default function ChatComposer() {
  const { streamStatus } = useChatState();
  const { yamlText } = useConnector();
  const { sendMessage, cancelStream } = useChatStream();
  const isStreaming = streamStatus === 'streaming';

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || isStreaming) return;
    void sendMessage(value, yamlText);
  };

  return (
    <div className="chat-composer">
      {isStreaming && (
        <div className="chat-composer-status">
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={cancelStream}>
            Stop generating
          </ExButton>
        </div>
      )}
      {/* ExRichInput is a textarea with a built-in send button. onSend fires on the send button
          or Enter (Shift+Enter = newline); clearOnSend empties it after, so it's uncontrolled. */}
      <ExRichInput
        type={RichInputType.BRAND}
        placeholder="Describe your connector or ask for a change…"
        clearOnSend
        allowShiftEnter
        disabled={isStreaming}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSend={(e: any) => submit(e.detail?.value ?? '')}
      />
      <p className="chat-composer-hint">Enter to send · Shift+Enter for a new line</p>
    </div>
  );
}
