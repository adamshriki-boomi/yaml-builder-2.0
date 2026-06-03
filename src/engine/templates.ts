import type { ConnectorConfig } from '../types/connector';

export interface Template {
  id: string;
  name: string;
  description: string;
  tags: string[];
  config: ConnectorConfig;
}

export const templates: Template[] = [
  {
    id: 'basic-connector',
    name: 'Basic Connector',
    description: 'Minimal connector configuration with a single GET request in a report',
    tags: ['AUTH'],
    config: {
      connector_name: 'My REST Connector',
      base_url: 'https://api.example.com/v1',
      default_headers: [
        { id: crypto.randomUUID(), name: 'Content-Type', value: 'application/json' },
        { id: crypto.randomUUID(), name: 'Accept', value: 'application/json' },
      ],
      auth: { type: 'bearer' },
      default_retry_strategy: null,
      interface_parameters: [
        {
          id: crypto.randomUUID(),
          name: 'api_token',
          type: 'authentication',
          auth_type: 'bearer',
          is_sensitive: true,
        },
      ],
      variables_metadata: {},
      variables_storages: [],
      pre_run_configurations: [],
      multi_reports: [
        {
          id: crypto.randomUUID(),
          name: 'Fetch Data',
          report_parameters: [],
          steps: [
            {
              id: crypto.randomUUID(),
              type: 'rest',
              name: 'Get Data',
              description: 'Fetch data from the API',
              method: 'GET',
              endpoint: '/data',
              query_params: [],
              headers: [],
              body: '',
              content_type: 'application/json',
              variables_output: [
                {
                  id: crypto.randomUUID(),
                  variable_name: 'response_data',
                  response_location: 'data',
                  variable_format: 'json',
                  transformation_layers: [],
                },
              ],
            },
          ],
        },
      ],
      post_run_configurations: [],
    },
  },
  {
    id: 'cursor-pagination',
    name: 'Cursor Pagination',
    description: 'API connector with cursor-based pagination and token extraction',
    tags: ['PAGINATION', 'AUTH'],
    config: {
      connector_name: 'Paginated API Connector',
      base_url: 'https://api.example.com/v1',
      default_headers: [
        { id: crypto.randomUUID(), name: 'Content-Type', value: 'application/json' },
      ],
      auth: { type: 'bearer' },
      default_retry_strategy: null,
      interface_parameters: [],
      variables_metadata: {},
      variables_storages: [],
      pre_run_configurations: [],
      multi_reports: [
        {
          id: crypto.randomUUID(),
          name: 'Paginated Fetch',
          report_parameters: [],
          steps: [
            {
              id: crypto.randomUUID(),
              type: 'rest',
              name: 'Fetch Paginated Data',
              description: 'Fetch all pages of data using cursor-based pagination',
              method: 'GET',
              endpoint: '/items',
              query_params: [],
              headers: [],
              body: '',
              content_type: 'application/json',
              pagination: {
                type: 'cursor',
                page_param_name: '',
                page_size_param_name: '',
                start_value: 0,
                increment: 0,
                parameter_location: 'query',
                token_path: '$.links.next',
                total_items_path: '',
                break_conditions: [
                  { id: crypto.randomUUID(), type: 'empty_response', key: '', value: '' },
                ],
              },
              variables_output: [
                {
                  id: crypto.randomUUID(),
                  variable_name: 'items',
                  response_location: 'data',
                  variable_format: 'json',
                  transformation_layers: [],
                },
              ],
            },
          ],
        },
      ],
      post_run_configurations: [],
    },
  },
  {
    id: 'external-variables-loop',
    name: 'External Variables Loop',
    description: 'Loop through external variables to process items from a source river',
    tags: ['AUTH'],
    config: {
      connector_name: 'External Variables Connector',
      base_url: 'https://api.example.com/v1',
      default_headers: [
        { id: crypto.randomUUID(), name: 'Content-Type', value: 'application/json' },
      ],
      auth: { type: 'bearer' },
      default_retry_strategy: null,
      interface_parameters: [],
      variables_metadata: {},
      variables_storages: [],
      pre_run_configurations: [],
      multi_reports: [
        {
          id: crypto.randomUUID(),
          name: 'Items Processing',
          report_parameters: [],
          steps: [
            {
              id: crypto.randomUUID(),
              type: 'rest',
              name: 'Get Items List',
              description: 'Fetch a list of items to iterate over',
              method: 'GET',
              endpoint: '/items',
              query_params: [],
              headers: [],
              body: '',
              content_type: 'application/json',
              variables_output: [
                {
                  id: crypto.randomUUID(),
                  variable_name: 'items_list',
                  response_location: 'data',
                  variable_format: 'json',
                  transformation_layers: [],
                },
              ],
            },
            {
              id: crypto.randomUUID(),
              type: 'loop',
              name: 'Process Each Item',
              description: 'Iterate over items and fetch details for each',
              loop_type: 'data',
              items_path: 'items_list',
              item_name: 'current_item',
              include_in_output: true,
              ignore_errors: false,
              nested_steps: [
                {
                  id: crypto.randomUUID(),
                  type: 'rest',
                  name: 'Get Item Details',
                  description: 'Fetch details for the current item',
                  method: 'GET',
                  endpoint: '/items/{{%current_item%}}',
                  query_params: [],
                  headers: [],
                  body: '',
                  content_type: 'application/json',
                  variables_output: [
                    {
                      id: crypto.randomUUID(),
                      variable_name: 'item_details',
                      response_location: 'data',
                      variable_format: 'json',
                      transformation_layers: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      post_run_configurations: [],
    },
  },
  {
    id: 'multi-report-blueprint',
    name: 'Multi-Report Blueprint',
    description: 'Full PRD-style multi-report blueprint with pre-run, multiple reports, and post-run',
    tags: ['MULTI-REPORT', 'AUTH', 'PAGINATION'],
    config: {
      connector_name: 'My Multi-Report Connector',
      base_url: 'https://api.example.com',
      default_headers: [
        { id: crypto.randomUUID(), name: 'Content-Type', value: 'application/json' },
      ],
      auth: { type: 'bearer' },
      default_retry_strategy: null,
      interface_parameters: [
        {
          id: crypto.randomUUID(),
          name: 'connectToAPI',
          type: 'authentication',
          auth_type: 'bearer',
        },
        {
          id: crypto.randomUUID(),
          name: 'date_range',
          label: 'Time Period (date_range)',
          type: 'date_range',
        },
        {
          id: crypto.randomUUID(),
          name: 'account_ids',
          label: "Account ID's (account_ids)",
          type: 'multiselect',
          required: true,
          dynamic_source: {
            type: 'variable',
            variable_name: 'discovered_accounts',
            populate_on: 'mount',
            allow_manual_refresh: true,
          },
        },
      ],
      variables_metadata: {
        accounts_raw: {
          format: 'json',
          storage_name: 'results_dir',
        },
        report1_raw: {
          format: 'json',
          storage_name: 'results_dir',
        },
      },
      variables_storages: [
        { id: crypto.randomUUID(), name: 'results_dir', type: 'file_system' },
      ],
      pre_run_configurations: [
        {
          id: crypto.randomUUID(),
          name: 'Init Data',
          steps: [
            {
              id: crypto.randomUUID(),
              type: 'rest',
              name: 'Fetch Accounts',
              description: 'Discover available accounts',
              method: 'GET',
              endpoint: '/accounts',
              query_params: [],
              headers: [],
              body: '',
              content_type: 'application/json',
              variables_output: [
                {
                  id: crypto.randomUUID(),
                  variable_name: 'discovered_accounts',
                  response_location: 'data',
                  variable_format: 'json',
                  transformation_layers: [
                    {
                      id: crypto.randomUUID(),
                      type: 'extract_json',
                      json_path: '$.data[*]',
                      from_type: 'json',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      multi_reports: [
        {
          id: crypto.randomUUID(),
          name: 'Campaign Performance',
          report_parameters: [
            {
              id: crypto.randomUUID(),
              name: 'date_range',
              type: 'string',
              default: 'last_14_days',
            },
          ],
          steps: [
            {
              id: crypto.randomUUID(),
              type: 'rest',
              name: 'Fetch Campaign Data',
              description: 'Retrieve campaign performance metrics',
              method: 'GET',
              endpoint: '/reports/campaigns',
              query_params: [],
              headers: [],
              body: '',
              content_type: 'application/json',
              pagination: {
                type: 'offset',
                page_param_name: 'offset',
                page_size_param_name: 'limit',
                start_value: 0,
                increment: 200,
                parameter_location: 'query',
                token_path: '',
                total_items_path: '',
                break_conditions: [],
              },
              variables_output: [
                {
                  id: crypto.randomUUID(),
                  variable_name: 'campaign_data',
                  response_location: 'data',
                  variable_format: 'json',
                  transformation_layers: [],
                },
              ],
            },
          ],
        },
        {
          id: crypto.randomUUID(),
          name: 'Ad Group Stats',
          report_parameters: [],
          steps: [
            {
              id: crypto.randomUUID(),
              type: 'rest',
              name: 'Fetch Ad Groups',
              description: 'Retrieve ad group statistics',
              method: 'POST',
              endpoint: '/reports/ad-groups',
              query_params: [],
              headers: [],
              body: '{"filters": {"status": "active"}}',
              content_type: 'application/json',
              variables_output: [
                {
                  id: crypto.randomUUID(),
                  variable_name: 'adgroup_data',
                  response_location: 'data',
                  variable_format: 'json',
                  transformation_layers: [],
                },
              ],
            },
          ],
        },
        {
          id: crypto.randomUUID(),
          name: 'Keyword Analysis',
          report_parameters: [
            {
              id: crypto.randomUUID(),
              name: 'min_impressions',
              type: 'string',
              default: '100',
            },
          ],
          steps: [
            {
              id: crypto.randomUUID(),
              type: 'rest',
              name: 'Fetch Keywords',
              description: 'Retrieve keyword performance data',
              method: 'GET',
              endpoint: '/reports/keywords',
              query_params: [],
              headers: [],
              body: '',
              content_type: 'application/json',
              variables_output: [
                {
                  id: crypto.randomUUID(),
                  variable_name: 'keyword_data',
                  response_location: 'data',
                  variable_format: 'json',
                  transformation_layers: [
                    {
                      id: crypto.randomUUID(),
                      type: 'extract_json',
                      json_path: '$.keywords[*]',
                      from_type: 'json',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: crypto.randomUUID(),
          name: 'Audience Insights',
          report_parameters: [],
          steps: [
            {
              id: crypto.randomUUID(),
              type: 'rest',
              name: 'Fetch Audiences',
              description: 'Retrieve audience segments and sizes',
              method: 'GET',
              endpoint: '/reports/audiences',
              query_params: [],
              headers: [],
              body: '',
              content_type: 'application/json',
              variables_output: [
                {
                  id: crypto.randomUUID(),
                  variable_name: 'audience_data',
                  response_location: 'data',
                  variable_format: 'json',
                  transformation_layers: [],
                },
              ],
            },
          ],
        },
        {
          id: crypto.randomUUID(),
          name: 'Conversion Events',
          report_parameters: [],
          steps: [
            {
              id: crypto.randomUUID(),
              type: 'rest',
              name: 'Fetch Conversions',
              description: 'Retrieve conversion event records',
              method: 'GET',
              endpoint: '/reports/conversions',
              query_params: [],
              headers: [],
              body: '',
              content_type: 'application/json',
              variables_output: [
                {
                  id: crypto.randomUUID(),
                  variable_name: 'conversion_data',
                  response_location: 'data',
                  variable_format: 'json',
                  transformation_layers: [],
                },
              ],
            },
          ],
        },
      ],
      post_run_configurations: [
        {
          id: crypto.randomUUID(),
          name: 'Finalize',
          steps: [
            {
              id: crypto.randomUUID(),
              type: 'rest',
              name: 'Log Run Summary',
              description: 'Log the run summary',
              method: 'POST',
              endpoint: '/internal/log',
              query_params: [],
              headers: [],
              body: '',
              content_type: 'application/json',
              variables_output: [],
            },
          ],
        },
      ],
    },
  },
];
