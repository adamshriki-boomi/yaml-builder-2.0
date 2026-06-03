import { ExButton, ExInput, ExSelect, ExToggle, ExLabel, ExIconButton, ExMenuItem, ExEmptyState, ExCard, ButtonType, ButtonFlavor, IconButtonType, IconButtonFlavor } from '@boomi/exosphere';
import CollapsibleSection from '../Layout/CollapsibleSection';
import { useConnector, useConnectorDispatch } from '../../context/ConnectorContext';
import type { InterfaceParameter, DynamicSource } from '../../types/connector';

export default function ParameterList() {
  const { config } = useConnector();
  const dispatch = useConnectorDispatch();

  const addParameter = () => {
    const newParam: InterfaceParameter = {
      id: crypto.randomUUID(),
      name: '',
      type: 'string',
    };
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { interface_parameters: [...config.interface_parameters, newParam] },
    });
  };

  const updateParam = (id: string, field: keyof InterfaceParameter, value: any) => {
    const updated = config.interface_parameters.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    );
    dispatch({ type: 'UPDATE_CONFIG', payload: { interface_parameters: updated } });
  };

  const removeParam = (id: string) => {
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { interface_parameters: config.interface_parameters.filter(p => p.id !== id) },
    });
  };

  const duplicateParam = (param: InterfaceParameter) => {
    const dup: InterfaceParameter = {
      ...param,
      id: crypto.randomUUID(),
      name: `${param.name}_copy`,
    };
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { interface_parameters: [...config.interface_parameters, dup] },
    });
  };

  const updateDynamicSource = (paramId: string, field: keyof DynamicSource, value: any) => {
    const updated = config.interface_parameters.map(p => {
      if (p.id !== paramId) return p;
      const ds = p.dynamic_source || {
        type: 'variable',
        variable_name: '',
        populate_on: 'mount',
        allow_manual_refresh: true,
      };
      return { ...p, dynamic_source: { ...ds, [field]: value } };
    });
    dispatch({ type: 'UPDATE_CONFIG', payload: { interface_parameters: updated } });
  };

  const updateEnumValues = (paramId: string, valuesStr: string) => {
    const values = valuesStr.split(',').map(v => v.trim()).filter(Boolean);
    updateParam(paramId, 'values', values);
  };

  return (
    <div>
      <CollapsibleSection label={`Existing Parameters (${config.interface_parameters.length})`}>
          {config.interface_parameters.length === 0 ? (
            <div className="empty-state-wrap">
              <ExEmptyState
                label="No parameters defined"
                text="Define input parameters that users of your connector will need to provide, such as API keys, date ranges, or configuration values."
              >
                <ExButton slot="action" type={ButtonType.PRIMARY} flavor={ButtonFlavor.BRANDED} onClick={addParameter}>
                  Add First Parameter
                </ExButton>
              </ExEmptyState>
            </div>
          ) : (
            config.interface_parameters.map((param, index) => (
              <ExCard key={param.id} className="app-list-card">
                <div slot="header" className="card-row card-row--between">
                  <span className="card-meta">
                    Parameter {index + 1}
                  </span>
                  <div className="card-actions">
                    <ExIconButton
                      type={IconButtonType.SECONDARY}
                      flavor={IconButtonFlavor.BASE}
                      icon="copy"
                      label="Duplicate parameter"
                      onClick={() => duplicateParam(param)}
                    />
                    <ExIconButton
                      type={IconButtonType.SECONDARY}
                      flavor={IconButtonFlavor.RISKY}
                      icon="delete"
                      label="Delete parameter"
                      onClick={() => removeParam(param.id)}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <ExSelect
                    label="Parameter Type"
                    selected={param.type}
                    valueBasedSelection
                    onChange={(e: any) => {
                      const val = e.detail?.value;
                      if (val) updateParam(param.id, 'type', val);
                    }}
                  >
                    <ExMenuItem value="string">String</ExMenuItem>
                    <ExMenuItem value="authentication">Authentication</ExMenuItem>
                    <ExMenuItem value="date_range">Date Range</ExMenuItem>
                    <ExMenuItem value="list">List</ExMenuItem>
                    <ExMenuItem value="multiselect">Multiselect</ExMenuItem>
                    <ExMenuItem value="enum">Enum</ExMenuItem>
                  </ExSelect>
                  <ExInput
                    label="Parameter Name"
                    value={param.name}
                    placeholder="e.g., api_key"
                    helpText="A unique identifier for this parameter"
                    onInput={(e: any) => updateParam(param.id, 'name', e.target.value)}
                  />
                </div>

                {/* Auth type sub-field */}
                {param.type === 'authentication' && (
                  <div className="form-field">
                    <ExSelect
                      label="Auth Type"
                      selected={param.auth_type || 'bearer'}
                      valueBasedSelection
                      onChange={(e: any) => {
                        const val = e.detail?.value;
                        if (val) updateParam(param.id, 'auth_type', val);
                      }}
                    >
                      <ExMenuItem value="bearer">Bearer</ExMenuItem>
                      <ExMenuItem value="basic_http">Basic HTTP</ExMenuItem>
                      <ExMenuItem value="api_key">API Key</ExMenuItem>
                      <ExMenuItem value="oauth2">OAuth 2.0</ExMenuItem>
                    </ExSelect>
                  </div>
                )}

                {/* String value */}
                {param.type === 'string' && (
                  <div className="form-field">
                    <ExInput
                      label="Value (optional)"
                      value={param.value || ''}
                      placeholder="e.g., last_14_days"
                      onInput={(e: any) => updateParam(param.id, 'value', e.target.value)}
                    />
                  </div>
                )}

                {/* Enum values + default */}
                {param.type === 'enum' && (
                  <div>
                    <div className="form-field">
                      <ExInput
                        label="Enum Values (comma-separated)"
                        value={(param.values || []).join(', ')}
                        placeholder="e.g., option1, option2, option3"
                        onInput={(e: any) => updateEnumValues(param.id, e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <ExInput
                        label="Default Value"
                        value={param.default || ''}
                        placeholder="Default enum value"
                        onInput={(e: any) => updateParam(param.id, 'default', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Multiselect with dynamic source */}
                {param.type === 'multiselect' && (
                  <div className="form-indent form-indent--top">
                    <div className="form-section-title form-section-title--inline">Dynamic Source</div>
                    <div className="form-row">
                      <ExInput
                        label="Source Type"
                        value={param.dynamic_source?.type || 'variable'}
                        placeholder="e.g., variable"
                        onInput={(e: any) => updateDynamicSource(param.id, 'type', e.target.value)}
                      />
                      <ExInput
                        label="Variable Name"
                        value={param.dynamic_source?.variable_name || ''}
                        placeholder="e.g., discovered_accounts"
                        onInput={(e: any) => updateDynamicSource(param.id, 'variable_name', e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <ExSelect
                        label="Populate On"
                        selected={param.dynamic_source?.populate_on || 'mount'}
                        valueBasedSelection
                        onChange={(e: any) => {
                          const val = e.detail?.value;
                          if (val) updateDynamicSource(param.id, 'populate_on', val);
                        }}
                      >
                        <ExMenuItem value="mount">Mount</ExMenuItem>
                        <ExMenuItem value="change">Change</ExMenuItem>
                        <ExMenuItem value="manual">Manual</ExMenuItem>
                      </ExSelect>
                      <div className="toggle-row toggle-row--padded">
                        <ExToggle
                          on={param.dynamic_source?.allow_manual_refresh ?? true}
                          onChange={() => updateDynamicSource(param.id, 'allow_manual_refresh', !(param.dynamic_source?.allow_manual_refresh ?? true))}
                        />
                        <ExLabel>Allow Manual Refresh</ExLabel>
                      </div>
                    </div>
                  </div>
                )}

                {/* Required toggle */}
                <div className="toggle-row">
                  <ExToggle
                    on={param.required || false}
                    onChange={() => updateParam(param.id, 'required', !param.required)}
                  />
                  <ExLabel>Required</ExLabel>
                </div>
                <div className="toggle-row">
                  <ExToggle
                    on={param.is_sensitive || false}
                    onChange={() => updateParam(param.id, 'is_sensitive', !param.is_sensitive)}
                  />
                  <ExLabel>Sensitive / Encrypted</ExLabel>
                </div>
              </ExCard>
            ))
          )}
      </CollapsibleSection>

      {config.interface_parameters.length > 0 && (
        <div className="form-section">
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={addParameter}>
            + Add Parameter
          </ExButton>
        </div>
      )}
    </div>
  );
}
