import { stringify, parse } from 'yaml';
import type {
  ConnectorConfig,
  InterfaceParameter,
  VariableMetadataEntry,
  VariableStorage,
  ConfigurationGroup,
  MultiReport,
  WorkflowStep,
  RestStep,
  VariableOutput,
  TransformationLayer,
  ReportParameter,
} from '../types/connector';

export function configToYaml(config: ConnectorConfig): string {
  try {
    const yamlObj: any = {};

    // 1) INTERFACE PARAMETERS
    if (config.interface_parameters.length > 0) {
      yamlObj.interface_parameters = {
        section: {
          source: config.interface_parameters.map(serializeInterfaceParam),
        },
      };
    }

    // 2) CONNECTOR
    const connector: any = {};
    if (config.connector_name) connector.name = config.connector_name;
    if (config.base_url) connector.base_url = config.base_url;

    // Default headers
    if (config.default_headers.length > 0) {
      connector.default_headers = {};
      config.default_headers.forEach(h => {
        if (h.name) connector.default_headers[h.name] = h.value;
      });
    } else {
      connector.default_headers = {};
    }

    // Default retry strategy
    if (config.default_retry_strategy) {
      connector.default_retry_strategy = {
        status_codes: config.default_retry_strategy.status_codes,
        attempts: config.default_retry_strategy.attempts,
        interval: config.default_retry_strategy.interval,
      };
    } else {
      connector.default_retry_strategy = {};
    }

    // Authentication
    if (config.auth.type) {
      connector.auth = { type: config.auth.type };
      if (config.auth.type === 'oauth2' && config.auth.oauth) {
        connector.auth.oauth = {
          grant_type: config.auth.oauth.grant_type,
          ...(config.auth.oauth.token_url ? { token_url: config.auth.oauth.token_url } : {}),
          ...(config.auth.oauth.refresh_token ? { refresh_token: config.auth.oauth.refresh_token } : {}),
          use_base64: config.auth.oauth.use_base64,
        };
      }
    }

    // Variables metadata
    if (Object.keys(config.variables_metadata).length > 0) {
      connector.variables_metadata = {};
      for (const [varName, entry] of Object.entries(config.variables_metadata)) {
        connector.variables_metadata[varName] = {
          format: entry.format,
          storage_name: entry.storage_name,
        };
      }
    }

    // Variables storages
    if (config.variables_storages.length > 0) {
      connector.variables_storages = config.variables_storages.map(s => ({
        name: s.name,
        type: s.type,
      }));
    }

    if (Object.keys(connector).length > 0) {
      yamlObj.connector = connector;
    }

    // 3) PRE-RUN CONFIGURATIONS
    if (config.pre_run_configurations.length > 0) {
      yamlObj.pre_run_configurations = config.pre_run_configurations.map(serializeConfigGroup);
    }

    // 4) MULTI-REPORTS (note: hyphen in YAML key)
    if (config.multi_reports.length > 0) {
      yamlObj['multi-reports'] = config.multi_reports.map(serializeMultiReport);
    }

    // 5) POST-RUN CONFIGURATIONS
    if (config.post_run_configurations.length > 0) {
      yamlObj.post_run_configurations = config.post_run_configurations.map(serializeConfigGroup);
    }

    return stringify(yamlObj, { indent: 2, lineWidth: 0 });
  } catch (e) {
    return `# Error generating YAML: ${(e as Error).message}`;
  }
}

function serializeInterfaceParam(p: InterfaceParameter): any {
  const param: any = {
    name: p.name,
    type: p.type,
  };
  if (p.label) param.label = p.label;
  if (p.auth_type) param.auth_type = p.auth_type;
  if (p.value) param.value = p.value;
  if (p.required) param.required = true;
  if (p.values && p.values.length > 0) param.values = p.values;
  if (p.default) param.default = p.default;
  if (p.dynamic_source) {
    param.dynamic_source = {
      type: p.dynamic_source.type,
      variable_name: p.dynamic_source.variable_name,
      populate_on: p.dynamic_source.populate_on,
      allow_manual_refresh: p.dynamic_source.allow_manual_refresh,
    };
  }
  if (p.is_sensitive) param.is_sensitive = true;
  return param;
}

function serializeConfigGroup(group: ConfigurationGroup): any {
  const obj: any = {
    name: group.name,
  };
  if (group.steps.length > 0) {
    obj.steps = group.steps.map(serializeWorkflowStep);
  }
  return obj;
}

function serializeMultiReport(report: MultiReport): any {
  const obj: any = {
    name: report.name,
  };
  if (report.report_parameters.length > 0) {
    obj.report_parameters = report.report_parameters.map((rp: ReportParameter) => {
      const rpObj: any = {
        name: rp.name,
        type: rp.type,
      };
      if (rp.default) rpObj.default = rp.default;
      if (rp.values && rp.values.length > 0) rpObj.values = rp.values;
      return rpObj;
    });
  }
  if (report.steps.length > 0) {
    obj.steps = report.steps.map(serializeWorkflowStep);
  }
  return obj;
}

function serializeWorkflowStep(step: WorkflowStep): any {
  if (step.type === 'rest') {
    return serializeRestStep(step);
  } else {
    const loopObj: any = {
      type: 'loop',
      name: step.name,
      ...(step.description ? { description: step.description } : {}),
      loop_type: step.loop_type,
      ...(step.items_path ? { items_path: step.items_path } : {}),
      ...(step.item_name ? { item_name: step.item_name } : {}),
      include_in_output: step.include_in_output,
      ignore_errors: step.ignore_errors,
    };
    if (step.nested_steps.length > 0) {
      loopObj.nested_steps = step.nested_steps.map(serializeRestStep);
    }
    return loopObj;
  }
}

function serializeRestStep(step: RestStep): any {
  const obj: any = {
    type: 'rest',
    name: step.name,
    ...(step.description ? { description: step.description } : {}),
    method: step.method,
    ...(step.endpoint ? { endpoint: step.endpoint } : {}),
  };

  if (step.query_params?.length > 0) {
    obj.query_params = {};
    step.query_params.forEach((p: any) => {
      if (p.key) obj.query_params[p.key] = p.value;
    });
  }

  if (step.headers?.length > 0) {
    obj.headers = {};
    step.headers.forEach((h: any) => {
      if (h.name) obj.headers[h.name] = h.value;
    });
  }

  if (step.body) obj.body = step.body;
  if (step.content_type && step.content_type !== 'application/json') {
    obj.content_type = step.content_type;
  }

  if (step.pagination) {
    obj.pagination = {
      type: step.pagination.type,
      parameter_location: step.pagination.parameter_location,
      ...(step.pagination.type === 'cursor'
        ? { token_path: step.pagination.token_path }
        : {
            page_param_name: step.pagination.page_param_name,
            page_size_param_name: step.pagination.page_size_param_name,
            start_value: step.pagination.start_value,
            increment: step.pagination.increment,
          }),
      ...(step.pagination.total_items_path ? { total_items_path: step.pagination.total_items_path } : {}),
    };
    if (step.pagination.break_conditions?.length > 0) {
      obj.pagination.break_conditions = step.pagination.break_conditions.map((c: any) => ({
        type: c.type,
        ...(c.key ? { key: c.key } : {}),
        ...(c.value ? { value: c.value } : {}),
      }));
    }
  }

  if (step.retry) {
    obj.retry = {
      status_codes: step.retry.status_codes,
      attempts: step.retry.attempts,
      interval: step.retry.interval,
    };
  }

  if (step.variables_output?.length > 0) {
    obj.variables_output = step.variables_output.map((v: VariableOutput) => {
      const voObj: any = {
        response_location: v.response_location || 'data',
        variable_name: v.variable_name,
        variable_format: v.variable_format || v.format || 'json',
      };
      if (v.transformation_layers && v.transformation_layers.length > 0) {
        voObj.transformation_layers = v.transformation_layers.map((t: TransformationLayer) => {
          const tObj: any = { type: t.type };
          if (t.json_path) tObj.json_path = t.json_path;
          if (t.from_type) tObj.from_type = t.from_type;
          if (t.depth !== undefined && t.depth !== 0) tObj.depth = t.depth;
          return tObj;
        });
      }
      return voObj;
    });
  }

  return obj;
}

// ===== YAML -> CONFIG DESERIALIZERS =====

export function yamlToConfig(yamlText: string): ConnectorConfig {
  const obj = parse(yamlText);
  if (!obj || typeof obj !== 'object') {
    throw new Error('Invalid YAML format');
  }

  // Parse interface_parameters
  let interfaceParams: InterfaceParameter[] = [];
  if (obj.interface_parameters?.section?.source) {
    interfaceParams = (obj.interface_parameters.section.source || []).map(deserializeInterfaceParam);
  } else if (Array.isArray(obj.interface_parameters)) {
    // Backward compat: flat array
    interfaceParams = obj.interface_parameters.map(deserializeInterfaceParam);
  }

  // Parse connector section
  const conn = obj.connector || {};

  const config: ConnectorConfig = {
    connector_name: conn.name || obj.connector_name || '',
    base_url: conn.base_url || obj.base_url || '',
    default_headers: deserializeHeaders(conn.default_headers || obj.default_headers),
    auth: deserializeAuth(conn.auth || obj.auth),
    default_retry_strategy: conn.default_retry_strategy && Object.keys(conn.default_retry_strategy).length > 0
      ? {
          status_codes: conn.default_retry_strategy.status_codes || '',
          attempts: conn.default_retry_strategy.attempts || 3,
          interval: conn.default_retry_strategy.interval || 10,
        }
      : null,
    interface_parameters: interfaceParams,
    variables_metadata: deserializeVariablesMetadata(conn.variables_metadata || obj.variables_metadata),
    variables_storages: deserializeVariablesStorages(conn.variables_storages || obj.variables_storages),
    pre_run_configurations: (obj.pre_run_configurations || []).map(deserializeConfigGroup),
    multi_reports: (obj['multi-reports'] || obj.multi_reports || []).map(deserializeMultiReport),
    post_run_configurations: (obj.post_run_configurations || []).map(deserializeConfigGroup),
  };

  return config;
}

function deserializeInterfaceParam(p: any): InterfaceParameter {
  const param: InterfaceParameter = {
    id: crypto.randomUUID(),
    name: p.name || '',
    type: p.type || 'string',
  };
  if (p.label) param.label = p.label;
  if (p.auth_type) param.auth_type = p.auth_type;
  if (p.value !== undefined) param.value = String(p.value);
  if (p.required) param.required = true;
  if (p.values) param.values = p.values;
  if (p.default !== undefined) param.default = String(p.default);
  if (p.dynamic_source) {
    param.dynamic_source = {
      type: p.dynamic_source.type || 'variable',
      variable_name: p.dynamic_source.variable_name || '',
      populate_on: p.dynamic_source.populate_on || 'mount',
      allow_manual_refresh: p.dynamic_source.allow_manual_refresh ?? true,
    };
  }
  if (p.is_sensitive) param.is_sensitive = true;
  // backward compat: map old location/map_to if present
  return param;
}

function deserializeHeaders(headers: any): any[] {
  if (!headers) return [];
  if (typeof headers === 'object' && !Array.isArray(headers)) {
    return Object.entries(headers).map(([name, value]) => ({
      id: crypto.randomUUID(),
      name,
      value: String(value),
    }));
  }
  return [];
}

function deserializeAuth(auth: any): any {
  if (!auth) return { type: 'bearer' };
  return {
    type: auth.type || 'bearer',
    ...(auth.oauth ? {
      oauth: {
        grant_type: auth.oauth.grant_type || 'authorization_code',
        token_url: auth.oauth.token_url || '',
        refresh_token: auth.oauth.refresh_token || '',
        use_base64: auth.oauth.use_base64 || false,
      },
    } : {}),
  };
}

function deserializeVariablesMetadata(meta: any): Record<string, VariableMetadataEntry> {
  if (!meta || typeof meta !== 'object') return {};
  // Check if it's the old flat format
  if (meta.storage || meta.results_dir || meta.data_format) {
    // Old format - skip it, don't try to convert
    return {};
  }
  const result: Record<string, VariableMetadataEntry> = {};
  for (const [key, val] of Object.entries(meta)) {
    if (val && typeof val === 'object') {
      const entry = val as any;
      result[key] = {
        format: entry.format || 'json',
        storage_name: entry.storage_name || '',
      };
    }
  }
  return result;
}

function deserializeVariablesStorages(storages: any): VariableStorage[] {
  if (!Array.isArray(storages)) return [];
  return storages.map((s: any) => ({
    id: crypto.randomUUID(),
    name: s.name || '',
    type: s.type || 'file_system',
  }));
}

function deserializeConfigGroup(group: any): any {
  return {
    id: crypto.randomUUID(),
    name: group.name || '',
    steps: (group.steps || []).map(deserializeStep),
  };
}

function deserializeMultiReport(report: any): MultiReport {
  return {
    id: crypto.randomUUID(),
    name: report.name || '',
    report_parameters: (report.report_parameters || []).map((rp: any) => ({
      id: crypto.randomUUID(),
      name: rp.name || '',
      type: rp.type || 'string',
      default: rp.default !== undefined ? String(rp.default) : undefined,
      values: rp.values || undefined,
    })),
    steps: (report.steps || []).map(deserializeStep),
  };
}

function deserializeStep(s: any): any {
  if (s.type === 'loop') {
    return {
      id: crypto.randomUUID(),
      type: 'loop',
      name: s.name || '',
      description: s.description || '',
      loop_type: s.loop_type || 'data',
      items_path: s.items_path || '',
      item_name: s.item_name || '',
      include_in_output: s.include_in_output || false,
      ignore_errors: s.ignore_errors || false,
      nested_steps: (s.nested_steps || []).map((ns: any) => deserializeRestStep(ns)),
    };
  }
  return deserializeRestStep(s);
}

function deserializeRestStep(s: any): RestStep {
  return {
    id: crypto.randomUUID(),
    type: 'rest',
    name: s.name || '',
    description: s.description || '',
    method: s.method || 'GET',
    endpoint: s.endpoint || '',
    query_params: s.query_params
      ? Object.entries(s.query_params).map(([key, value]) => ({
          id: crypto.randomUUID(),
          key,
          value: String(value),
        }))
      : [],
    headers: s.headers
      ? (typeof s.headers === 'object' && !Array.isArray(s.headers)
        ? Object.entries(s.headers).map(([name, value]) => ({
            id: crypto.randomUUID(),
            name,
            value: String(value),
          }))
        : [])
      : [],
    body: s.body || '',
    content_type: s.content_type || 'application/json',
    pagination: s.pagination ? {
      type: s.pagination.type || 'page',
      page_param_name: s.pagination.page_param_name || s.pagination.offset_param || 'page',
      page_size_param_name: s.pagination.page_size_param_name || s.pagination.limit_param || 'page_size',
      start_value: s.pagination.start_value ?? 1,
      increment: s.pagination.increment ?? 1,
      parameter_location: s.pagination.parameter_location || 'query',
      token_path: s.pagination.token_path || '',
      total_items_path: s.pagination.total_items_path || '',
      break_conditions: (s.pagination.break_conditions || []).map((c: any) => ({
        id: crypto.randomUUID(),
        type: c.type || 'empty_response',
        key: c.key || '',
        value: c.value || '',
      })),
    } : undefined,
    retry: s.retry ? {
      status_codes: s.retry.status_codes || '',
      attempts: s.retry.attempts || 3,
      interval: s.retry.interval || 10,
    } : undefined,
    variables_output: (s.variables_output || []).map((v: any) => ({
      id: crypto.randomUUID(),
      variable_name: v.variable_name || '',
      response_location: v.response_location || 'data',
      variable_format: v.variable_format || v.format || 'json',
      json_path: v.json_path || '',
      format: v.format || v.variable_format || 'json',
      transformation_layers: (v.transformation_layers || []).map((t: any) => ({
        id: crypto.randomUUID(),
        type: t.type || 'extract_json',
        json_path: t.json_path || '',
        from_type: t.from_type || '',
        depth: t.depth || undefined,
      })),
    })),
  };
}
