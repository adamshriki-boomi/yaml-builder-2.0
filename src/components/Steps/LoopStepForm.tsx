import { ExInput, ExSelect, ExToggle, ExLabel, ExButton, ExMenuItem, ButtonType, ButtonFlavor } from '@boomi/exosphere';
import type { LoopStep, RestStep } from '../../types/connector';
import { createRestStep } from '../../types/connector';
import RestStepForm from './RestStepForm';

interface Props {
  step: LoopStep;
  onChange: (updates: Partial<LoopStep>) => void;
}

export default function LoopStepForm({ step, onChange }: Props) {
  const updateNestedStep = (stepId: string, updates: Partial<RestStep>) => {
    const updatedNested = step.nested_steps.map(ns =>
      ns.id === stepId ? { ...ns, ...updates } : ns
    );
    onChange({ nested_steps: updatedNested as RestStep[] });
  };

  const addNestedStep = () => {
    onChange({ nested_steps: [...step.nested_steps, createRestStep()] });
  };

  const removeNestedStep = (id: string) => {
    onChange({ nested_steps: step.nested_steps.filter(ns => ns.id !== id) });
  };

  return (
    <div>
      <div className="form-row">
        <ExInput
          label="Loop Name"
          value={step.name}
          placeholder="e.g., Process Users"
          onInput={(e: any) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="form-field">
        <ExInput
          label="Description"
          value={step.description}
          placeholder="Explain what this loop does"
          onInput={(e: any) => onChange({ description: e.target.value })}
        />
      </div>
      <div className="form-row">
        <ExSelect
          label="Loop Type"
          selected={step.loop_type}
          valueBasedSelection
          onChange={(e: any) => {
            const val = e.detail?.value;
            if (val) onChange({ loop_type: val });
          }}
        >
          <ExMenuItem value="data">Data</ExMenuItem>
          <ExMenuItem value="external_variables">External Variables</ExMenuItem>
        </ExSelect>
        <ExInput
          label="Items Path"
          value={step.items_path}
          placeholder="e.g., $"
          onInput={(e: any) => onChange({ items_path: e.target.value })}
        />
      </div>
      <div className="form-field">
        <ExInput
          label="Item Name"
          value={step.item_name}
          placeholder="Name for each item in the loop"
          onInput={(e: any) => onChange({ item_name: e.target.value })}
        />
      </div>
      <div className="toggle-row-group">
        <div className="toggle-row toggle-row--inline">
          <ExToggle
            on={step.include_in_output}
            onChange={() => onChange({ include_in_output: !step.include_in_output })}
          />
          <ExLabel>Include in output</ExLabel>
        </div>
        <div className="toggle-row toggle-row--inline">
          <ExToggle
            on={step.ignore_errors}
            onChange={() => onChange({ ignore_errors: !step.ignore_errors })}
          />
          <ExLabel>Ignore errors</ExLabel>
        </div>
      </div>

      {/* Nested REST Steps */}
      <div className="form-section">
        <div className="form-section-title form-section-title--inline">
          Nested REST Steps
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={addNestedStep}>Add Nested Step</ExButton>
        </div>
        {step.nested_steps.map((nestedStep, idx) => (
          <div key={nestedStep.id} className="sub-card sub-card--lg">
            <div className="sub-card-header">
              <span className="sub-card-label sub-card-label--strong">Nested Step {idx + 1}</span>
              {step.nested_steps.length > 1 && (
                <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.RISKY} onClick={() => removeNestedStep(nestedStep.id)}>
                  Remove
                </ExButton>
              )}
            </div>
            <RestStepForm
              step={nestedStep}
              onChange={(updates) => updateNestedStep(nestedStep.id, updates as Partial<RestStep>)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
