/**
 * ────────────────────────────────────────────────────────────
 * Note: this file contains a CUSTOM EXOSPHERE EXTENSION
 * for the vertical bottom-panel resize handle (`.yaml-bottom-handle`).
 * Exosphere's ExResizeHandle is horizontal-only. See EXOSPHERE-CUSTOM.md.
 * ────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef } from 'react';
import { ExTab, ExTabItem, ExResizeHandle, ResizerPosition } from '@boomi/exosphere';
import { ConnectorProvider } from './context/ConnectorContext';
import ConnectorForm from './components/ConnectorConfig/ConnectorForm';
import ParameterList from './components/Parameters/ParameterList';
import StepList from './components/Steps/StepList';
import YamlEditor from './components/Editor/YamlEditor';
import TestPanel from './components/Test/TestPanel';
import TemplateDrawer from './components/Templates/TemplateDrawer';

const YAML_SIDE_PANEL_ID = 'yaml-side-panel';
const SIDE_PANEL_MIN_WIDTH_PX = 240;
const SIDE_PANEL_MAX_WIDTH_PX = 1200;

const TABS = ['Connector Configuration', 'Interface Parameters', 'Workflow Steps'];

function TabBar({ activeTab, onSelect }: { activeTab: number; onSelect: (i: number) => void }) {
  return (
    <div className="tab-bar">
      <ExTab>
        {TABS.map((label, i) => (
          <ExTabItem
            key={i}
            selected={activeTab === i}
            onClick={() => onSelect(i)}
          >
            {label}
          </ExTabItem>
        ))}
      </ExTab>
    </div>
  );
}

function TabContent({ activeTab }: { activeTab: number }) {
  switch (activeTab) {
    case 0: return <ConnectorForm />;
    case 1: return <ParameterList />;
    case 2: return <StepList />;
    default: return <ConnectorForm />;
  }
}

function AppContent() {
  const [activeTab, setActiveTab] = useState(0);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isWide, setIsWide] = useState(true);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(() =>
    Math.round(window.innerHeight * 0.5),
  );
  const [isBottomPanelOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingBottom = useRef(false);

  useEffect(() => {
    document.documentElement.classList.remove('ex-theme-dark');
    document.documentElement.classList.add('ex-theme-light');
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsWide(entry.contentRect.width >= 900);
        const maxHeight = Math.floor(entry.contentRect.height * 0.85);
        setBottomPanelHeight(prev => Math.min(prev, Math.max(120, maxHeight)));
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleBottomDragStart = () => {
    isDraggingBottom.current = true;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingBottom.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const maxHeight = Math.floor(rect.height * 0.85);
      setBottomPanelHeight(Math.max(120, Math.min(rect.bottom - e.clientY, maxHeight)));
    };

    const onMouseUp = () => {
      isDraggingBottom.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const rightPanel = isTestMode
    ? <TestPanel onBackToEditor={() => setIsTestMode(false)} />
    : <YamlEditor onTestToggle={() => setIsTestMode(!isTestMode)} isTestMode={isTestMode} />;

  if (isWide) {
    return (
      <div className="app-shell" ref={containerRef}>
        <div className="app-body app-body--row">
          <div className="app-form-column">
            <TabBar activeTab={activeTab} onSelect={setActiveTab} />
            <div className="tab-content">
              <TabContent activeTab={activeTab} />
            </div>
            <TemplateDrawer />
          </div>
          <ExResizeHandle
            targetId={YAML_SIDE_PANEL_ID}
            position={ResizerPosition.LEFT}
            minWidth={SIDE_PANEL_MIN_WIDTH_PX}
            maxWidth={SIDE_PANEL_MAX_WIDTH_PX}
          />
          <div
            id={YAML_SIDE_PANEL_ID}
            className="yaml-side-panel"
            style={{ width: '50%', flex: 'none' }}
          >
            {rightPanel}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell" ref={containerRef}>
      <div className="app-body app-body--column">
        <div className="app-form-column">
          <TabBar activeTab={activeTab} onSelect={setActiveTab} />
          <div className="tab-content">
            <TabContent activeTab={activeTab} />
          </div>
          <TemplateDrawer />
        </div>
        {isBottomPanelOpen && (
          <div className="yaml-bottom-panel" style={{ height: bottomPanelHeight }}>
            {/* Custom vertical resize handle — Exosphere ships ExResizeHandle for horizontal only.
                Recorded in EXOSPHERE-CUSTOM.md. */}
            <div className="yaml-bottom-handle" onMouseDown={handleBottomDragStart}>
              <div className="yaml-bottom-handle-bar" />
            </div>
            {isTestMode
              ? <TestPanel onBackToEditor={() => setIsTestMode(false)} />
              : <YamlEditor onTestToggle={() => setIsTestMode(!isTestMode)} isTestMode={isTestMode} />
            }
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ConnectorProvider>
      <AppContent />
    </ConnectorProvider>
  );
}

export default App;
