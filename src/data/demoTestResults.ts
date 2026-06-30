import type {
  ConnectorConfig,
  MultiReport,
  ReportTestResult,
  RestStep,
  StepResult,
  TestRunResult,
  WorkflowStep,
} from '../types/connector';

// The one parameter the reactive demo judge keys on. A report that references {{account_id}} but
// has no matching interface/report parameter fails; declaring it (the AI fix) turns the report green.
// Kept deliberately narrow so the judge never false-fails the user's own pre-existing configs.
export const SENTINEL_PARAM = 'account_id';

interface BakedReport {
  status: 'passed' | 'failed';
  recordsReturned: number;
  durationMs: number;
  steps: StepResult[];
  sampleColumns?: string[];
  sampleData?: Array<Record<string, unknown>>;
  errorCode?: string;
  errorMessage?: string;
  rawResponse: string;
}

const baked: Record<string, BakedReport> = {
  campaign_performance: {
    status: 'passed',
    recordsReturned: 47,
    durationMs: 1240,
    steps: [
      { method: 'GET', url: '/reports/campaigns?offset=0&limit=200', statusCode: 200, durationMs: 612 },
      { method: 'GET', url: '/reports/campaigns?offset=200&limit=200', statusCode: 200, durationMs: 587 },
    ],
    sampleColumns: ['campaign_id', 'name', 'impressions', 'clicks', 'ctr'],
    sampleData: [
      { campaign_id: 'c_8401', name: 'Spring Launch', impressions: 124_038, clicks: 4_217, ctr: '3.40%' },
      { campaign_id: 'c_8402', name: 'Brand Awareness', impressions: 98_410, clicks: 2_109, ctr: '2.14%' },
      { campaign_id: 'c_8403', name: 'Retargeting · Q2', impressions: 56_204, clicks: 2_368, ctr: '4.21%' },
    ],
    rawResponse: JSON.stringify({
      status: 200,
      data: [
        { campaign_id: 'c_8401', name: 'Spring Launch', impressions: 124038, clicks: 4217, ctr: 0.034 },
        { campaign_id: 'c_8402', name: 'Brand Awareness', impressions: 98410, clicks: 2109, ctr: 0.0214 },
        { campaign_id: 'c_8403', name: 'Retargeting · Q2', impressions: 56204, clicks: 2368, ctr: 0.0421 },
      ],
      meta: { total: 47, page: 1, page_size: 200 },
    }, null, 2),
  },
  ad_group_stats: {
    status: 'passed',
    recordsReturned: 23,
    durationMs: 612,
    steps: [
      { method: 'POST', url: '/reports/ad-groups', statusCode: 200, durationMs: 612 },
    ],
    sampleColumns: ['group_id', 'group_name', 'status', 'ad_count'],
    sampleData: [
      { group_id: 'ag_5523', group_name: 'Top Performers', status: 'active', ad_count: 14 },
      { group_id: 'ag_5524', group_name: 'A/B Test · Headlines', status: 'active', ad_count: 6 },
      { group_id: 'ag_5525', group_name: 'Paused — review', status: 'paused', ad_count: 9 },
    ],
    rawResponse: JSON.stringify({
      status: 200,
      data: [
        { group_id: 'ag_5523', group_name: 'Top Performers', status: 'active', ad_count: 14 },
        { group_id: 'ag_5524', group_name: 'A/B Test · Headlines', status: 'active', ad_count: 6 },
      ],
      meta: { total: 23, page: 1 },
    }, null, 2),
  },
  keyword_analysis: {
    status: 'passed',
    recordsReturned: 156,
    durationMs: 2104,
    steps: [
      { method: 'GET', url: '/reports/keywords?page=1', statusCode: 200, durationMs: 624 },
      { method: 'GET', url: '/reports/keywords?page=2', statusCode: 200, durationMs: 481 },
      { method: 'GET', url: '/reports/keywords?page=3', statusCode: 200, durationMs: 511 },
      { method: 'GET', url: '/reports/keywords?page=4', statusCode: 200, durationMs: 488 },
    ],
    sampleColumns: ['keyword', 'impressions', 'ctr', 'avg_position'],
    sampleData: [
      { keyword: 'boomi connector', impressions: 4_231, ctr: '3.40%', avg_position: 1.8 },
      { keyword: 'integration platform', impressions: 2_108, ctr: '2.94%', avg_position: 2.5 },
      { keyword: 'yaml builder', impressions: 1_567, ctr: '4.21%', avg_position: 1.2 },
    ],
    rawResponse: JSON.stringify({
      status: 200,
      data: [
        { keyword: 'boomi connector', impressions: 4231, clicks: 143, ctr: 0.0340, avg_position: 1.8 },
        { keyword: 'integration platform', impressions: 2108, clicks: 62, ctr: 0.0294, avg_position: 2.5 },
        { keyword: 'yaml builder', impressions: 1567, clicks: 66, ctr: 0.0421, avg_position: 1.2 },
      ],
      meta: { total: 156, pages: 4 },
    }, null, 2),
  },
  audience_insights: {
    status: 'passed',
    recordsReturned: 8,
    durationMs: 418,
    steps: [
      { method: 'GET', url: '/reports/audiences', statusCode: 200, durationMs: 418 },
    ],
    sampleColumns: ['audience_id', 'name', 'size', 'match_type'],
    sampleData: [
      { audience_id: 'aud_1001', name: 'Lookalike · 1%', size: 2_400_000, match_type: 'similarity' },
      { audience_id: 'aud_1002', name: 'Cart abandoners · 30d', size: 84_120, match_type: 'remarketing' },
      { audience_id: 'aud_1003', name: 'Newsletter subs', size: 18_400, match_type: 'customer_list' },
    ],
    rawResponse: JSON.stringify({
      status: 200,
      data: [
        { audience_id: 'aud_1001', name: 'Lookalike · 1%', size: 2400000, match_type: 'similarity' },
        { audience_id: 'aud_1002', name: 'Cart abandoners · 30d', size: 84120, match_type: 'remarketing' },
      ],
      meta: { total: 8 },
    }, null, 2),
  },
  // Passing baseline for the conversion report. It only fails when the reactive judge detects the
  // planted missing-parameter fault (see generateDemoResults); once the AI fix declares account_id,
  // it falls through to this passing result.
  conversion_events: {
    status: 'passed',
    recordsReturned: 31,
    durationMs: 1180,
    steps: [
      { method: 'GET', url: '/reports/conversions?account_id=acct_4821&offset=0&limit=200', statusCode: 200, durationMs: 598 },
      { method: 'GET', url: '/reports/conversions?account_id=acct_4821&offset=200&limit=200', statusCode: 200, durationMs: 582 },
    ],
    sampleColumns: ['conversion_id', 'event_name', 'conversions', 'value', 'occurred_at'],
    sampleData: [
      { conversion_id: 'cv_3301', event_name: 'purchase', conversions: 184, value: '$12,480.00', occurred_at: '2026-06-21' },
      { conversion_id: 'cv_3302', event_name: 'signup', conversions: 412, value: '$0.00', occurred_at: '2026-06-21' },
      { conversion_id: 'cv_3303', event_name: 'add_to_cart', conversions: 1_027, value: '$0.00', occurred_at: '2026-06-22' },
    ],
    rawResponse: JSON.stringify({
      status: 200,
      data: [
        { conversion_id: 'cv_3301', event_name: 'purchase', conversions: 184, value: 12480.0, occurred_at: '2026-06-21' },
        { conversion_id: 'cv_3302', event_name: 'signup', conversions: 412, value: 0, occurred_at: '2026-06-21' },
        { conversion_id: 'cv_3303', event_name: 'add_to_cart', conversions: 1027, value: 0, occurred_at: '2026-06-22' },
      ],
      meta: { total: 31, account_id: 'acct_4821', page: 1, page_size: 200 },
    }, null, 2),
  },
};

function toKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function genericPassing(reportName: string, index: number): BakedReport {
  return {
    status: 'passed',
    recordsReturned: 12 + index * 7,
    durationMs: 700 + index * 120,
    steps: [
      { method: 'GET', url: `/api/${toKey(reportName)}`, statusCode: 200, durationMs: 700 + index * 120 },
    ],
    sampleColumns: ['id', 'name', 'value'],
    sampleData: [
      { id: index * 100 + 1, name: `${reportName} item 1`, value: 'sample' },
      { id: index * 100 + 2, name: `${reportName} item 2`, value: 'sample' },
      { id: index * 100 + 3, name: `${reportName} item 3`, value: 'sample' },
    ],
    rawResponse: JSON.stringify({
      status: 200,
      data: [
        { id: index * 100 + 1, name: `${reportName} item 1`, value: 'sample' },
      ],
      meta: { total: 12 + index * 7 },
    }, null, 2),
  };
}

// The reactive failure: a report references {{account_id}} but the blueprint declares no such
// required parameter, so the request can't be built. Naming the missing parameter in the error is
// realistic (real APIs do this) and gives the assistant a clear lead to diagnose and fix.
function missingParamFailure(reportName: string, paramName: string): BakedReport {
  return {
    status: 'failed',
    recordsReturned: 0,
    durationMs: 740,
    steps: [
      { method: 'GET', url: `/reports/conversions?${paramName}=`, statusCode: 400, durationMs: 740 },
    ],
    errorCode: 'RVR-ERR-014',
    errorMessage:
      `Report "${reportName}" failed: required parameter "${paramName}" is missing. The request to ` +
      `GET /reports/conversions could not be built because the blueprint has no interface parameter ` +
      `named "${paramName}" to supply it.`,
    rawResponse: JSON.stringify({
      status: 400,
      report: reportName,
      message:
        `Action Failed. reason: [RVR-ERR-014]: Connector errors: Missing required parameter "${paramName}". ` +
        `The request template references {{${paramName}}} but no value was provided.`,
      data: [],
    }, null, 2),
  };
}

// Collect the rest steps of a report, flattening one level of loop nesting.
function restStepsOf(report: MultiReport): RestStep[] {
  const out: RestStep[] = [];
  const visit = (steps: WorkflowStep[]) => {
    for (const step of steps) {
      if (step.type === 'rest') out.push(step);
      else if (step.type === 'loop') out.push(...step.nested_steps);
    }
  };
  visit(report.steps);
  return out;
}

// Pull {{token}} references out of one rest step's text fields. The [^%] first-char guard skips
// loop item refs like {{%current_item%}}; \s* tolerates spacing like {{ account_id }}.
function tokenRefsOf(step: RestStep): string[] {
  const haystack = [
    step.endpoint,
    step.body,
    ...step.query_params.map((q) => q.value),
    ...step.headers.map((h) => h.value),
  ].join('\n');
  const tokens: string[] = [];
  for (const m of haystack.matchAll(/\{\{\s*([^%}][^}]*?)\s*\}\}/g)) {
    tokens.push(toKey(m[1]));
  }
  return tokens;
}

// True if any rest step in the report references the sentinel parameter.
function referencesSentinel(report: MultiReport): boolean {
  const sentinelKey = toKey(SENTINEL_PARAM);
  return restStepsOf(report).some((step) => tokenRefsOf(step).includes(sentinelKey));
}

// True if the sentinel is declared anywhere the request could draw it from — an interface
// parameter OR this report's own report_parameters. Lenient by design so any reasonable AI fix
// (interface param, report param, different casing/label) reliably flips the report green.
function sentinelDeclared(report: MultiReport, config: ConnectorConfig): boolean {
  const sentinelKey = toKey(SENTINEL_PARAM);
  const declared = [
    ...config.interface_parameters.map((p) => p.name),
    ...report.report_parameters.map((p) => p.name),
  ].map(toKey);
  return declared.includes(sentinelKey);
}

function toTestResult(reportName: string, baked: BakedReport): ReportTestResult {
  return {
    reportName,
    status: baked.status,
    recordsReturned: baked.recordsReturned,
    durationMs: baked.durationMs,
    steps: baked.steps,
    sampleColumns: baked.sampleColumns,
    sampleData: baked.sampleData,
    errorCode: baked.errorCode,
    errorMessage: baked.errorMessage,
    rawResponse: baked.rawResponse,
  };
}

export function generateDemoResults(config: ConnectorConfig): TestRunResult {
  const startedAt = new Date().toISOString();

  const list = config.multi_reports.length > 0
    ? config.multi_reports
    : [{ id: 'demo', name: 'Sample Report', report_parameters: [], steps: [] } as MultiReport];

  const results: ReportTestResult[] = list.map((report, index) => {
    // (a) Reactive fault — highest priority: a report that needs the sentinel parameter but doesn't
    // declare it fails. This is the only source of failure now; everything else passes.
    if (referencesSentinel(report) && !sentinelDeclared(report, config)) {
      return toTestResult(report.name, missingParamFailure(report.name, SENTINEL_PARAM));
    }

    // (b) Curated showcase reports keyed by name.
    const matched = baked[toKey(report.name)];
    if (matched) return toTestResult(report.name, matched);

    // (c) Anything else passes with generic synthesized data.
    return toTestResult(report.name, genericPassing(report.name, index));
  });

  const durationMs = results.reduce((sum, r) => sum + r.durationMs, 0);
  return { startedAt, durationMs, reports: results };
}
