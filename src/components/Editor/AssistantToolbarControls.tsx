import {
  ExSegmentedControls,
  ExSegmentedControl,
  ExIconButton,
  ExTooltip,
  SegmentVariant,
  IconButtonType,
  IconButtonFlavor,
  TooltipPosition,
} from '@boomi/exosphere';
import { useLayout } from '../../layout/LayoutContext';

// Right-aligned editor-toolbar controls: the Bottom/Side variant switch + (Side only) the
// "Open AI Assistant" toggle. Rendered in both the YAML editor and Test panel toolbars so the
// switch stays reachable; only one is ever mounted at a time (rightPanel swaps them).
//
// ExSegmentedControls is effectively uncontrolled — it wires its segments once in
// firstUpdated() and toggles `selected` imperatively thereafter, so React's `selected={...}`
// only sets the INITIAL paint. We key it on `placement` so any external change (rehydrate,
// the other toolbar) forces a fresh mount that re-syncs the highlight, and treat the event as
// the source of truth. At runtime the event detail carries `selectedIndex`; the React wrapper
// mistypes it as `index`, so we read both defensively (matches the `(e: any)` convention used
// by ChatComposer's onSend).
export default function AssistantToolbarControls() {
  const { placement, sideOpen, isWide, setPlacement, toggleSideOpen } = useLayout();

  const handleSelectionChange = (e: any) => {
    const idx = e?.detail?.selectedIndex ?? e?.detail?.index;
    if (idx === 0) setPlacement('bottom');
    else if (idx === 1) setPlacement('side');
  };

  return (
    <div className="editor-toolbar-group editor-toolbar-group--end">
      <ExSegmentedControls key={placement} variant={SegmentVariant.GRAY} onSelectionChange={handleSelectionChange}>
        <ExSegmentedControl label="Bottom" selected={placement === 'bottom'} disabled={!isWide} />
        <ExSegmentedControl label="Side" selected={placement === 'side'} disabled={!isWide} />
      </ExSegmentedControls>

      {placement === 'side' && isWide && (
        <ExTooltip position={TooltipPosition.BOTTOM}>
          <ExIconButton
            slot="anchor"
            type={IconButtonType.TERTIARY}
            flavor={IconButtonFlavor.BRANDED}
            on={sideOpen}
            icon="Chatcircletext"
            label={sideOpen ? 'Hide AI Assistant' : 'Open AI Assistant'}
            onClick={toggleSideOpen}
          />
          {sideOpen ? 'Hide AI Assistant' : 'Open AI Assistant'}
        </ExTooltip>
      )}
    </div>
  );
}
