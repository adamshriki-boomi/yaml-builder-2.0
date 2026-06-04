// Helpers for the app-entry access gate. The code is validated server-side (the chat-proxy
// function's `validate` mode checks CHAT_ACCESS_CODE without calling Claude, so it's free).

const FUNCTION_URL = import.meta.env.VITE_SUPABASE_FUNCTION_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const ACCESS_CODE_STORAGE_KEY = 'yaml-builder-chat-access-code';

export function getStoredAccessCode(): string {
  try {
    return localStorage.getItem(ACCESS_CODE_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function storeAccessCode(code: string): void {
  try {
    localStorage.setItem(ACCESS_CODE_STORAGE_KEY, code);
  } catch {
    // ignore storage errors
  }
}

export function clearStoredAccessCode(): void {
  try {
    localStorage.removeItem(ACCESS_CODE_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

// 'ok'           — code accepted (or no gate configured server-side)
// 'locked'       — a code is required and the supplied one is missing/wrong
// 'unconfigured' — the app has no function URL, so there's nothing to gate
// 'error'        — couldn't reach the function (network); caller decides how to treat it
export type ValidateResult = 'ok' | 'locked' | 'unconfigured' | 'error';

export async function validateAccessCode(code: string): Promise<ValidateResult> {
  if (!FUNCTION_URL) return 'unconfigured';
  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-code': code,
        ...(ANON_KEY ? { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY } : {}),
      },
      body: JSON.stringify({ validate: true }),
    });
    if (res.status === 401) return 'locked';
    if (res.ok) return 'ok';
    return 'error';
  } catch {
    return 'error';
  }
}

// Tiny pub/sub so the chat stream can re-lock the app gate on a 401 mid-session
// (without unmounting the app, so in-progress work is preserved).
let lockListener: (() => void) | null = null;

export function setLockListener(cb: (() => void) | null): void {
  lockListener = cb;
}

export function requestLock(): void {
  clearStoredAccessCode();
  lockListener?.();
}
