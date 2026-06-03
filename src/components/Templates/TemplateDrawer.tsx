import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import {
  ExButton, ExDialog, ExBadge, ExAccordion, ExAccordionItem, ExTile,
  ButtonType, ButtonFlavor, DialogHeaderContent,
  BadgeColor, BadgeShape, BadgeSize, AccordionVariant, TileVariant,
} from '@boomi/exosphere';
import { useConnectorDispatch } from '../../context/ConnectorContext';
import { templates } from '../../engine/templates';

const TAG_BADGE_COLORS: Record<string, BadgeColor> = {
  AUTH: BadgeColor.BLUE,
  PAGINATION: BadgeColor.YELLOW,
  'MULTI-REPORT': BadgeColor.GREEN,
};

function getTagBadgeColor(tag: string): BadgeColor {
  return TAG_BADGE_COLORS[tag] || BadgeColor.GRAY;
}

export default function TemplateDrawer() {
  const dispatch = useConnectorDispatch();
  const [confirmTemplateId, setConfirmTemplateId] = useState<string | null>(null);
  const accordionItemRef = useRef<ComponentRef<typeof ExAccordionItem>>(null);

  const handleConfirm = () => {
    if (!confirmTemplateId) return;
    const template = templates.find(t => t.id === confirmTemplateId);
    if (template) {
      dispatch({ type: 'RESET', payload: template.config });
    }
    setConfirmTemplateId(null);
    // toggle() (vs setting `open = false`) triggers animateHeight() so the
    // accordion content collapses; otherwise the host stays at its expanded height.
    // toggle is private on AccordionItem's TS type; cast through unknown to call it.
    const item = accordionItemRef.current as unknown as
      | { open?: boolean; toggle?: () => void }
      | null;
    if (item?.open) item.toggle?.();
  };

  const handleCancel = () => {
    setConfirmTemplateId(null);
  };

  return (
    <>
      <div className="template-drawer-host">
        <ExAccordion variant={AccordionVariant.ELEVATED}>
          <ExAccordionItem
            ref={accordionItemRef}
            label="Quick start: Select a template"
            leadingIcon="document"
            variant={AccordionVariant.ELEVATED}
          >
            <div className="template-grid">
              {templates.map(template => (
                <ExTile
                  key={template.id}
                  variant={TileVariant.BASE}
                  title={template.name}
                  label={`Use template: ${template.name}`}
                  onClick={() => setConfirmTemplateId(template.id)}
                >
                  <p className="template-tile-desc">{template.description}</p>
                  {template.tags && template.tags.length > 0 && (
                    <div slot="footer" className="template-tile-tags">
                      {template.tags.map(tag => (
                        <ExBadge
                          key={tag}
                          color={getTagBadgeColor(tag)}
                          shape={BadgeShape.ROUND}
                          size={BadgeSize.SMALL}
                        >
                          {tag}
                        </ExBadge>
                      ))}
                    </div>
                  )}
                </ExTile>
              ))}
            </div>
          </ExAccordionItem>
        </ExAccordion>
      </div>

      {confirmTemplateId && (
        <ExDialog
          open
          dialogTitle="Replace Configuration?"
          headerContent={DialogHeaderContent.WARNING}
          onCancel={handleCancel}
        >
          <p className="dialog-body-text">
            This will replace all your current configuration. Are you sure?
          </p>
          <div slot="footer" className="dialog-footer-actions">
            <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={handleCancel}>
              Cancel
            </ExButton>
            <ExButton type={ButtonType.PRIMARY} flavor={ButtonFlavor.BASE} onClick={handleConfirm}>
              Confirm
            </ExButton>
          </div>
        </ExDialog>
      )}
    </>
  );
}
