import { ExAccordion, ExAccordionItem, AccordionVariant } from '@boomi/exosphere';

interface Props {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({ label, defaultOpen = true, children }: Props) {
  return (
    <ExAccordion variant={AccordionVariant.FLAT} allowMultiple>
      <ExAccordionItem label={label} open={defaultOpen} variant={AccordionVariant.FLAT}>
        {children}
      </ExAccordionItem>
    </ExAccordion>
  );
}
