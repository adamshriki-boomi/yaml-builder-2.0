import { ExBadge, ExButton, BadgeColor, BadgeShape, BadgeSize, ButtonType, ButtonFlavor } from '@boomi/exosphere';

interface UserStory {
  id: string;
  story: string;
  acceptance: string[];
}

interface Epic {
  id: number;
  name: string;
  description: string;
  color: BadgeColor;
  stories: UserStory[];
}

const epics: Epic[] = [
  {
    id: 1,
    name: 'Connector Configuration',
    description: 'Core connector setup including name, base URL, headers, and authentication',
    color: BadgeColor.BLUE,
    stories: [
      {
        id: 'US-1.1',
        story: 'As a user, I want to name my connector and set a base URL so I can identify and configure my API connection.',
        acceptance: [
          'Connector name field is visible and editable',
          'Base URL field accepts valid URLs',
          'Changes reflect immediately in the YAML output',
        ],
      },
      {
        id: 'US-1.2',
        story: 'As a user, I want to add default headers so every request includes necessary headers like Content-Type and Authorization.',
        acceptance: [
          'Can add multiple key-value header pairs',
          'Can edit existing headers inline',
          'Can delete individual headers',
          'Headers appear in the generated YAML',
        ],
      },
      {
        id: 'US-1.3',
        story: 'As a user, I want to configure authentication (Bearer Token, Basic HTTP, API Key, OAuth 2.0) so my API calls are authorized.',
        acceptance: [
          'Auth type dropdown with all 4 options',
          'Selecting auth type shows relevant sub-fields',
          'Auth configuration generates correct YAML structure',
        ],
      },
      {
        id: 'US-1.4',
        story: 'As a user, I want to set OAuth 2.0 details (grant type, token URL, refresh token, Base64 encoding) for OAuth-protected APIs.',
        acceptance: [
          'OAuth section appears only when auth type is OAuth 2.0',
          'Grant type options: Authorization Code, Client Credentials',
          'Token URL and Refresh Token fields',
          'Base64 encoding toggle',
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Interface Parameters',
    description: 'Input parameters that users of the connector will need to provide',
    color: BadgeColor.GREEN,
    stories: [
      {
        id: 'US-2.1',
        story: 'As a user, I want to define input parameters (string, auth, date_range, list) so users of my connector know what to provide.',
        acceptance: [
          'Can add new parameters with a name and type',
          'Parameter type options: String, Authentication, Date Range, List',
          'Parameters list shows all defined parameters',
        ],
      },
      {
        id: 'US-2.2',
        story: 'As a user, I want to mark parameters as sensitive/encrypted for secure credential handling.',
        acceptance: [
          'Toggle for sensitive/encrypted flag per parameter',
          'Sensitive parameters generate is_sensitive: true in YAML',
        ],
      },
      {
        id: 'US-2.3',
        story: 'As a user, I want to map parameters to different field names for flexibility.',
        acceptance: [
          'Optional "Map To" field per parameter',
          'Mapping generates map_to field in YAML output',
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'Variables & Storage',
    description: 'Configuration for how pipeline variables are stored and formatted',
    color: BadgeColor.YELLOW,
    stories: [
      {
        id: 'US-3.1',
        story: 'As a user, I want to configure where variables are stored (file system vs. memory) to control data persistence.',
        acceptance: [
          'Storage type dropdown: File System, Memory',
          'Results directory field for file system storage',
        ],
      },
      {
        id: 'US-3.2',
        story: 'As a user, I want to define the data format for stored variables.',
        acceptance: [
          'Data format selection: JSON, Text',
          'Format choice reflected in YAML output',
        ],
      },
    ],
  },
  {
    id: 4,
    name: 'Workflow Steps',
    description: 'Building the data pipeline with REST API calls and loop iterations',
    color: BadgeColor.NAVY,
    stories: [
      {
        id: 'US-4.1',
        story: 'As a user, I want to add REST steps to make API calls with configurable method, URL, headers, params, and body.',
        acceptance: [
          'REST step form with Method (GET/POST/PUT/DELETE/PATCH)',
          'Endpoint URL field with variable placeholder support',
          'Query parameters, headers, and request body sections',
          'Content-Type configuration for POST/PUT/PATCH',
        ],
      },
      {
        id: 'US-4.2',
        story: 'As a user, I want to add Loop steps to iterate over data arrays from previous steps.',
        acceptance: [
          'Loop step with name, type, items path, and item name',
          'Loop type options: Data, External Variables',
          'Include in output and Ignore errors toggles',
        ],
      },
      {
        id: 'US-4.3',
        story: 'As a user, I want to nest REST steps inside loops to call APIs for each item in the iteration.',
        acceptance: [
          'Loop steps contain nested REST step forms',
          'Can add multiple nested steps',
          'Nested steps can reference loop item via {{%item_name%}}',
        ],
      },
      {
        id: 'US-4.4',
        story: 'As a user, I want to reorder, duplicate, and delete steps to organize my workflow.',
        acceptance: [
          'Move up/down buttons on each step',
          'Delete button with immediate removal',
          'Step order reflected in YAML output',
        ],
      },
      {
        id: 'US-4.5',
        story: 'As a user, I want to add descriptions to steps for documentation purposes.',
        acceptance: [
          'Description field on each step',
          'Description included in YAML when provided',
        ],
      },
    ],
  },
  {
    id: 5,
    name: 'Pagination',
    description: 'Handling paginated API responses with various strategies',
    color: BadgeColor.ORANGE,
    stories: [
      {
        id: 'US-5.1',
        story: 'As a user, I want to configure page-based pagination (page number, page size) for APIs that use page numbers.',
        acceptance: [
          'Page parameter name and size parameter name fields',
          'Start value and increment configuration',
          'Parameter location: Query, Headers, or Body',
        ],
      },
      {
        id: 'US-5.2',
        story: 'As a user, I want to configure offset-based pagination for APIs that use skip/limit.',
        acceptance: [
          'Offset pagination type option',
          'Same parameter fields as page-based',
        ],
      },
      {
        id: 'US-5.3',
        story: 'As a user, I want to configure cursor-based pagination (next token) for APIs that use continuation tokens.',
        acceptance: [
          'Cursor pagination type option',
          'Token path field (JSON path to next cursor)',
        ],
      },
      {
        id: 'US-5.4',
        story: 'As a user, I want to define break conditions to stop pagination when criteria are met.',
        acceptance: [
          'Break condition types: Empty Response, Page Size Mismatch, Total Items Reached, Boolean Field',
          'Can add multiple break conditions',
          'Key field for condition evaluation',
        ],
      },
    ],
  },
  {
    id: 6,
    name: 'Retry & Error Handling',
    description: 'Automatic retry strategies for handling API failures',
    color: BadgeColor.RED,
    stories: [
      {
        id: 'US-6.1',
        story: 'As a user, I want to add retry strategies with configurable status codes, attempts, and intervals.',
        acceptance: [
          'Enable/disable retry per step',
          'Status codes field (comma-separated)',
          'Max attempts and interval (seconds) fields',
        ],
      },
      {
        id: 'US-6.2',
        story: 'As a user, I want loop steps to optionally ignore errors and continue processing remaining items.',
        acceptance: [
          'Ignore errors toggle on loop steps',
          'When enabled, generates ignore_errors: true in YAML',
        ],
      },
    ],
  },
  {
    id: 7,
    name: 'Variable Outputs',
    description: 'Extracting and storing data from API responses',
    color: BadgeColor.GREEN,
    stories: [
      {
        id: 'US-7.1',
        story: 'As a user, I want to extract data from API responses using JSON path expressions.',
        acceptance: [
          'JSON path field with placeholder examples',
          'Supports standard JSON path syntax ($.data.users)',
        ],
      },
      {
        id: 'US-7.2',
        story: 'As a user, I want to store extracted data as variables for use in later steps.',
        acceptance: [
          'Variable name field',
          'Variables available via {{%variable_name%}} in subsequent steps',
        ],
      },
      {
        id: 'US-7.3',
        story: 'As a user, I want to choose response location (data, headers, status) and format (JSON, text).',
        acceptance: [
          'Response location dropdown: Data, Headers, Status',
          'Format dropdown: JSON, Text',
          'Both fields generate correct YAML structure',
        ],
      },
    ],
  },
  {
    id: 8,
    name: 'YAML Editor',
    description: 'Live YAML preview with bidirectional editing',
    color: BadgeColor.BLUE,
    stories: [
      {
        id: 'US-8.1',
        story: 'As a user, I want to see a live YAML preview that updates automatically as I configure the UI forms.',
        acceptance: [
          'YAML panel shows generated configuration',
          'Updates in real-time when form fields change',
        ],
      },
      {
        id: 'US-8.2',
        story: 'As a user, I want to edit YAML directly and have changes sync back to the UI forms.',
        acceptance: [
          'YAML editor is editable',
          'Changes sync to UI after a 1-second debounce',
          'Invalid YAML shows an error banner without corrupting UI state',
        ],
      },
      {
        id: 'US-8.3',
        story: 'As a user, I want to copy the generated YAML to clipboard with one click.',
        acceptance: [
          'Copy YAML button in editor header',
          'Copies full YAML text to clipboard',
          'Success feedback after copy',
        ],
      },
      {
        id: 'US-8.4',
        story: 'As a user, I want to paste existing YAML into the editor and have it populate the UI forms.',
        acceptance: [
          'Pasting YAML into editor triggers parsing',
          'Valid YAML populates all corresponding form fields',
          'Invalid YAML shows error without breaking the app',
        ],
      },
      {
        id: 'US-8.5',
        story: 'As a user, I want syntax highlighting and error indicators in the YAML editor.',
        acceptance: [
          'YAML syntax highlighting with proper colors',
          'Line numbers visible',
          'Error banner when YAML is invalid',
        ],
      },
      {
        id: 'US-8.6',
        story: 'As a user, I want to show/hide the YAML panel to maximize form space when needed.',
        acceptance: [
          'Toggle button in header to show/hide YAML panel',
          'Form area expands to full width when panel is hidden',
        ],
      },
    ],
  },
  {
    id: 9,
    name: 'Templates',
    description: 'Pre-built configurations for common integration patterns',
    color: BadgeColor.NAVY,
    stories: [
      {
        id: 'US-9.1',
        story: 'As a user, I want to select from pre-built templates to start configuring quickly.',
        acceptance: [
          'Templates button opens selection dialog',
          'Templates: Basic Connector, Cursor Pagination, External Variables Loop',
          'Selecting a template populates all fields',
        ],
      },
      {
        id: 'US-9.2',
        story: 'As a user, I want a warning before a template replaces my current configuration.',
        acceptance: [
          'Warning message visible in template dialog',
          'Cancel option available',
        ],
      },
    ],
  },
  {
    id: 10,
    name: 'UX & Responsiveness',
    description: 'Ensuring a great experience inside a drawer and across viewports',
    color: BadgeColor.GRAY,
    stories: [
      {
        id: 'US-10.1',
        story: 'As a user, I want the app to work well inside a drawer (~800px+ wide) in another application.',
        acceptance: [
          'All content accessible at 800px width',
          'No horizontal overflow',
          'Tab navigation works within drawer constraints',
        ],
      },
      {
        id: 'US-10.2',
        story: 'As a user, I want contextual help text and tooltips to understand each field without external documentation.',
        acceptance: [
          'Placeholder text with examples on all fields',
          'Help text on complex configurations',
        ],
      },
      {
        id: 'US-10.3',
        story: 'As a user, I want inline validation with clear error messages.',
        acceptance: [
          'YAML validation errors shown inline',
          'Error banner in YAML editor for parse failures',
        ],
      },
      {
        id: 'US-10.4',
        story: 'As a user, I want success/error toasts for actions like copy and template loading.',
        acceptance: [
          'Toast notification on successful copy',
          'Toast on template load',
          'Error toast on copy failure',
        ],
      },
    ],
  },
  {
    id: 11,
    name: 'Multi-Reports',
    description: 'Support for multiple independent report definitions within a single blueprint',
    color: BadgeColor.BLUE,
    stories: [
      {
        id: 'US-11.1',
        story: 'As a user, I want to add multiple reports to a single blueprint so each report can independently fetch data from different API endpoints.',
        acceptance: [
          'Can add new multi-reports via the Workflow Steps tab',
          'Each report has its own name, parameters, and steps',
          'Reports appear as expandable/collapsible cards',
        ],
      },
      {
        id: 'US-11.2',
        story: 'As a user, I want to define report-specific parameters (name, type, default) so each report can be independently configured.',
        acceptance: [
          'Report parameters section within each report card',
          'Can add/edit/remove report parameters',
          'Parameters generate correct YAML under report_parameters',
        ],
      },
      {
        id: 'US-11.3',
        story: 'As a user, I want to add REST and Loop steps within each report to define the report workflow.',
        acceptance: [
          'Each report has its own step list with REST and Loop step support',
          'Steps within a report are independent from other reports',
          'Steps generate under multi-reports[].steps in YAML',
        ],
      },
      {
        id: 'US-11.4',
        story: 'As a user, I want to duplicate and delete reports for faster configuration.',
        acceptance: [
          'Duplicate button creates a copy of the report with all parameters and steps',
          'Delete button removes the report entirely',
          'YAML updates immediately on add/duplicate/delete',
        ],
      },
    ],
  },
  {
    id: 12,
    name: 'Pre/Post Run Configurations',
    description: 'Initialization and cleanup steps that run before and after the main reports',
    color: BadgeColor.ORANGE,
    stories: [
      {
        id: 'US-12.1',
        story: 'As a user, I want to define pre-run configuration groups with steps that run before the main reports for data discovery and initialization.',
        acceptance: [
          'Pre-Run Configurations section in Workflow Steps tab',
          'Can add configuration groups with names and steps',
          'Generates pre_run_configurations in YAML',
        ],
      },
      {
        id: 'US-12.2',
        story: 'As a user, I want to define post-run configuration groups with steps that run after all reports complete for cleanup and finalization.',
        acceptance: [
          'Post-Run Configurations section in Workflow Steps tab',
          'Can add configuration groups with names and steps',
          'Generates post_run_configurations in YAML',
        ],
      },
      {
        id: 'US-12.3',
        story: 'As a user, I want pre-run steps to output variables that can be referenced by multi-reports.',
        acceptance: [
          'Pre-run steps can define variable outputs',
          'Variable names from pre-run are available for use in report steps',
        ],
      },
    ],
  },
  {
    id: 13,
    name: 'Transformation Layers',
    description: 'Data transformation pipelines applied to variable outputs',
    color: BadgeColor.GREEN,
    stories: [
      {
        id: 'US-13.1',
        story: 'As a user, I want to add transformation layers to variable outputs to process API response data before storing it.',
        acceptance: [
          'Transformation layers section on each variable output',
          'Can add multiple transformation layers in sequence',
          'Layers generate under transformation_layers in YAML',
        ],
      },
      {
        id: 'US-13.2',
        story: 'As a user, I want to configure transformation types (extract_json, flatten, filter, map) with JSON path and type parameters.',
        acceptance: [
          'Type dropdown with extract_json, flatten, filter, map options',
          'JSON path field for extraction path',
          'From type field to specify source data format',
          'Optional depth parameter for nested transforms',
        ],
      },
    ],
  },
  {
    id: 14,
    name: 'Variables Metadata & Storages',
    description: 'Configuration for variable storage backends and metadata mappings',
    color: BadgeColor.YELLOW,
    stories: [
      {
        id: 'US-14.1',
        story: 'As a user, I want to define variable storages (name + type) so the connector knows where to persist pipeline data.',
        acceptance: [
          'Variables Storages section in Connector Configuration tab',
          'Can add storage entries with name and type (file_system, memory)',
          'Generates variables_storages array in connector YAML',
        ],
      },
      {
        id: 'US-14.2',
        story: 'As a user, I want to map variable names to metadata entries (format + storage_name) for each pipeline variable.',
        acceptance: [
          'Variables Metadata section in Connector Configuration tab',
          'Key-value editor: variable_name maps to {format, storage_name}',
          'Generates variables_metadata map in connector YAML',
        ],
      },
      {
        id: 'US-14.3',
        story: 'As a user, I want a default retry strategy on the connector level that applies to all steps unless overridden.',
        acceptance: [
          'Default Retry Strategy section in Connector Configuration',
          'Can enable/disable with status codes, attempts, and interval fields',
          'Generates default_retry_strategy in connector YAML',
        ],
      },
    ],
  },
];

interface Props {
  onBack: () => void;
}

export default function UserStoriesPage({ onBack }: Props) {
  const totalStories = epics.reduce((sum, epic) => sum + epic.stories.length, 0);

  const epicAccentToken = (color: BadgeColor): string => {
    switch (color) {
      case BadgeColor.BLUE: return 'var(--exo-color-border-tertiary)';
      case BadgeColor.GREEN: return 'var(--exo-color-background-success-strong)';
      case BadgeColor.RED: return 'var(--exo-color-border-danger-strong)';
      case BadgeColor.YELLOW: return 'var(--exo-color-background-warning-strong)';
      default: return 'var(--exo-color-border)';
    }
  };

  return (
    <div className="app-shell">
      <div className="app-header">
        <div className="app-header-left">
          <ExButton type={ButtonType.TERTIARY} flavor={ButtonFlavor.BASE} onClick={onBack}>
            Back to Builder
          </ExButton>
          <span className="user-stories-title">User Stories</span>
          <ExBadge color={BadgeColor.BLUE} shape={BadgeShape.ROUND}>
            {totalStories} stories
          </ExBadge>
        </div>
      </div>

      <div className="user-stories-page">
        <div className="user-stories-container">
          <p className="user-stories-intro">
            These user stories define the complete feature set of the Boomi Data Integration YAML Builder.
            Each story is organized by epic and includes acceptance criteria for verification.
          </p>

          {epics.map(epic => (
            <div key={epic.id} className="user-stories-epic">
              <div className="user-stories-epic-header">
                <ExBadge color={epic.color} shape={BadgeShape.ROUND}>
                  Epic {epic.id}
                </ExBadge>
                <div>
                  <div className="user-stories-epic-name">{epic.name}</div>
                  <div className="user-stories-epic-desc">
                    {epic.description}
                  </div>
                </div>
              </div>

              {epic.stories.map(story => (
                <div
                  key={story.id}
                  className="user-stories-story"
                  style={{ borderLeftColor: epicAccentToken(epic.color) }}
                >
                  <div className="user-stories-story-head">
                    <ExBadge color={BadgeColor.GRAY} shape={BadgeShape.SQUARED} size={BadgeSize.SMALL}>
                      {story.id}
                    </ExBadge>
                    <div className="user-stories-story-text">
                      {story.story}
                    </div>
                  </div>

                  <div className="user-stories-criteria">
                    <div className="user-stories-criteria-label">
                      Acceptance Criteria:
                    </div>
                    <ul className="user-stories-criteria-list">
                      {story.acceptance.map((criteria, idx) => (
                        <li key={idx}>{criteria}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
