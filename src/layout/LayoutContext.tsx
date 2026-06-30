import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

// Owns the AI-Assistant layout variant + its persisted prefs. Mirrors the persistence
// pattern in src/chat/ChatContext.tsx (single STORAGE_KEY, try/catch load, useEffect save).
// `isWide` is derived at runtime from a ResizeObserver in App.tsx and is NOT persisted.

export type Placement = 'bottom' | 'side';

// Bumped to -v2 to drop the previous defaults (Side + AI-open + fixed 420/380 widths) so the
// even-split defaults below take effect on next load.
const STORAGE_KEY = 'yaml-builder-layout-prefs-v2';

interface PersistedPrefs {
  placement: Placement;
  sideOpen: boolean;
  // px width once the user has dragged a column; null = use the even default
  // (50% form when the AI panel is closed, ~1/3 each when it's open). See App.tsx.
  formWidth: number | null;
  aiWidth: number | null;
}

// Defaults: the new Side variant, AI column CLOSED (form/editor 50/50); opening it splits the
// three columns evenly. Widths start null so the even split applies until the user drags.
const DEFAULTS: PersistedPrefs = {
  placement: 'side',
  sideOpen: false,
  formWidth: null,
  aiWidth: null,
};

const asWidth = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

function loadPrefs(): PersistedPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULTS;
    return {
      placement: parsed.placement === 'bottom' ? 'bottom' : 'side',
      sideOpen: typeof parsed.sideOpen === 'boolean' ? parsed.sideOpen : DEFAULTS.sideOpen,
      formWidth: asWidth(parsed.formWidth),
      aiWidth: asWidth(parsed.aiWidth),
    };
  } catch {
    return DEFAULTS;
  }
}

interface LayoutContextValue extends PersistedPrefs {
  isWide: boolean;
  setIsWide: (v: boolean) => void;
  setPlacement: (p: Placement) => void;
  setSideOpen: (v: boolean) => void;
  toggleSideOpen: () => void;
  setFormWidth: (w: number) => void;
  setAiWidth: (w: number) => void;
  // Imperatively bring the AI Assistant into view from anywhere (e.g. the "Fix with AI" button).
  // In wide layouts it opens the side column; the bumping nonce lets the bottom/narrow ChatPanel
  // (which owns its own collapsed state) expand in response.
  revealNonce: number;
  revealAssistant: () => void;
  // Imperatively return the middle panel to the YAML editor (exit Test mode). Used after the AI's
  // "Apply to editor" so the now-stale test results give way to the freshly-updated YAML. The
  // nonce lets AppContent (which owns isTestMode) react without prop-drilling.
  showEditorNonce: number;
  showEditor: () => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<PersistedPrefs>(loadPrefs);
  const [isWide, setIsWide] = useState(true);
  const [revealNonce, setRevealNonce] = useState(0);
  const [showEditorNonce, setShowEditorNonce] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // best-effort; ignore quota / serialization errors
    }
  }, [prefs]);

  const setPlacement = useCallback((placement: Placement) => setPrefs((p) => ({ ...p, placement })), []);
  const setSideOpen = useCallback((sideOpen: boolean) => setPrefs((p) => ({ ...p, sideOpen })), []);
  const toggleSideOpen = useCallback(() => setPrefs((p) => ({ ...p, sideOpen: !p.sideOpen })), []);
  const setFormWidth = useCallback((formWidth: number) => setPrefs((p) => ({ ...p, formWidth })), []);
  const setAiWidth = useCallback((aiWidth: number) => setPrefs((p) => ({ ...p, aiWidth })), []);

  const revealAssistant = useCallback(() => {
    if (isWide) setPrefs((p) => ({ ...p, placement: 'side', sideOpen: true }));
    setRevealNonce((n) => n + 1);
  }, [isWide]);

  const showEditor = useCallback(() => setShowEditorNonce((n) => n + 1), []);

  const value = useMemo<LayoutContextValue>(
    () => ({
      ...prefs,
      isWide,
      setIsWide,
      setPlacement,
      setSideOpen,
      toggleSideOpen,
      setFormWidth,
      setAiWidth,
      revealNonce,
      revealAssistant,
      showEditorNonce,
      showEditor,
    }),
    [prefs, isWide, setPlacement, setSideOpen, toggleSideOpen, setFormWidth, setAiWidth, revealNonce, revealAssistant, showEditorNonce, showEditor],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used within a LayoutProvider');
  return ctx;
}
