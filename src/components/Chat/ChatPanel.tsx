/**
 * ────────────────────────────────────────────────────────────
 * Note: the top edge of this panel uses a CUSTOM EXOSPHERE EXTENSION
 * for vertical resizing (`.chat-panel-handle`). Exosphere's ExResizeHandle
 * is horizontal-only. See EXOSPHERE-CUSTOM.md.
 * ────────────────────────────────────────────────────────────
 */
import { useRef, useState } from 'react';
import {
  ExIconButton,
  ExTooltip,
  IconButtonType,
  IconButtonFlavor,
  TooltipPosition,
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
  const { messages } = useChatState();
  const chatDispatch = useChatDispatch();

  const toggleCollapsed = () => setCollapsed((c) => !c);

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
      <div className="chat-panel-header">
        <div className="chat-panel-header-left">
          <ExIconButton
            type={IconButtonType.TERTIARY}
            flavor={IconButtonFlavor.BASE}
            icon={collapsed ? 'direction-caret-up' : 'direction-caret-down'}
            label={collapsed ? 'Expand assistant' : 'Collapse assistant'}
            onClick={toggleCollapsed}
          />
          <span className="chat-panel-title" onClick={toggleCollapsed}>
            AI Assistant
          </span>
        </div>
        {!collapsed && messages.length > 0 && (
          <ExTooltip position={TooltipPosition.BOTTOM}>
            <ExIconButton
              slot="anchor"
              type={IconButtonType.TERTIARY}
              flavor={IconButtonFlavor.BASE}
              icon="delete"
              label="Clear conversation"
              onClick={() => chatDispatch({ type: 'CLEAR_CONVERSATION' })}
            />
            Clear conversation
          </ExTooltip>
        )}
      </div>
      {!collapsed && (
        <div className="chat-panel-body">
          <ChatConversation />
          <ChatComposer />
        </div>
      )}
    </div>
  );
}
