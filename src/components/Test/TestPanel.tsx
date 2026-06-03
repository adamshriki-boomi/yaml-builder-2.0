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
import { useConnector } from '../../context/ConnectorContext';
import { generateDemoResults } from '../../data/demoTestResults';
import type { TestRunResult } from '../../types/connector';

interface Props {
  onBackToEditor: () => void;
}

type Phase = 'empty' | 'form' | 'running' | 'results';

const RUN_DELAY_MS = 2000;

export default function TestPanel({ onBackToEditor }: Props) {
  const { config } = useConnector();
  const [phase, setPhase] = useState<Phase>('empty');
  const [result, setResult] = useState<TestRunResult | null>(null);

  const startTest = () => {
    setPhase('form');
  };

  const runTest = () => {
    setPhase('running');
    setTimeout(() => {
      setResult(generateDemoResults(config.multi_reports));
      setPhase('results');
    }, RUN_DELAY_MS);
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
      </div>
      <div className={isContentPhase ? 'test-panel-body test-panel-body--content' : 'test-panel-body'}>
        {phase === 'empty' && (
          <div className="empty-state-wrap">
            <ExEmptyState
              label="Test your Blueprint configuration"
              text="Run a validation test to check your YAML configuration before deploying."
            >
              <ExButton
                slot="action"
                type={ButtonType.SECONDARY}
                flavor={ButtonFlavor.BASE}
                onClick={startTest}
              >
                Test Blueprint
              </ExButton>
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
          <TestResults result={result} onReRun={runTest} />
        )}
      </div>
    </div>
  );
}
