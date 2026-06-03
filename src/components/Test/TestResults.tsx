import { useMemo, useState } from 'react';
import {
  ExAlertBanner,
  ExAccordion,
  ExButton,
  ExSegmentedControls,
  ExSegmentedControl,
  AlertBannerType,
  AlertBannerVariant,
  AccordionVariant,
  ButtonType,
  ButtonFlavor,
  SegmentPlace,
} from '@boomi/exosphere';
import ReportResultRow from './ReportResultRow';
import type { TestRunResult } from '../../types/connector';

interface Props {
  result: TestRunResult;
  onReRun: () => void;
}

type Filter = 'all' | 'passed' | 'failed';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function TestResults({ result, onReRun }: Props) {
  const total = result.reports.length;
  const passed = result.reports.filter(r => r.status === 'passed').length;
  const failed = total - passed;

  const [filter, setFilter] = useState<Filter>('all');

  const visibleReports = useMemo(() => {
    if (filter === 'passed') return result.reports.filter(r => r.status === 'passed');
    if (filter === 'failed') return result.reports.filter(r => r.status === 'failed');
    return result.reports;
  }, [result.reports, filter]);

  let bannerType: AlertBannerType;
  let bannerLine: string;
  if (failed === 0) {
    bannerType = AlertBannerType.SUCCESS;
    bannerLine = `All ${total} reports passed · ${formatDuration(result.durationMs)}`;
  } else if (passed === 0) {
    bannerType = AlertBannerType.ERROR;
    bannerLine = `All ${total} reports failed · ${formatDuration(result.durationMs)}`;
  } else {
    bannerType = AlertBannerType.WARNING;
    bannerLine = `${passed} of ${total} reports passed · ${formatDuration(result.durationMs)} · ${failed} failed`;
  }

  return (
    <div className="test-panel-content">
      <div className="test-results-banner">
        <ExAlertBanner type={bannerType} variant={AlertBannerVariant.INLINE} open hideClose>
          {bannerLine}
        </ExAlertBanner>
      </div>

      <div className="test-results-controls">
        <ExSegmentedControls>
          <ExSegmentedControl
            label={`All (${total})`}
            segmentPlace={SegmentPlace.FIRST}
            selected={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <ExSegmentedControl
            label={`Passed (${passed})`}
            segmentPlace={SegmentPlace.INNER}
            selected={filter === 'passed'}
            onClick={() => setFilter('passed')}
          />
          <ExSegmentedControl
            label={`Failed (${failed})`}
            segmentPlace={SegmentPlace.LAST}
            selected={filter === 'failed'}
            disabled={failed === 0}
            onClick={() => setFilter('failed')}
          />
        </ExSegmentedControls>
        <ExButton type={ButtonType.PRIMARY} flavor={ButtonFlavor.BASE} onClick={onReRun}>
          Run Test Again
        </ExButton>
      </div>

      {visibleReports.length === 0 ? (
        <p className="form-helper-text">No reports match the current filter.</p>
      ) : (
        <ExAccordion variant={AccordionVariant.FLAT} allowMultiple>
          {visibleReports.map(report => (
            <ReportResultRow key={report.reportName} result={report} />
          ))}
        </ExAccordion>
      )}
    </div>
  );
}
