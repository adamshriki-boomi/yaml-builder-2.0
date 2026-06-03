import { type ReactNode, Fragment } from 'react';

// Tiny markdown renderer for assistant prose. Intentionally minimal (no dependency):
// supports **bold**, *italic*, `code`, "- " bullet lists, and paragraphs. Fenced code blocks
// are stripped here because any proposed YAML is surfaced separately in the ChatProposal card.

function stripCodeFences(text: string): string {
  // Remove complete fenced blocks…
  let out = text.replace(/```[\s\S]*?```/g, '').trim();
  // …and if a block is still open mid-stream, drop everything from the opening fence onward.
  const open = out.indexOf('```');
  if (open !== -1) out = out.slice(0, open).trim();
  return out;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
    if (m[2] !== undefined) nodes.push(<strong key={key++}>{m[2]}</strong>);
    else if (m[3] !== undefined) nodes.push(<em key={key++}>{m[3]}</em>);
    else if (m[4] !== undefined) nodes.push(<code key={key++}>{m[4]}</code>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export default function ProseRenderer({ content }: { content: string }) {
  const prose = stripCodeFences(content);
  if (!prose) return null;

  const lines = prose.split('\n');
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={key++} className="prose-list">
        {bullets.map((b, i) => (
          <li key={i}>{renderInline(b)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      bullets.push(bullet[1]);
      continue;
    }
    flushBullets();
    if (line.trim() === '') continue;
    blocks.push(
      <p key={key++} className="prose-paragraph">
        {renderInline(line)}
      </p>,
    );
  }
  flushBullets();

  return <Fragment>{blocks}</Fragment>;
}
