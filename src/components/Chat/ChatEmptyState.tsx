import {
  ExEmptyState,
  ExPill,
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

export default function ChatEmptyState() {
  const { streamStatus } = useChatState();
  const { yamlText } = useConnector();
  const { sendMessage } = useChatStream();

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || streamStatus === 'streaming') return;
    void sendMessage(value, yamlText);
  };

  return (
    <div className="chat-empty-state">
      <ExEmptyState
        label="Build with AI"
        text="Describe a change in plain language — I'll update your connector YAML for you."
      >
        <div slot="action" className="chat-empty-chips">
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
      </ExEmptyState>
    </div>
  );
}
