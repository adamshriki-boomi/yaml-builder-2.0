import {
  ExRichInput,
  ExButton,
  ExPill,
  RichInputType,
  ButtonType,
  ButtonFlavor,
  PillColor,
  PillSize,
} from '@boomi/exosphere';
import { useChatState } from '../../chat/ChatContext';
import { useChatStream } from '../../chat/useChatStream';
import { useConnector } from '../../context/ConnectorContext';

// Pills carry a short label (Exosphere pills truncate long text) and send the full prompt on click.
const QUICK_PROMPTS = [
  { label: 'Basic REST connector', prompt: 'Create a basic REST connector with bearer auth' },
  { label: 'Add cursor pagination', prompt: 'Add cursor pagination to my first report' },
  { label: 'OAuth 2.0 auth flow', prompt: 'Add an OAuth 2.0 client credentials auth flow' },
  { label: 'Explain my config', prompt: 'Explain and validate my current configuration' },
];

export default function ChatComposer() {
  const { messages, streamStatus } = useChatState();
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
      {isStreaming ? (
        <div className="chat-composer-status">
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={cancelStream}>
            Stop generating
          </ExButton>
        </div>
      ) : (
        messages.length === 0 && (
          <div className="chat-chips">
            {QUICK_PROMPTS.map(({ label, prompt }) => (
              <ExPill
                key={label}
                color={PillColor.GRAY}
                size={PillSize.REGULAR}
                interactive
                onClick={() => submit(prompt)}
              >
                {label}
              </ExPill>
            ))}
          </div>
        )
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
