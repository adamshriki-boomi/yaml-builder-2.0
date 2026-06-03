import { useMemo, useState } from 'react';
import {
  ExButton,
  ExInput,
  ExSelect,
  ExMenuItem,
  ExDatePicker,
  ButtonType,
  ButtonFlavor,
  DateType,
} from '@boomi/exosphere';
import { useConnector } from '../../context/ConnectorContext';
import type { InterfaceParameter } from '../../types/connector';

interface Props {
  onRun: (values: Record<string, string>) => void;
  onReloadParameters: () => void;
}

function defaultValueFor(p: InterfaceParameter): string {
  if (p.value) return p.value;
  if (p.type === 'enum' && p.default) return p.default;
  return '';
}

export default function InterfaceParametersForm({ onRun, onReloadParameters }: Props) {
  const { config } = useConnector();
  const params = config.interface_parameters;

  const initialValues = useMemo(() => {
    const seed: Record<string, string> = {};
    for (const p of params) {
      seed[p.id] = defaultValueFor(p);
    }
    return seed;
  }, [params]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const setValue = (id: string, value: string) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const allRequiredFilled = params.every(p => !p.required || (values[p.id] ?? '').trim().length > 0);

  const handleRun = () => {
    if (!allRequiredFilled) return;
    onRun(values);
  };

  return (
    <div className="test-panel-content">
      <p className="test-panel-intro">
        To test your Blueprint, enter values for the parameters below. These values are used only for this test run and won't be saved.
      </p>

      <div className="form-section-title">Interface Parameters</div>

      {params.length === 0 ? (
        <p className="form-helper-text">This Blueprint has no interface parameters defined.</p>
      ) : (
        <div className="test-panel-fields">
          {params.map(param => (
            <div className="form-field" key={param.id}>
              {renderField(param, values[param.id] ?? '', (v) => setValue(param.id, v))}
            </div>
          ))}
        </div>
      )}

      <div className="test-panel-footer">
        <ExButton
          type={ButtonType.SECONDARY}
          flavor={ButtonFlavor.BASE}
          onClick={onReloadParameters}
        >
          Reset values
        </ExButton>
        <ExButton
          type={ButtonType.PRIMARY}
          flavor={ButtonFlavor.BASE}
          onClick={handleRun}
          disabled={!allRequiredFilled}
        >
          Run Test
        </ExButton>
      </div>
    </div>
  );
}

function renderField(
  param: InterfaceParameter,
  value: string,
  onChange: (v: string) => void,
) {
  const label = param.label || param.name || 'Parameter';

  if (param.type === 'authentication') {
    return (
      <ExSelect
        label="Connection"
        helpText="Select a Connection from an existing list or create a new one."
        selected={value}
        valueBasedSelection
        placeholder="Select connection or Add New"
        onChange={(e: any) => {
          const v = e.detail?.value;
          if (typeof v === 'string') onChange(v);
        }}
      >
        <ExMenuItem value="github_connection">GitHub Connection</ExMenuItem>
        <ExMenuItem value="add_new">+ Add New Connection</ExMenuItem>
      </ExSelect>
    );
  }

  if (param.type === 'date_range') {
    const [startDate, endDate] = value.split('|');
    return (
      <ExDatePicker
        label={label || 'Date range'}
        type={DateType.DATE_RANGE}
        format="mm/dd/yyyy"
        startDate={startDate ?? ''}
        endDate={endDate ?? ''}
        onChange={(e: any) => {
          const start = e.detail?.startDate ?? e.target?.startDate ?? '';
          const end = e.detail?.endDate ?? e.target?.endDate ?? '';
          if (start || end) onChange(`${start}|${end}`);
        }}
      />
    );
  }

  if (param.type === 'enum') {
    const options = param.values ?? [];
    return (
      <ExSelect
        label={label}
        selected={value}
        valueBasedSelection
        onChange={(e: any) => {
          const v = e.detail?.value;
          if (typeof v === 'string') onChange(v);
        }}
      >
        {options.map(opt => (
          <ExMenuItem key={opt} value={opt}>{opt}</ExMenuItem>
        ))}
      </ExSelect>
    );
  }

  if (param.type === 'multiselect') {
    return (
      <ExInput
        label={label}
        value={value}
        placeholder="Comma-separated values"
        helpText={param.dynamic_source ? `Dynamic source: ${param.dynamic_source.variable_name}` : undefined}
        onInput={(e: any) => onChange(e.target.value ?? '')}
      />
    );
  }

  return (
    <ExInput
      label={label}
      value={value}
      placeholder={param.name}
      onInput={(e: any) => onChange(e.target.value ?? '')}
    />
  );
}
