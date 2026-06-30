import { useState } from 'react';
import {
  ExButton,
  ExIconButton,
  ExEmptyState,
  ExTooltip,
  ButtonType,
  ButtonFlavor,
  IconButtonType,
  IconButtonFlavor,
  TooltipPosition,
} from '@boomi/exosphere';
import InterfaceParametersForm from './InterfaceParametersForm';
import TestRunningState from './TestRunningState';
import TestResults from './TestResults';
import AssistantToolbarControls from '../Editor/AssistantToolbarControls';
import { useConnector, useConnectorDispatch } from '../../context/ConnectorContext';
import { useChatStream } from '../../chat/useChatStream';
import { useChatState } from '../../chat/ChatContext';
import { useLayout } from '../../layout/LayoutContext';
import { applyYamlText } from '../../hooks/useYamlSync';
import { configToYaml } from '../../engine/yamlSync';
import { generateDemoResults } from '../../data/demoTestResults';
import { plantParamFault, buildFixWithAiMessage, buildFixAllMessage } from '../../demo/errorScenario';
import type { ReportTestResult, TestRunResult } from '../../types/connector';

interface Props {
  onBackToEditor: () => void;
}

type Phase = 'empty' | 'form' | 'running' | 'results';

const RUN_DELAY_MS = 2000;

export default function TestPanel({ onBackToEditor }: Props) {
  const { config, yamlText } = useConnector();
  const connectorDispatch = useConnectorDispatch();
  const { sendMessage } = useChatStream();
  const { streamStatus } = useChatState();
  const { revealAssistant } = useLayout();
  const [phase, setPhase] = useState<Phase>('empty');
  const [result, setResult] = useState<TestRunResult | null>(null);

  const startTest = () => {
    setPhase('form');
  };

  const runTest = () => {
    setPhase('running');
    setTimeout(() => {
      setResult(generateDemoResults(config));
      setPhase('results');
    }, RUN_DELAY_MS);
  };

  // Demo entry: plant the missing-required-parameter fault into the current blueprint, then drop
  // into the parameters form so the next run shows the failure.
  const loadFailingExample = () => {
    applyYamlText(connectorDispatch, configToYaml(plantParamFault(config)));
    setPhase('form');
  };

  // Hand the failure to the real assistant: reveal the panel, then send the error + current YAML.
  const isStreaming = streamStatus === 'streaming';
  const handleFixWithAI = (report: ReportTestResult) => {
    if (isStreaming) return;
    revealAssistant();
    void sendMessage(buildFixWithAiMessage(report), yamlText);
  };

  // Callout-level action: hand every failed report to the assistant in one go.
  const handleFixAll = (reports: ReportTestResult[]) => {
    if (isStreaming || reports.length === 0) return;
    revealAssistant();
    void sendMessage(buildFixAllMessage(reports), yamlText);
  };

  const [formInstance, setFormInstance] = useState(0);
  const reloadParameters = () => {
    // Re-mount the form: re-reads config.interface_parameters and resets entered values
    setFormInstance(n => n + 1);
  };

  const isContentPhase = phase !== 'empty';

  return (
    <div className="test-panel">
      <div className="editor-toolbar">
        <ExTooltip position={TooltipPosition.BOTTOM}>
          <ExIconButton
            slot="anchor"
            type={IconButtonType.TERTIARY}
            flavor={IconButtonFlavor.BASE}
            icon="direction-arrow-left"
            label="Back to YAML Editor"
            onClick={onBackToEditor}
          />
          Back to YAML Editor
        </ExTooltip>
        <span className="test-panel-title">Test Blueprint</span>
        <AssistantToolbarControls />
      </div>
      <div className={isContentPhase ? 'test-panel-body test-panel-body--content' : 'test-panel-body'}>
        {phase === 'empty' && (
          <div className="empty-state-wrap">
            <ExEmptyState
              label="Test your Blueprint configuration"
              text="Run a validation test to check your YAML configuration before deploying."
            >
              <div slot="action" className="empty-state-actions">
                <ExButton
                  type={ButtonType.SECONDARY}
                  flavor={ButtonFlavor.BASE}
                  onClick={startTest}
                >
                  Test Blueprint
                </ExButton>
                <ExButton
                  type={ButtonType.TERTIARY}
                  flavor={ButtonFlavor.BASE}
                  onClick={loadFailingExample}
                >
                  Load a failing example (demo)
                </ExButton>
              </div>
            </ExEmptyState>
          </div>
        )}
        {phase === 'form' && (
          <InterfaceParametersForm
            key={formInstance}
            onRun={runTest}
            onReloadParameters={reloadParameters}
          />
        )}
        {phase === 'running' && <TestRunningState />}
        {phase === 'results' && result && (
          <TestResults
            result={result}
            onReRun={runTest}
            onFixWithAI={handleFixWithAI}
            onFixAll={handleFixAll}
            fixDisabled={isStreaming}
          />
        )}
      </div>
    </div>
  );
}
