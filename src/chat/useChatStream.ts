import { useCallback, useRef } from 'react';
import { useChatState, useChatDispatch } from './ChatContext';
import { buildSystemPrompt } from './buildSystemPrompt';

const FUNCTION_URL = import.meta.env.VITE_SUPABASE_FUNCTION_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Where the (optional) chat access code is stored in the browser. Sent as the x-access-code
// header; the proxy enforces it only when CHAT_ACCESS_CODE is configured server-side.
export const ACCESS_CODE_STORAGE_KEY = 'yaml-builder-chat-access-code';

// Pull the LAST ```yaml fenced block out of the assistant's reply — that's the proposed config.
export function extractLastYamlBlock(text: string): string | null {
  const matches = [...text.matchAll(/```ya?ml\s*\n([\s\S]*?)```/gi)];
  if (matches.length === 0) return null;
  const yaml = matches[matches.length - 1][1].trim();
  return yaml.length > 0 ? yaml : null;
}

export function useChatStream() {
  const { messages, streamStatus } = useChatState();
  const dispatch = useChatDispatch();
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userText: string, currentYaml: string) => {
      const text = userText.trim();
      if (!text || streamStatus === 'streaming') return;

      // Build the API history from prior turns BEFORE we add the new placeholder messages.
      const apiMessages = [
        ...messages
          .filter((m) => m.content.trim().length > 0)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text },
      ];

      dispatch({ type: 'ADD_USER_MESSAGE', payload: { id: crypto.randomUUID(), content: text } });

      if (!FUNCTION_URL) {
        dispatch({
          type: 'SET_ERROR',
          payload:
            'Chat isn’t configured yet. Set VITE_SUPABASE_FUNCTION_URL (and VITE_SUPABASE_ANON_KEY) in .env.local, then restart the dev server.',
        });
        return;
      }

      const assistantId = crypto.randomUUID();
      dispatch({ type: 'BEGIN_ASSISTANT_MESSAGE', payload: { id: assistantId } });

      const controller = new AbortController();
      abortRef.current = controller;
      let assistantText = '';

      try {
        const res = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-access-code': localStorage.getItem(ACCESS_CODE_STORAGE_KEY) ?? '',
            ...(ANON_KEY ? { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY } : {}),
          },
          body: JSON.stringify({
            systemPrompt: buildSystemPrompt(currentYaml),
            messages: apiMessages,
          }),
          signal: controller.signal,
        });

        if (res.status === 401) {
          // Access code missing/incorrect — drop the stored code and prompt for it.
          try {
            localStorage.removeItem(ACCESS_CODE_STORAGE_KEY);
          } catch {
            // ignore storage errors
          }
          dispatch({ type: 'SET_AUTH_REQUIRED', payload: true });
          let msg = 'This assistant needs an access code. Enter it below to continue.';
          try {
            const err = await res.json();
            if (err?.error) msg = err.error;
          } catch {
            // keep the default message
          }
          throw new Error(msg);
        }

        if (!res.ok || !res.body) {
          let msg = `Request failed (HTTP ${res.status}).`;
          try {
            const err = await res.json();
            if (err?.error) msg = err.error;
          } catch {
            // non-JSON error body — keep the generic message
          }
          throw new Error(msg);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let done = false;

        while (!done) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';
          for (const evt of events) {
            const dataLine = evt.split('\n').find((l) => l.trim().startsWith('data:'));
            if (!dataLine) continue;
            const data = dataLine.trim().slice(5).trim();
            if (!data) continue;
            if (data === '[DONE]') {
              done = true;
              break;
            }
            let parsed: { text?: string; error?: string } | null = null;
            try {
              parsed = JSON.parse(data);
            } catch {
              parsed = null;
            }
            if (!parsed) continue;
            if (parsed.error) throw new Error(parsed.error);
            if (typeof parsed.text === 'string') {
              assistantText += parsed.text;
              dispatch({
                type: 'APPEND_ASSISTANT_CHUNK',
                payload: { id: assistantId, chunk: parsed.text },
              });
            }
          }
        }

        dispatch({
          type: 'FINALIZE_ASSISTANT_MESSAGE',
          payload: { id: assistantId, proposedYaml: extractLastYamlBlock(assistantText) },
        });
      } catch (e) {
        if (controller.signal.aborted) {
          // User stopped the stream — keep what arrived so far, no error banner.
          dispatch({
            type: 'FINALIZE_ASSISTANT_MESSAGE',
            payload: { id: assistantId, proposedYaml: extractLastYamlBlock(assistantText) },
          });
        } else {
          dispatch({
            type: 'SET_ERROR',
            payload: (e as Error).message || 'Something went wrong talking to the assistant.',
          });
        }
      } finally {
        abortRef.current = null;
      }
    },
    [messages, streamStatus, dispatch],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, cancelStream };
}
