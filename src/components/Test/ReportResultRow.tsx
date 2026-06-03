import {
  ExAccordion,
  ExAccordionItem,
  ExBadge,
  ExIcon,
  ExPill,
  ExAlertBanner,
  ExStructuredList,
  ExStructuredListBody,
  ExStructuredListRow,
  ExStructuredListCol,
  AccordionVariant,
  BadgeColor,
  IconVariant,
  IconSize,
  PillColor,
  PillSize,
  AlertBannerType,
  AlertBannerVariant,
} from '@boomi/exosphere';
import type { ReportTestResult } from '../../types/connector';

interface Props {
  result: ReportTestResult;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function statusCodeColor(statusCode: number): BadgeColor {
  if (statusCode >= 200 && statusCode < 300) return BadgeColor.GREEN;
  if (statusCode >= 400) return BadgeColor.RED;
  return BadgeColor.GRAY;
}

export default function ReportResultRow({ result }: Props) {
  const passed = result.status === 'passed';
  const statusClass = passed ? 'report-row--passed' : 'report-row--failed';
  const headerSummary = passed
    ? `${result.reportName} · Passed · ${result.recordsReturned} records`
    : `${result.reportName} · Failed${result.errorCode ? ` · ${result.errorCode}` : ''}`;

  return (
    <div className={`report-row ${statusClass}`}>
      <span className="report-row-status-icon" aria-hidden="true">
        <ExIcon
          icon={passed ? 'status-success' : 'status-fail'}
          variant={IconVariant.TERTIARY}
          size={IconSize.S}
        />
      </span>
      <ExAccordionItem
        label={headerSummary}
        variant={AccordionVariant.FLAT}
      >
      <div className="report-result-body">
        <div className="report-result-header">
          <ExPill
            color={passed ? PillColor.GREEN : PillColor.RED}
            size={PillSize.SMALL}
            icon={passed ? 'status-success' : 'status-fail'}
          >
            {passed ? 'Passed' : 'Failed'}
          </ExPill>
          <div className="report-stats">
            <ExBadge color={BadgeColor.GRAY} showIcon={false}>{result.steps.length} API calls</ExBadge>
            <ExBadge color={BadgeColor.GRAY} showIcon={false}>{formatDuration(result.durationMs)}</ExBadge>
            <ExBadge color={BadgeColor.GRAY} showIcon={false}>{result.recordsReturned} records</ExBadge>
          </div>
        </div>

        <div className="report-section-label">Steps</div>
        <ExStructuredList>
          <ExStructuredListBody>
            {result.steps.map((step, i) => (
              <ExStructuredListRow key={i}>
                <ExStructuredListCol>
                  <ExBadge color={BadgeColor.NAVY} showIcon={false}>{step.method}</ExBadge>
                </ExStructuredListCol>
                <ExStructuredListCol>{step.url}</ExStructuredListCol>
                <ExStructuredListCol>
                  <ExBadge color={statusCodeColor(step.statusCode)} showIcon={false}>{step.statusCode}</ExBadge>
                </ExStructuredListCol>
                <ExStructuredListCol>{formatDuration(step.durationMs)}</ExStructuredListCol>
              </ExStructuredListRow>
            ))}
          </ExStructuredListBody>
        </ExStructuredList>

        {passed && result.sampleData && result.sampleColumns && (
          <>
            <div className="report-section-label">
              Sample data
              <span className="report-section-label-aux">
                first {Math.min(result.sampleData.length, 3)} of {result.recordsReturned}
              </span>
            </div>
            <ExStructuredList>
              <ExStructuredListBody>
                <ExStructuredListRow>
                  {result.sampleColumns.map(col => (
                    <ExStructuredListCol key={col}>
                      <strong>{col}</strong>
                    </ExStructuredListCol>
                  ))}
                </ExStructuredListRow>
                {result.sampleData.slice(0, 3).map((row, i) => (
                  <ExStructuredListRow key={i}>
                    {result.sampleColumns!.map(col => (
                      <ExStructuredListCol key={col}>{formatCell(row[col])}</ExStructuredListCol>
                    ))}
                  </ExStructuredListRow>
                ))}
              </ExStructuredListBody>
            </ExStructuredList>
          </>
        )}

        {!passed && result.errorCode && (
          <div className="report-error">
            <ExAlertBanner type={AlertBannerType.ERROR} variant={AlertBannerVariant.INLINE}>
              <strong>{result.errorCode}</strong> — {result.errorMessage ?? 'See raw response for details.'}
            </ExAlertBanner>
          </div>
        )}

        <ExAccordion variant={AccordionVariant.FLAT} allowMultiple>
          <ExAccordionItem label="Raw response" variant={AccordionVariant.FLAT}>
            <pre className="raw-response">{result.rawResponse}</pre>
          </ExAccordionItem>
        </ExAccordion>
      </div>
      </ExAccordionItem>
    </div>
  );
}
