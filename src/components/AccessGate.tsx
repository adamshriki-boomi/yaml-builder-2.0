/**
 * ────────────────────────────────────────────────────────────
 * Note: this is a CUSTOM EXOSPHERE EXTENSION — a full-screen app lock overlay.
 * Exosphere has no non-dismissable app-gate component; the backdrop is token-styled
 * and the content uses stock Ex* primitives. See EXOSPHERE-CUSTOM.md.
 * ────────────────────────────────────────────────────────────
 */
import { useEffect, useState, type ReactNode, type KeyboardEvent } from 'react';
import {
  ExCard,
  ExInput,
  ExButton,
  ExLoader,
  ExAlertBanner,
  ButtonType,
  ButtonFlavor,
  LoaderVariant,
  SpinnerSize,
  AlertBannerType,
  AlertBannerVariant,
} from '@boomi/exosphere';
import {
  validateAccessCode,
  getStoredAccessCode,
  storeAccessCode,
  clearStoredAccessCode,
  setLockListener,
} from '../chat/accessGate';

type Status = 'checking' | 'open' | 'locked';

export default function AccessGate({ children }: { children: ReactNode }) {
  // If a code is already stored, open optimistically (an invalid one is caught on the first
  // chat 401, which re-locks). Otherwise ask the function whether a code is required.
  const [status, setStatus] = useState<Status>(() => (getStoredAccessCode() ? 'open' : 'checking'));
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getStoredAccessCode()) return;
    let cancelled = false;
    void (async () => {
      const result = await validateAccessCode('');
      if (!cancelled) setStatus(result === 'locked' ? 'locked' : 'open');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Let the chat stream re-lock the gate on a 401 (e.g. the code was rotated) without
  // unmounting the app, so the user's in-progress YAML isn't lost.
  useEffect(() => {
    setLockListener(() => {
      setError('Your access code is no longer valid. Please re-enter it.');
      setStatus('locked');
    });
    return () => setLockListener(null);
  }, []);

  const submit = async () => {
    const value = code.trim();
    if (!value || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await validateAccessCode(value);
    setSubmitting(false);
    if (result === 'ok' || result === 'unconfigured') {
      storeAccessCode(value);
      setCode('');
      setStatus('open');
    } else if (result === 'locked') {
      clearStoredAccessCode();
      setError('Incorrect access code. Please try again.');
    } else {
      setError('Could not verify the code (network issue). Please try again.');
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <>
      {children}
      {status !== 'open' && (
        <div className="access-gate-overlay" role="dialog" aria-modal="true" aria-label="Access required">
          <ExCard className="access-gate-card">
            <h1 className="access-gate-title">YAML Builder 2.0</h1>
            {status === 'checking' ? (
              <div className="access-gate-checking">
                <ExLoader
                  variant={LoaderVariant.SPINNER}
                  inline
                  spinnerSize={SpinnerSize.SMALL}
                  label="Checking access…"
                />
              </div>
            ) : (
              <div className="access-gate-form" onKeyDown={onKeyDown}>
                <p className="access-gate-text">Enter your access code to continue.</p>
                {error && (
                  <ExAlertBanner type={AlertBannerType.ERROR} variant={AlertBannerVariant.INLINE}>
                    {error}
                  </ExAlertBanner>
                )}
                <ExInput
                  type="password"
                  label="Access code"
                  value={code}
                  disabled={submitting}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onInput={(e: any) => setCode(e.target.value)}
                />
                <ExButton
                  type={ButtonType.PRIMARY}
                  flavor={ButtonFlavor.BRANDED}
                  disabled={submitting || !code.trim()}
                  onClick={() => void submit()}
                >
                  {submitting ? 'Checking…' : 'Unlock'}
                </ExButton>
              </div>
            )}
          </ExCard>
        </div>
      )}
    </>
  );
}
