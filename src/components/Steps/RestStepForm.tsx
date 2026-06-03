import { ExInput, ExSelect, ExButton, ExIconButton, ExTextarea, ExMenuItem, ButtonType, ButtonFlavor, IconButtonType, IconButtonFlavor } from '@boomi/exosphere';
import type { RestStep, Header, QueryParam } from '../../types/connector';
import PaginationConfig from './PaginationConfig';
import RetryConfig from './RetryConfig';
import VariableOutputs from './VariableOutputs';

interface Props {
  step: RestStep;
  onChange: (updates: Partial<RestStep>) => void;
}

export default function RestStepForm({ step, onChange }: Props) {
  const addQueryParam = () => {
    const newParam: QueryParam = { id: crypto.randomUUID(), key: '', value: '' };
    onChange({ query_params: [...step.query_params, newParam] });
  };

  const updateQueryParam = (id: string, field: 'key' | 'value', val: string) => {
    const updated = step.query_params.map(p =>
      p.id === id ? { ...p, [field]: val } : p
    );
    onChange({ query_params: updated });
  };

  const removeQueryParam = (id: string) => {
    onChange({ query_params: step.query_params.filter(p => p.id !== id) });
  };

  const addHeader = () => {
    const newHeader: Header = { id: crypto.randomUUID(), name: '', value: '' };
    onChange({ headers: [...step.headers, newHeader] });
  };

  const updateHeader = (id: string, field: 'name' | 'value', val: string) => {
    const updated = step.headers.map(h =>
      h.id === id ? { ...h, [field]: val } : h
    );
    onChange({ headers: updated });
  };

  const removeHeader = (id: string) => {
    onChange({ headers: step.headers.filter(h => h.id !== id) });
  };

  return (
    <div>
      <div className="form-row">
        <ExInput
          label="Step Name"
          value={step.name}
          placeholder="e.g., Get User Data"
          onInput={(e: any) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="form-field">
        <ExInput
          label="Description"
          value={step.description}
          placeholder="Explain what this step does"
          onInput={(e: any) => onChange({ description: e.target.value })}
        />
      </div>
      <div className="form-row">
        <div className="form-method-cell">
          <ExSelect
            label="Method"
            selected={step.method}
            valueBasedSelection
            onChange={(e: any) => {
              const val = e.detail?.value;
              if (val) onChange({ method: val });
            }}
          >
            <ExMenuItem value="GET">GET</ExMenuItem>
            <ExMenuItem value="POST">POST</ExMenuItem>
            <ExMenuItem value="PUT">PUT</ExMenuItem>
            <ExMenuItem value="DELETE">DELETE</ExMenuItem>
            <ExMenuItem value="PATCH">PATCH</ExMenuItem>
          </ExSelect>
        </div>
        <ExInput
          label="Endpoint"
          value={step.endpoint}
          placeholder="/users/{{%user_id%}}"
          onInput={(e: any) => onChange({ endpoint: e.target.value })}
        />
      </div>

      {/* Query Parameters */}
      <div className="form-section">
        <div className="form-section-title form-section-title--inline">
          Query Parameters
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={addQueryParam}>Add</ExButton>
        </div>
        {step.query_params.map(param => (
          <div key={param.id} className="form-row" style={{ alignItems: 'flex-end' }}>
            <ExInput
              label="Key"
              value={param.key}
              placeholder="param_name"
              onInput={(e: any) => updateQueryParam(param.id, 'key', e.target.value)}
            />
            <ExInput
              label="Value"
              value={param.value}
              placeholder="param_value"
              onInput={(e: any) => updateQueryParam(param.id, 'value', e.target.value)}
            />
            <ExIconButton type={IconButtonType.SECONDARY} flavor={IconButtonFlavor.RISKY} icon="delete" label="Delete parameter" onClick={() => removeQueryParam(param.id)} />
          </div>
        ))}
      </div>

      {/* Headers */}
      <div className="form-section">
        <div className="form-section-title form-section-title--inline">
          Headers
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={addHeader}>Add</ExButton>
        </div>
        {step.headers.map(header => (
          <div key={header.id} className="form-row" style={{ alignItems: 'flex-end' }}>
            <ExInput
              label="Name"
              value={header.name}
              placeholder="Header-Name"
              onInput={(e: any) => updateHeader(header.id, 'name', e.target.value)}
            />
            <ExInput
              label="Value"
              value={header.value}
              placeholder="Header-Value"
              onInput={(e: any) => updateHeader(header.id, 'value', e.target.value)}
            />
            <ExIconButton type={IconButtonType.SECONDARY} flavor={IconButtonFlavor.RISKY} icon="delete" label="Delete header" onClick={() => removeHeader(header.id)} />
          </div>
        ))}
      </div>

      {/* Request Body */}
      {(step.method === 'POST' || step.method === 'PUT' || step.method === 'PATCH') && (
        <div className="form-section">
          <div className="form-field">
            <ExInput
              label="Content-Type"
              value={step.content_type}
              placeholder="application/json"
              onInput={(e: any) => onChange({ content_type: e.target.value })}
            />
          </div>
          <div className="form-field">
            <ExTextarea
              label="Request Body"
              value={step.body}
              placeholder='{"key": "value"}'
              rows={4}
              onInput={(e: any) => onChange({ body: e.target.value })}
            />
          </div>
        </div>
      )}

      <PaginationConfig step={step} onChange={onChange} />
      <RetryConfig step={step} onChange={onChange} />
      <VariableOutputs step={step} onChange={onChange} />
    </div>
  );
}
