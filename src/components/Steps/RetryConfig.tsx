import { ExInput, ExButton, ButtonType, ButtonFlavor } from '@boomi/exosphere';
import type { RestStep } from '../../types/connector';

interface Props {
  step: RestStep;
  onChange: (updates: Partial<RestStep>) => void;
}

export default function RetryConfig({ step, onChange }: Props) {
  const hasRetry = !!step.retry;

  const enableRetry = () => {
    onChange({
      retry: {
        status_codes: '429,500,502,503,504',
        attempts: 3,
        interval: 10,
      },
    });
  };

  const removeRetry = () => {
    onChange({ retry: undefined });
  };

  const updateRetry = (field: string, value: any) => {
    if (!step.retry) return;
    onChange({ retry: { ...step.retry, [field]: value } });
  };

  return (
    <div className="form-section">
      <div className="form-section-title form-section-title--inline">
        Retry Strategy
        {!hasRetry ? (
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={enableRetry}>Enable</ExButton>
        ) : (
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.RISKY} onClick={removeRetry}>Remove</ExButton>
        )}
      </div>

      {hasRetry && step.retry && (
        <div className="form-indent">
          <div className="form-field">
            <ExInput
              label="Status Codes"
              value={step.retry.status_codes}
              placeholder="429,500,502,503,504"
              onInput={(e: any) => updateRetry('status_codes', e.target.value)}
            />
          </div>
          <div className="form-row">
            <ExInput
              label="Max Attempts"
              type="number"
              value={String(step.retry.attempts)}
              onInput={(e: any) => updateRetry('attempts', Number(e.target.value))}
            />
            <ExInput
              label="Interval (seconds)"
              type="number"
              value={String(step.retry.interval)}
              onInput={(e: any) => updateRetry('interval', Number(e.target.value))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
