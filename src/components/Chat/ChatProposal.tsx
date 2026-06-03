import { useEffect, useRef, useState, useMemo } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import {
  ExButton,
  ExBadge,
  ExAlertBanner,
  ExIcon,
  ButtonType,
  ButtonFlavor,
  BadgeColor,
  BadgeShape,
  BadgeSize,
  AlertBannerType,
  AlertBannerVariant,
} from '@boomi/exosphere';
import { useConnectorDispatch } from '../../context/ConnectorContext';
import { useChatDispatch } from '../../chat/ChatContext';
import { applyYamlText } from '../../hooks/useYamlSync';
import { yamlToConfig } from '../../engine/yamlSync';

interface ChatProposalProps {
  messageId: string;
  yaml: string;
}

export default function ChatProposal({ messageId, yaml }: ChatProposalProps) {
  const connectorDispatch = useConnectorDispatch();
  const chatDispatch = useChatDispatch();
  const previewRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | undefined>(undefined);
  const [applied, setApplied] = useState(false);

  const validationError = useMemo(() => {
    try {
      yamlToConfig(yaml);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, [yaml]);

  const lineCount = useMemo(() => yaml.split('\n').length, [yaml]);

  useEffect(() => {
    if (!previewRef.current) return;
    const view = new EditorView({
      state: EditorState.create({
        doc: yaml,
        extensions: [
          basicSetup,
          yamlLang(),
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          EditorView.theme({
            '&': { fontSize: 'var(--exo-font-size-x-small)' },
            '.cm-content': { fontFamily: 'var(--exo-font-family-mono, monospace)' },
          }),
        ],
      }),
      parent: previewRef.current,
    });
    viewRef.current = view;
    return () => view.destroy();
  }, [yaml]);

  const handleApply = () => {
    applyYamlText(connectorDispatch, yaml);
    setApplied(true);
  };

  const handleDismiss = () => {
    chatDispatch({ type: 'CLEAR_PROPOSAL', payload: { id: messageId } });
  };

  return (
    <div className="chat-proposal-card">
      <div className="chat-proposal-header">
        <span className="chat-proposal-title">
          <ExIcon icon="document" />
          Proposed configuration
        </span>
        <ExBadge color={BadgeColor.GRAY} shape={BadgeShape.ROUND} size={BadgeSize.SMALL}>
          {lineCount} lines
        </ExBadge>
      </div>

      <div ref={previewRef} className="chat-proposal-preview" />

      {validationError && !applied && (
        <div className="chat-proposal-banner">
          <ExAlertBanner type={AlertBannerType.WARNING} variant={AlertBannerVariant.INLINE}>
            This YAML didn’t pass validation ({validationError}). You can still apply it and fix it in the editor.
          </ExAlertBanner>
        </div>
      )}

      {applied && (
        <div className="chat-proposal-banner">
          <ExAlertBanner type={AlertBannerType.SUCCESS} variant={AlertBannerVariant.INLINE}>
            Applied to the editor.
          </ExAlertBanner>
        </div>
      )}

      <div className="chat-proposal-actions">
        <ExButton type={ButtonType.TERTIARY} flavor={ButtonFlavor.BASE} onClick={handleDismiss}>
          Dismiss
        </ExButton>
        <ExButton
          type={ButtonType.PRIMARY}
          flavor={ButtonFlavor.BRANDED}
          disabled={applied}
          onClick={handleApply}
        >
          {applied ? 'Applied' : validationError ? 'Apply anyway' : 'Apply to editor'}
        </ExButton>
      </div>
    </div>
  );
}
