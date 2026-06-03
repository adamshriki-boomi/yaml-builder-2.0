export type AuthType = 'bearer' | 'basic_http' | 'api_key' | 'oauth2';
export type OAuthGrantType = 'authorization_code' | 'client_credentials';
export type ParameterType = 'string' | 'authentication' | 'date_range' | 'list' | 'multiselect' | 'enum';
export type StepType = 'rest' | 'loop';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type PaginationType = 'page' | 'offset' | 'cursor';
export type StorageType = 'file_system' | 'memory';
export type VariableFormat = 'json' | 'text';
export type ResponseLocation = 'data' | 'headers' | 'status';
export type BreakConditionType = 'empty_response' | 'page_size_mismatch' | 'total_items_reached' | 'boolean_field';

export interface Header {
  id: string;
  name: string;
  value: string;
}

export interface OAuthConfig {
  grant_type: OAuthGrantType;
  token_url: string;
  refresh_token: string;
  use_base64: boolean;
}

export interface AuthConfig {
  type: AuthType;
  oauth?: OAuthConfig;
}

// Dynamic source for multiselect parameters
export interface DynamicSource {
  type: string;
  variable_name: string;
  populate_on: string;
  allow_manual_refresh: boolean;
}

export interface InterfaceParameter {
  id: string;
  name: string;
  label?: string;         // friendly display label; falls back to name
  type: ParameterType;
  auth_type?: string;
  value?: string;
  required?: boolean;
  values?: string[];      // for enum type
  default?: string;       // for enum type
  dynamic_source?: DynamicSource;
  is_sensitive?: boolean;
}

// Variable metadata entry (per-variable)
export interface VariableMetadataEntry {
  format: string;
  storage_name: string;
}

// Variable storage
export interface VariableStorage {
  id: string;
  name: string;
  type: string;
}

// Transformation layer
export interface TransformationLayer {
  id: string;
  type: string;
  json_path?: string;
  from_type?: string;
  depth?: number;
}

export interface QueryParam {
  id: string;
  key: string;
  value: string;
}

export interface VariableOutput {
  id: string;
  variable_name: string;
  response_location: string;
  variable_format: string;
  json_path?: string;      // backward compat
  format?: string;         // backward compat
  transformation_layers: TransformationLayer[];
}

export interface BreakCondition {
  id: string;
  type: BreakConditionType;
  key: string;
  value: string;
}

export interface PaginationConfig {
  type: PaginationType;
  page_param_name: string;
  page_size_param_name: string;
  start_value: number;
  increment: number;
  parameter_location: string;
  token_path: string;
  total_items_path: string;
  break_conditions: BreakCondition[];
}

export interface RetryConfig {
  status_codes: string;
  attempts: number;
  interval: number;
}

export interface RestStep {
  id: string;
  type: 'rest';
  name: string;
  description: string;
  method: HttpMethod;
  endpoint: string;
  query_params: QueryParam[];
  headers: Header[];
  body: string;
  content_type: string;
  pagination?: PaginationConfig;
  retry?: RetryConfig;
  variables_output: VariableOutput[];
}

export interface LoopStep {
  id: string;
  type: 'loop';
  name: string;
  description: string;
  loop_type: string;
  items_path: string;
  item_name: string;
  include_in_output: boolean;
  ignore_errors: boolean;
  nested_steps: RestStep[];
  after_loop_step?: RestStep;
}

export type WorkflowStep = RestStep | LoopStep;

// Report parameter (per-report)
export interface ReportParameter {
  id: string;
  name: string;
  type: string;
  default?: string;
  values?: string[];
}

// Multi-report definition
export interface MultiReport {
  id: string;
  name: string;
  report_parameters: ReportParameter[];
  steps: WorkflowStep[];
}

// Configuration group (pre_run or post_run)
export interface ConfigurationGroup {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

// Root connector config
export interface ConnectorConfig {
  // Interface parameters
  interface_parameters: InterfaceParameter[];

  // Connector settings
  connector_name: string;
  base_url: string;
  default_headers: Header[];
  auth: AuthConfig;
  default_retry_strategy: RetryConfig | null;
  variables_metadata: Record<string, VariableMetadataEntry>;
  variables_storages: VariableStorage[];

  // Pre-run configurations
  pre_run_configurations: ConfigurationGroup[];

  // Multi-reports
  multi_reports: MultiReport[];

  // Post-run configurations
  post_run_configurations: ConfigurationGroup[];
}

export const createDefaultConnector = (): ConnectorConfig => ({
  connector_name: '',
  base_url: '',
  default_headers: [],
  auth: {
    type: 'bearer',
  },
  default_retry_strategy: null,
  interface_parameters: [],
  variables_metadata: {},
  variables_storages: [],
  pre_run_configurations: [],
  multi_reports: [],
  post_run_configurations: [],
});

export const createRestStep = (): RestStep => ({
  id: crypto.randomUUID(),
  type: 'rest',
  name: '',
  description: '',
  method: 'GET',
  endpoint: '',
  query_params: [],
  headers: [],
  body: '',
  content_type: 'application/json',
  variables_output: [],
});

export const createLoopStep = (): LoopStep => ({
  id: crypto.randomUUID(),
  type: 'loop',
  name: '',
  description: '',
  loop_type: 'data',
  items_path: '',
  item_name: '',
  include_in_output: false,
  ignore_errors: false,
  nested_steps: [createRestStep()],
});

export const createMultiReport = (): MultiReport => ({
  id: crypto.randomUUID(),
  name: '',
  report_parameters: [],
  steps: [],
});

export const createConfigurationGroup = (): ConfigurationGroup => ({
  id: crypto.randomUUID(),
  name: '',
  steps: [],
});

export const createTransformationLayer = (): TransformationLayer => ({
  id: crypto.randomUUID(),
  type: 'extract_json',
  json_path: '',
  from_type: 'json',
});

export const createVariableStorage = (): VariableStorage => ({
  id: crypto.randomUUID(),
  name: '',
  type: 'file_system',
});

export const createReportParameter = (): ReportParameter => ({
  id: crypto.randomUUID(),
  name: '',
  type: 'string',
});

// Test result types — produced by demoTestResults.ts and consumed by the Test Panel
export type ReportStatus = 'passed' | 'failed';

export interface StepResult {
  method: HttpMethod;
  url: string;
  statusCode: number;
  durationMs: number;
}

export interface ReportTestResult {
  reportName: string;
  status: ReportStatus;
  recordsReturned: number;
  durationMs: number;
  steps: StepResult[];
  sampleData?: Array<Record<string, unknown>>;
  sampleColumns?: string[];
  errorCode?: string;
  errorMessage?: string;
  rawResponse: string;
}

export interface TestRunResult {
  startedAt: string;
  durationMs: number;
  reports: ReportTestResult[];
}
