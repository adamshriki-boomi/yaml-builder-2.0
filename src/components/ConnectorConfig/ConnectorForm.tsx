import { ExInput, ExSelect, ExButton, ExIconButton, ExMenuItem, ButtonType, ButtonFlavor, IconButtonType, IconButtonFlavor } from '@boomi/exosphere';
import { useConnector, useConnectorDispatch } from '../../context/ConnectorContext';
import type { Header, VariableStorage, VariableMetadataEntry } from '../../types/connector';
import { createVariableStorage } from '../../types/connector';
import AuthConfigSection from './AuthConfig';
import CollapsibleSection from '../Layout/CollapsibleSection';

export default function ConnectorForm() {
  const { config } = useConnector();
  const dispatch = useConnectorDispatch();

  const updateField = (field: string, value: string) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: { [field]: value } });
  };

  // --- Headers ---
  const addHeader = () => {
    const newHeader: Header = { id: crypto.randomUUID(), name: '', value: '' };
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { default_headers: [...config.default_headers, newHeader] },
    });
  };

  const updateHeader = (id: string, field: 'name' | 'value', val: string) => {
    const updated = config.default_headers.map(h =>
      h.id === id ? { ...h, [field]: val } : h
    );
    dispatch({ type: 'UPDATE_CONFIG', payload: { default_headers: updated } });
  };

  const removeHeader = (id: string) => {
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { default_headers: config.default_headers.filter(h => h.id !== id) },
    });
  };

  // --- Default Retry Strategy ---
  const enableDefaultRetry = () => {
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: {
        default_retry_strategy: {
          status_codes: '429,500,502,503,504',
          attempts: 3,
          interval: 10,
        },
      },
    });
  };

  const removeDefaultRetry = () => {
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { default_retry_strategy: null },
    });
  };

  const updateDefaultRetry = (field: string, value: any) => {
    if (!config.default_retry_strategy) return;
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: {
        default_retry_strategy: { ...config.default_retry_strategy, [field]: value },
      },
    });
  };

  // --- Variables Storages ---
  const addStorage = () => {
    const newStorage: VariableStorage = createVariableStorage();
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { variables_storages: [...config.variables_storages, newStorage] },
    });
  };

  const updateStorage = (id: string, field: 'name' | 'type', val: string) => {
    const updated = config.variables_storages.map(s =>
      s.id === id ? { ...s, [field]: val } : s
    );
    dispatch({ type: 'UPDATE_CONFIG', payload: { variables_storages: updated } });
  };

  const removeStorage = (id: string) => {
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { variables_storages: config.variables_storages.filter(s => s.id !== id) },
    });
  };

  // --- Variables Metadata (key-value map) ---
  const addMetadataEntry = () => {
    const newKey = `var_${Object.keys(config.variables_metadata).length + 1}`;
    const newEntry: VariableMetadataEntry = { format: 'json', storage_name: '' };
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: {
        variables_metadata: { ...config.variables_metadata, [newKey]: newEntry },
      },
    });
  };

  const updateMetadataKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey || !newKey) return;
    const entries = { ...config.variables_metadata };
    const val = entries[oldKey];
    delete entries[oldKey];
    entries[newKey] = val;
    dispatch({ type: 'UPDATE_CONFIG', payload: { variables_metadata: entries } });
  };

  const updateMetadataValue = (key: string, field: 'format' | 'storage_name', val: string) => {
    const entries = { ...config.variables_metadata };
    entries[key] = { ...entries[key], [field]: val };
    dispatch({ type: 'UPDATE_CONFIG', payload: { variables_metadata: entries } });
  };

  const removeMetadataEntry = (key: string) => {
    const entries = { ...config.variables_metadata };
    delete entries[key];
    dispatch({ type: 'UPDATE_CONFIG', payload: { variables_metadata: entries } });
  };

  return (
    <div>
      <CollapsibleSection label="Basic Configuration">
        <div className="form-field">
          <ExInput
            label="Connector Name"
            value={config.connector_name}
            placeholder="e.g., GitHub API Connector"
            onInput={(e: any) => updateField('connector_name', e.target.value)}
          />
        </div>
        <div className="form-field">
          <ExInput
            label="Base URL"
            value={config.base_url}
            placeholder="e.g., https://api.example.com/v1"
            onInput={(e: any) => updateField('base_url', e.target.value)}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection label="Default Headers">
        {config.default_headers.length === 0 && (
          <p className="form-helper-text">
            No default headers configured. Add headers that will be included in every request.
          </p>
        )}
        {config.default_headers.map(header => (
          <div key={header.id} className="form-row" style={{ alignItems: 'flex-end' }}>
            <ExInput
              label="Header Name"
              value={header.name}
              placeholder="e.g., Content-Type"
              onInput={(e: any) => updateHeader(header.id, 'name', e.target.value)}
            />
            <ExInput
              label="Header Value"
              value={header.value}
              placeholder="e.g., application/json"
              onInput={(e: any) => updateHeader(header.id, 'value', e.target.value)}
            />
            <ExIconButton
              type={IconButtonType.SECONDARY}
              flavor={IconButtonFlavor.RISKY}
              icon="delete"
              label="Delete header"
              onClick={() => removeHeader(header.id)}
            />
          </div>
        ))}
        <div className="form-toolbar">
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={addHeader}>
            + Add Header
          </ExButton>
        </div>
      </CollapsibleSection>

      <CollapsibleSection label="Authentication">
        <AuthConfigSection />
      </CollapsibleSection>

      <CollapsibleSection label="Default Retry Strategy">
        {!config.default_retry_strategy ? (
          <div>
            <p className="form-helper-text">
              No default retry strategy. Add one to apply retries across all steps.
            </p>
            <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={enableDefaultRetry}>
              Enable Default Retry
            </ExButton>
          </div>
        ) : (
          <div>
            <div className="form-field">
              <ExInput
                label="Status Codes"
                value={config.default_retry_strategy.status_codes}
                placeholder="429,500,502,503,504"
                onInput={(e: any) => updateDefaultRetry('status_codes', e.target.value)}
              />
            </div>
            <div className="form-row">
              <ExInput
                label="Max Attempts"
                type="number"
                value={String(config.default_retry_strategy.attempts)}
                onInput={(e: any) => updateDefaultRetry('attempts', Number(e.target.value))}
              />
              <ExInput
                label="Interval (seconds)"
                type="number"
                value={String(config.default_retry_strategy.interval)}
                onInput={(e: any) => updateDefaultRetry('interval', Number(e.target.value))}
              />
            </div>
            <div className="form-toolbar">
              <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.RISKY} onClick={removeDefaultRetry}>
                Remove Default Retry
              </ExButton>
            </div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection label="Variables Storages">
        {config.variables_storages.length === 0 && (
          <p className="form-helper-text">
            No variable storages configured. Add storage backends for your pipeline variables.
          </p>
        )}
        {config.variables_storages.map(storage => (
          <div key={storage.id} className="form-row" style={{ alignItems: 'flex-end' }}>
            <ExInput
              label="Storage Name"
              value={storage.name}
              placeholder="e.g., results_dir"
              onInput={(e: any) => updateStorage(storage.id, 'name', e.target.value)}
            />
            <ExSelect
              label="Storage Type"
              selected={storage.type}
              valueBasedSelection
              onChange={(e: any) => {
                const val = e.detail?.value;
                if (val) updateStorage(storage.id, 'type', val);
              }}
            >
              <ExMenuItem value="file_system">File System</ExMenuItem>
              <ExMenuItem value="memory">Memory</ExMenuItem>
            </ExSelect>
            <ExIconButton
              type={IconButtonType.SECONDARY}
              flavor={IconButtonFlavor.RISKY}
              icon="delete"
              label="Delete storage"
              onClick={() => removeStorage(storage.id)}
            />
          </div>
        ))}
        <div className="form-toolbar">
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={addStorage}>
            + Add Storage
          </ExButton>
        </div>
      </CollapsibleSection>

      <CollapsibleSection label="Variables Metadata">
        <p className="form-helper-text">
          Map variable names to their format and storage backend.
        </p>
        {Object.entries(config.variables_metadata).map(([key, entry]) => (
          <div key={key} className="sub-card">
            <div className="sub-card-header sub-card-header--end">
              <ExIconButton
                type={IconButtonType.SECONDARY}
                flavor={IconButtonFlavor.RISKY}
                icon="delete"
                label="Delete metadata entry"
                onClick={() => removeMetadataEntry(key)}
              />
            </div>
            <div className="form-row">
              <ExInput
                label="Variable Name"
                value={key}
                placeholder="e.g., report1_raw"
                onBlur={(e: any) => updateMetadataKey(key, e.target.value)}
              />
              <ExSelect
                label="Format"
                selected={entry.format}
                valueBasedSelection
                onChange={(e: any) => {
                  const val = e.detail?.value;
                  if (val) updateMetadataValue(key, 'format', val);
                }}
              >
                <ExMenuItem value="json">JSON</ExMenuItem>
                <ExMenuItem value="text">Text</ExMenuItem>
              </ExSelect>
              <ExInput
                label="Storage Name"
                value={entry.storage_name}
                placeholder="e.g., results_dir"
                onInput={(e: any) => updateMetadataValue(key, 'storage_name', e.target.value)}
              />
            </div>
          </div>
        ))}
        <div className="form-toolbar">
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={addMetadataEntry}>
            + Add Metadata Entry
          </ExButton>
        </div>
      </CollapsibleSection>
    </div>
  );
}
