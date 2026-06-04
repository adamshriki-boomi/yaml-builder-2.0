/**
 * ────────────────────────────────────────────────────────────
 * Note: the top edge of this panel uses a CUSTOM EXOSPHERE EXTENSION
 * for vertical resizing (`.chat-panel-handle`). Exosphere's ExResizeHandle
 * is horizontal-only. See EXOSPHERE-CUSTOM.md.
 * ────────────────────────────────────────────────────────────
 */
import { useRef, useState, type KeyboardEvent } from 'react';
import {
  ExIcon,
  ExDropdown,
  ExMenu,
  ExMenuItem,
  ExDialog,
  ExButton,
  IconSize,
  MenuItemVariant,
  DialogHeaderContent,
  ButtonType,
  ButtonFlavor,
} from '@boomi/exosphere';
import { useChatState, useChatDispatch } from '../../chat/ChatContext';
import ChatConversation from './ChatConversation';
import ChatComposer from './ChatComposer';

const MIN_HEIGHT_PX = 160;

export default function ChatPanel() {
  const hostRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [panelHeight, setPanelHeight] = useState(() => Math.round(window.innerHeight * 0.34));
  const [collapsed, setCollapsed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { messages } = useChatState();
  const chatDispatch = useChatDispatch();

  const toggleCollapsed = () => setCollapsed((c) => !c);

  const handleHeaderKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleCollapsed();
    }
  };

  // Drag the top edge upward to grow the panel. Mirrors App.tsx's handleBottomDragStart,
  // but the ceiling is computed against the parent form column so the form area stays usable.
  const handleDragStart = () => {
    isDragging.current = true;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    const parent = hostRef.current?.parentElement;
    const panelBottom = hostRef.current?.getBoundingClientRect().bottom ?? 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const parentRect = parent?.getBoundingClientRect();
      const maxHeight = parentRect ? Math.floor(parentRect.height * 0.85) : window.innerHeight;
      setPanelHeight(Math.max(MIN_HEIGHT_PX, Math.min(panelBottom - e.clientY, maxHeight)));
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleDelete = () => {
    chatDispatch({ type: 'CLEAR_CONVERSATION' });
    setConfirmOpen(false);
  };

  return (
    <div
      className={`chat-panel-host${collapsed ? ' chat-panel-host--collapsed' : ''}`}
      ref={hostRef}
      style={collapsed ? undefined : { height: panelHeight }}
    >
      {!collapsed && (
        <div className="chat-panel-handle" onMouseDown={handleDragStart}>
          <div className="chat-panel-handle-bar" />
        </div>
      )}

      {/* The whole header toggles collapse (like an accordion). */}
      <div
        className="chat-panel-header"
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onClick={toggleCollapsed}
        onKeyDown={handleHeaderKeyDown}
      >
        <div className="chat-panel-header-left">
          <ExIcon icon={collapsed ? 'direction-caret-up' : 'direction-caret-down'} size={IconSize.XS} />
          <span className="chat-panel-title">AI Assistant</span>
        </div>
        {messages.length > 0 && (
          <span
            className="chat-panel-actions"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
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
          </span>
        )}
      </div>

      {!collapsed && (
        <div className="chat-panel-body">
          <ChatConversation />
          <ChatComposer />
        </div>
      )}

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
