import { useState } from 'react';
import {
  ExDropdown,
  ExMenu,
  ExMenuItem,
  ExDialog,
  ExButton,
  ExIconButton,
  ExTooltip,
  MenuItemVariant,
  DialogHeaderContent,
  ButtonType,
  ButtonFlavor,
  IconButtonType,
  IconButtonFlavor,
  TooltipPosition,
} from '@boomi/exosphere';
import { useChatState, useChatDispatch } from '../../chat/ChatContext';
import { useLayout } from '../../layout/LayoutContext';
import ChatBody from './ChatBody';

// The AI Assistant rendered as a right-side third column (the "Side" layout variant).
// Open/closed is driven by the editor-toolbar toggle + this header's close button, so there
// is no accordion/caret (and no first-run shimmer nudge — the panel is open by default).
// Horizontal resizing is handled by a stock ExResizeHandle in App.tsx, not a custom handle.
export default function ChatSidePanel() {
  const { messages } = useChatState();
  const chatDispatch = useChatDispatch();
  const { setSideOpen } = useLayout();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = () => {
    chatDispatch({ type: 'CLEAR_CONVERSATION' });
    setConfirmOpen(false);
  };

  return (
    <div className="chat-side-panel">
      <div className="chat-side-header">
        <span className="chat-side-title">AI Assistant</span>
        <span className="chat-side-header-actions">
          {messages.length > 0 && (
            <ExDropdown
              align="right"
              type={ButtonType.TERTIARY}
              flavor={ButtonFlavor.BASE}
              icon="three-dots-vertical-outline"
              label="Conversation options"
              tooltipText="Conversation options"
            >
              <ExMenu>
                <ExMenuItem
                  variant={MenuItemVariant.RISKY}
                  onItemSelect={() => setConfirmOpen(true)}
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete conversation
                </ExMenuItem>
              </ExMenu>
            </ExDropdown>
          )}
          <ExTooltip position={TooltipPosition.BOTTOM}>
            <ExIconButton
              slot="anchor"
              type={IconButtonType.TERTIARY}
              flavor={IconButtonFlavor.BASE}
              icon="cross"
              label="Close AI Assistant"
              onClick={() => setSideOpen(false)}
            />
            Close AI Assistant
          </ExTooltip>
        </span>
      </div>

      <ChatBody />

      {confirmOpen && (
        <ExDialog
          open
          dialogTitle="Delete conversation?"
          headerContent={DialogHeaderContent.WARNING}
          onCancel={() => setConfirmOpen(false)}
        >
          <p className="dialog-body-text">
            This permanently clears the current conversation. This can’t be undone.
          </p>
          <div slot="footer" className="dialog-footer-actions">
            <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={() => setConfirmOpen(false)}>
              Cancel
            </ExButton>
            <ExButton type={ButtonType.PRIMARY} flavor={ButtonFlavor.RISKY} onClick={handleDelete}>
              Delete conversation
            </ExButton>
          </div>
        </ExDialog>
      )}
    </div>
  );
}
