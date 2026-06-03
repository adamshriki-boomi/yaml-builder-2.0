# Custom Exosphere extensions in YAML Builder

This file lists every UI element in this project that is NOT a stock `@boomi/exosphere` component. Each entry is reviewed against the Exosphere "suggest → ask → flag" flow before being added.

Revisit when Exosphere ships an official equivalent.

| Element | File | Reason |
|---|---|---|
| Vertical resize handle for the bottom YAML panel (narrow mode) | `src/App.tsx` (`yaml-bottom-handle`) | Exosphere's `ExResizeHandle` only supports horizontal resize (`minWidth` / `maxWidth` / `position: LEFT \| RIGHT`). No vertical equivalent ships in 7.8.1. |
| Vertical resize handle for the AI chat panel (drag top edge to grow) | `src/components/Chat/ChatPanel.tsx` + `src/global.css` (`chat-panel-handle`) | Same limitation as above — `ExResizeHandle` is horizontal-only, so the chat panel uses the same token-styled vertical drag handle pattern. |
| Chat conversation bubbles / proposal card scaffolding (`chat-*` classes) | `src/components/Chat/*` + `src/global.css` (`chat-bubble`, `chat-conversation`, `chat-proposal-card`, `chat-composer`) | Exosphere ships no chat/conversation component. The scaffold is token-styled layout built around stock primitives (`ExCard` patterns, `ExTextarea`, `ExButton`, `ExIconButton`, `ExLoader`, `ExAlertBanner`, `ExEmptyState`). |
| Compact nested sub-card (`.sub-card`) for transformation layers, metadata entries, report parameters, nested loop steps | `src/global.css` (`.sub-card`, `.sub-card--dashed`, `.sub-card-header`, `.sub-card-label`) | `ExCard`'s default body padding is `var(--exo-spacing-standard) var(--exo-spacing-medium)` (16×20px). At 3-4 levels of nesting (e.g. ExCard step → CollapsibleSection → Variable Output → Transformation Layer) the padding overhead becomes excessive. Token-styled custom container with smaller padding. |

All custom elements must:
- Use `--exo-*` tokens for color / spacing / radius / typography only — no raw hex / px / rgb.
- Consume Exosphere primitives where possible (`ExIcon`, `ExBadge`, `ExLabel`, etc.).
