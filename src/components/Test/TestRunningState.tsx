import { ExLoader, LoaderVariant } from '@boomi/exosphere';

export default function TestRunningState() {
  return (
    <div className="test-panel-loading">
      <ExLoader variant={LoaderVariant.SPINNER} />
      <p className="test-panel-loading-text">Running your test...</p>
    </div>
  );
}
