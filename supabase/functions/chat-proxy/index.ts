// Supabase Edge Function (Deno) — proxies the YAML Builder chat to the Anthropic Messages API.
//
// Why this exists: the frontend is a static SPA (GitHub Pages) with no backend, so the
// Anthropic API key must never ship in the browser bundle. This function holds the key as a
// server-side secret and streams Claude's response back to the browser as Server-Sent Events.
//
// It transforms Anthropic's native SSE into a small, stable protocol the frontend consumes:
//   data: {"text":"<delta>"}      // one per streamed text chunk
//   data: {"error":"<message>"}   // on any upstream/stream error
//   data: [DONE]                  // terminator
//
// Secrets / env (set with `supabase secrets set …`):
//   ANTHROPIC_API_KEY  (required)  — your Anthropic API key
//   ANTHROPIC_MODEL    (optional)  — defaults to claude-opus-4-8
//   ANTHROPIC_MAX_TOKENS (optional) — defaults to 8192
//
// Local dev: `supabase functions serve chat-proxy --env-file supabase/functions/.env`
// (deno-lint / Deno types resolve under the Supabase CLI; this file is excluded from the app's tsconfig.)

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*", // tighten to your GitHub Pages origin in production
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-access-code",
};

interface ChatRequestMessage {
  role: "user" | "assistant";
  content: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// deno-lint-ignore no-explicit-any
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "Server is missing ANTHROPIC_API_KEY." }, 500);
  }

  // Optional access gate: if CHAT_ACCESS_CODE is set, require a matching x-access-code header.
  // If it's not set, the function stays open (no gate).
  const accessCode = Deno.env.get("CHAT_ACCESS_CODE");
  if (accessCode && req.headers.get("x-access-code") !== accessCode) {
    return jsonResponse({ error: "Access code required or incorrect." }, 401);
  }

  const model = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-opus-4-8";
  const maxTokens = Number(Deno.env.get("ANTHROPIC_MAX_TOKENS") ?? "8192");

  let payload: { systemPrompt?: string; messages?: ChatRequestMessage[] };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const { systemPrompt, messages } = payload;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: "`messages` must be a non-empty array." }, 400);
  }

  let upstream: Response;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        stream: true,
        system: systemPrompt ?? "",
        messages,
      }),
      signal: req.signal,
    });
  } catch (e) {
    return jsonResponse({ error: `Failed to reach Anthropic API: ${String(e)}` }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return jsonResponse(
      { error: `Anthropic API error ${upstream.status}: ${detail.slice(0, 500)}` },
      502,
    );
  }

  const stream = transformAnthropicStream(upstream.body);
  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

// Parse Anthropic's SSE byte stream and re-emit a simplified {text}/{error}/[DONE] protocol.
function transformAnthropicStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by a blank line.
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const evt of events) {
            for (const line of evt.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const data = trimmed.slice(5).trim();
              if (!data) continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                  send({ text: parsed.delta.text });
                } else if (parsed.type === "error") {
                  send({ error: parsed.error?.message ?? "Anthropic stream error" });
                }
                // Other events (message_start, ping, content_block_start, message_stop, …) are ignored.
              } catch {
                // Ignore unparseable keep-alive / partial lines.
              }
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`));
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });
}
