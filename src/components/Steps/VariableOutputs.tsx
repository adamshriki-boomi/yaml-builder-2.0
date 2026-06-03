import { ExInput, ExSelect, ExButton, ExIconButton, ExMenuItem, ButtonType, ButtonFlavor, IconButtonType, IconButtonFlavor } from '@boomi/exosphere';
import type { RestStep, VariableOutput, TransformationLayer } from '../../types/connector';
import { createTransformationLayer } from '../../types/connector';
import CollapsibleSection from '../Layout/CollapsibleSection';

interface Props {
  step: RestStep;
  onChange: (updates: Partial<RestStep>) => void;
}

export default function VariableOutputs({ step, onChange }: Props) {
  const addOutput = () => {
    const newOutput: VariableOutput = {
      id: crypto.randomUUID(),
      variable_name: '',
      response_location: 'data',
      variable_format: 'json',
      transformation_layers: [],
    };
    onChange({ variables_output: [...step.variables_output, newOutput] });
  };

  const updateOutput = (id: string, field: keyof VariableOutput, value: any) => {
    const updated = step.variables_output.map(o =>
      o.id === id ? { ...o, [field]: value } : o
    );
    onChange({ variables_output: updated });
  };

  const removeOutput = (id: string) => {
    onChange({ variables_output: step.variables_output.filter(o => o.id !== id) });
  };

  // Transformation layers
  const addTransformationLayer = (outputId: string) => {
    const updated = step.variables_output.map(o => {
      if (o.id !== outputId) return o;
      return {
        ...o,
        transformation_layers: [...o.transformation_layers, createTransformationLayer()],
      };
    });
    onChange({ variables_output: updated });
  };

  const updateTransformationLayer = (outputId: string, layerId: string, field: keyof TransformationLayer, value: any) => {
    const updated = step.variables_output.map(o => {
      if (o.id !== outputId) return o;
      return {
        ...o,
        transformation_layers: o.transformation_layers.map(t =>
          t.id === layerId ? { ...t, [field]: value } : t
        ),
      };
    });
    onChange({ variables_output: updated });
  };

  const removeTransformationLayer = (outputId: string, layerId: string) => {
    const updated = step.variables_output.map(o => {
      if (o.id !== outputId) return o;
      return {
        ...o,
        transformation_layers: o.transformation_layers.filter(t => t.id !== layerId),
      };
    });
    onChange({ variables_output: updated });
  };

  return (
    <div className="form-section">
      <div className="form-section-title form-section-title--inline">
        Variable Outputs
        <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={addOutput}>Add</ExButton>
      </div>

      {step.variables_output.map(output => (
        <div key={output.id} className="sub-card">
          <div className="sub-card-header sub-card-header--end">
            <ExIconButton type={IconButtonType.SECONDARY} flavor={IconButtonFlavor.RISKY} icon="delete" label="Delete output" onClick={() => removeOutput(output.id)} />
          </div>
          <div className="form-row">
            <ExInput
              label="Variable Name"
              value={output.variable_name}
              placeholder="e.g., user_data"
              onInput={(e: any) => updateOutput(output.id, 'variable_name', e.target.value)}
            />
            <ExSelect
              label="Response Location"
              selected={output.response_location}
              valueBasedSelection
              onChange={(e: any) => {
                const val = e.detail?.value;
                if (val) updateOutput(output.id, 'response_location', val);
              }}
            >
              <ExMenuItem value="data">Data</ExMenuItem>
              <ExMenuItem value="headers">Headers</ExMenuItem>
              <ExMenuItem value="status">Status</ExMenuItem>
            </ExSelect>
          </div>
          <div className="form-row">
            <ExSelect
              label="Variable Format"
              selected={output.variable_format || 'json'}
              valueBasedSelection
              onChange={(e: any) => {
                const val = e.detail?.value;
                if (val) updateOutput(output.id, 'variable_format', val);
              }}
            >
              <ExMenuItem value="json">JSON</ExMenuItem>
              <ExMenuItem value="text">Text</ExMenuItem>
            </ExSelect>
          </div>

          {/* Transformation Layers */}
          <CollapsibleSection label={`Transformation Layers (${output.transformation_layers.length})`} defaultOpen={false}>
            {output.transformation_layers.map((layer, layerIdx) => (
              <div key={layer.id} className="sub-card sub-card--dashed">
                <div className="sub-card-header">
                  <span className="sub-card-label">Layer {layerIdx + 1}</span>
                  <ExIconButton
                    type={IconButtonType.SECONDARY}
                    flavor={IconButtonFlavor.RISKY}
                    icon="delete"
                    label="Delete layer"
                    onClick={() => removeTransformationLayer(output.id, layer.id)}
                  />
                </div>
                <div className="form-row">
                  <ExSelect
                    label="Type"
                    selected={layer.type}
                    valueBasedSelection
                    onChange={(e: any) => {
                      const val = e.detail?.value;
                      if (val) updateTransformationLayer(output.id, layer.id, 'type', val);
                    }}
                  >
                    <ExMenuItem value="extract_json">Extract JSON</ExMenuItem>
                    <ExMenuItem value="flatten">Flatten</ExMenuItem>
                    <ExMenuItem value="filter">Filter</ExMenuItem>
                    <ExMenuItem value="map">Map</ExMenuItem>
                  </ExSelect>
                  <ExInput
                    label="JSON Path"
                    value={layer.json_path || ''}
                    placeholder="e.g., $.data[*]"
                    onInput={(e: any) => updateTransformationLayer(output.id, layer.id, 'json_path', e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <ExInput
                    label="From Type"
                    value={layer.from_type || ''}
                    placeholder="e.g., json"
                    onInput={(e: any) => updateTransformationLayer(output.id, layer.id, 'from_type', e.target.value)}
                  />
                  <ExInput
                    label="Depth"
                    type="number"
                    value={String(layer.depth || '')}
                    placeholder="Optional depth"
                    onInput={(e: any) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      updateTransformationLayer(output.id, layer.id, 'depth', val);
                    }}
                  />
                </div>
              </div>
            ))}
            <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={() => addTransformationLayer(output.id)}>
              + Add Layer
            </ExButton>
          </CollapsibleSection>
        </div>
      ))}
    </div>
  );
}
