import type { MultiReport, ReportTestResult, StepResult, TestRunResult } from '../types/connector';

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
  conversion_events: {
    status: 'failed',
    recordsReturned: 0,
    durationMs: 1842,
    steps: [
      { method: 'GET', url: '/reports/conversions', statusCode: 404, durationMs: 612 },
      { method: 'GET', url: '/reports/conversions', statusCode: 404, durationMs: 614 },
      { method: 'GET', url: '/reports/conversions', statusCode: 404, durationMs: 616 },
    ],
    errorCode: 'RVR-ERR-001',
    errorMessage:
      'Max attempts reached for status code 404. The endpoint /reports/conversions returned "Not Found" — the report may not exist for this account, or pagination ran past the available data.',
    rawResponse: JSON.stringify({
      status: 400,
      message:
        'Action Failed. reason: [RVR-ERR-001]: Connector errors: An error occurred during pagination: Max attempts for status code: 404 reached with: "{\\n \\"message\\": \\"Not Found\\",\\n \\"documentation_url\\": \\"https://docs.example.com/rest/reports/conversions#list\\",\\n \\"status\\": \\"404\\"\\n}"',
      data: [],
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

function genericFailing(reportName: string): BakedReport {
  const key = toKey(reportName);
  return {
    status: 'failed',
    recordsReturned: 0,
    durationMs: 1500,
    steps: [
      { method: 'GET', url: `/api/${key}`, statusCode: 404, durationMs: 500 },
      { method: 'GET', url: `/api/${key}`, statusCode: 404, durationMs: 500 },
      { method: 'GET', url: `/api/${key}`, statusCode: 404, durationMs: 500 },
    ],
    errorCode: 'RVR-ERR-001',
    errorMessage: `Endpoint /api/${key} returned 404 Not Found. The resource may not exist for this account.`,
    rawResponse: JSON.stringify({
      status: 400,
      message: `Action Failed. reason: [RVR-ERR-001]: Connector errors: 404 reached for /api/${key}`,
      data: [],
    }, null, 2),
  };
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

export function generateDemoResults(reports: MultiReport[]): TestRunResult {
  const startedAt = new Date().toISOString();

  const list = reports.length > 0
    ? reports
    : [{ id: 'demo', name: 'Sample Report', report_parameters: [], steps: [] } as MultiReport];

  const results: ReportTestResult[] = list.map((report, index) => {
    const key = toKey(report.name);
    const matched = baked[key];
    if (matched) return toTestResult(report.name, matched);

    const isLast = index === list.length - 1;
    const fallback = isLast ? genericFailing(report.name) : genericPassing(report.name, index);
    return toTestResult(report.name, fallback);
  });

  const durationMs = results.reduce((sum, r) => sum + r.durationMs, 0);
  return { startedAt, durationMs, reports: results };
}
