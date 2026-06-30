import {
  type ConnectorConfig,
  type MultiReport,
  type ReportTestResult,
  type RestStep,
  type WorkflowStep,
  createMultiReport,
  createRestStep,
} from '../types/connector';
import { SENTINEL_PARAM } from '../data/demoTestResults';

// Demo scenario: a connection test that fails because a required interface parameter is missing,
// then goes green once the AI assistant adds it. The fault is PLANTED into the currently-loaded
// blueprint (rather than shipped as a separate broken file): we make one report reference
// {{account_id}} without declaring it. See generateDemoResults for the reactive judge that reads it.

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const TARGET_REPORT_NAME = 'Conversion Events';
const TARGET_ENDPOINT = '/reports/conversions';

// A minimal, realistic report used when the current config has none to plant into.
function seedConversionReport(): MultiReport {
  const report = createMultiReport();
  report.name = TARGET_REPORT_NAME;
  report.steps = [createRestStep()];
  return report;
}

// A passing companion so the seeded-from-empty demo shows a mixed (red + green) first run that then
// turns all-green. Named to match the curated "campaign_performance" baked result.
function seedCampaignReport(): MultiReport {
  const report = createMultiReport();
  report.name = 'Campaign Performance';
  return report;
}

// Inject the {{account_id}} reference into a report's first rest step (creating one if needed) and
// point it at the conversions endpoint. Returns a new report; never mutates the input.
function withSentinelReference(report: MultiReport): MultiReport {
  const steps: WorkflowStep[] = [...report.steps];
  let firstRestIdx = steps.findIndex((s) => s.type === 'rest');
  if (firstRestIdx === -1) {
    steps.unshift(createRestStep());
    firstRestIdx = 0;
  }
  const target = steps[firstRestIdx] as RestStep;
  const queryParams = target.query_params.filter((q) => norm(q.key) !== norm(SENTINEL_PARAM));
  queryParams.push({ id: crypto.randomUUID(), key: SENTINEL_PARAM, value: `{{${SENTINEL_PARAM}}}` });
  steps[firstRestIdx] = {
    ...target,
    name: target.name || 'Fetch Conversions',
    method: 'GET',
    endpoint: TARGET_ENDPOINT,
    query_params: queryParams,
  };
  return {
    ...report,
    // Strip the sentinel from this report's own params too, so the fault is genuine.
    report_parameters: report.report_parameters.filter((p) => norm(p.name) !== norm(SENTINEL_PARAM)),
    steps,
  };
}

// Plant the missing-required-parameter fault into the given config and return a new config.
// Pure — apply the result via applyYamlText(dispatch, configToYaml(plantParamFault(config))).
export function plantParamFault(config: ConnectorConfig): ConnectorConfig {
  let reports = [...config.multi_reports];

  if (reports.length === 0) {
    // Nothing to break — seed a representative blueprint (one passing + one faulty report).
    reports = [seedCampaignReport(), seedConversionReport()];
  }

  // Prefer an existing conversion-ish report; otherwise break the last one.
  let targetIdx = reports.findIndex((r) => norm(r.name) === norm(TARGET_REPORT_NAME));
  if (targetIdx === -1) targetIdx = reports.length - 1;
  reports[targetIdx] = withSentinelReference(reports[targetIdx]);

  return {
    ...config,
    // The fault: the sentinel is referenced but NOT declared as an interface parameter.
    interface_parameters: config.interface_parameters.filter((p) => norm(p.name) !== norm(SENTINEL_PARAM)),
    multi_reports: reports,
  };
}

// Compose the message the "Fix with AI" button sends to the assistant. It embeds the concrete
// failure so the real model can diagnose it against the current YAML (sent alongside by sendMessage).
export function buildFixWithAiMessage(report: ReportTestResult): string {
  const stepLines = report.steps
    .map((s) => `- ${s.method} ${s.url} → ${s.statusCode}`)
    .join('\n');

  return [
    'My blueprint connection test failed and I need help fixing it.',
    '',
    `Failed report: "${report.reportName}"`,
    `Error ${report.errorCode ?? '(no code)'} — ${report.errorMessage ?? 'see raw response.'}`,
    '',
    'Failing request(s):',
    stepLines || '- (no steps captured)',
    '',
    'Please diagnose the root cause from my current configuration and return the corrected blueprint so this report passes.',
  ].join('\n');
}

// Compose one message covering every failed report, so the assistant fixes them all in a single
// corrected blueprint. Falls back to the single-report message when only one report failed.
export function buildFixAllMessage(reports: ReportTestResult[]): string {
  if (reports.length <= 1) return buildFixWithAiMessage(reports[0]);

  const blocks = reports
    .map((report, i) => {
      const steps = report.steps.map((s) => `   - ${s.method} ${s.url} → ${s.statusCode}`).join('\n');
      return [
        `${i + 1}. Report "${report.reportName}"`,
        `   Error ${report.errorCode ?? '(no code)'} — ${report.errorMessage ?? 'see raw response.'}`,
        steps ? `   Failing request(s):\n${steps}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  return [
    `My blueprint connection test failed for ${reports.length} reports and I need help fixing all of them.`,
    '',
    blocks,
    '',
    'Please diagnose the root cause of each failure from my current configuration and return a single corrected blueprint that makes all of these reports pass.',
  ].join('\n');
}
