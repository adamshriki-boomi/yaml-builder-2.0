# YAML Builder 2.0

A Vite + React + TypeScript app (built on Boomi's Exosphere design system) for authoring Boomi REST
API connector blueprints as YAML, with a live two-way editor and an **AI chat agent**.

## AI Chat Agent

The bottom panel of the left column is a conversational assistant that helps you create, edit, and
validate the connector YAML. It proposes a complete updated configuration; you click **Apply to
editor** to accept it (review & approve — nothing changes until you apply).

### Architecture

The frontend is a static SPA, so the Anthropic API key must never ship to the browser. A **Supabase
Edge Function** (`supabase/functions/chat-proxy`) holds the key as a server-side secret and streams
Claude's response back to the app.

```
Chat UI → Supabase Edge Function (holds ANTHROPIC_API_KEY) → Anthropic Messages API (Claude)
```

### Setup

> Prerequisites: the [Supabase CLI](https://supabase.com/docs/guides/cli) and a Supabase project.
> Run `supabase init` once in this repo (creates `supabase/config.toml`), and `supabase link` before deploying.

1. **Server secret** — set your Anthropic key on the function. For local dev, copy
   `supabase/functions/.env.example` → `supabase/functions/.env` and fill in `ANTHROPIC_API_KEY`
   (model defaults to `claude-opus-4-8`). For production: `supabase secrets set ANTHROPIC_API_KEY=…`.
2. **Frontend env** — copy `.env.example` → `.env.local` and set:
   - `VITE_SUPABASE_FUNCTION_URL` — e.g. `http://localhost:54321/functions/v1/chat-proxy` locally, or
     `https://<project-ref>.supabase.co/functions/v1/chat-proxy` in production.
   - `VITE_SUPABASE_ANON_KEY` — the Supabase anon (public) key.
3. **Run it locally**:
   ```bash
   supabase functions serve chat-proxy --env-file supabase/functions/.env   # terminal 1
   npm run dev                                                               # terminal 2
   ```
4. **Deploy** — `supabase functions deploy chat-proxy`, then add `VITE_SUPABASE_FUNCTION_URL` and
   `VITE_SUPABASE_ANON_KEY` as GitHub Actions repo secrets (the deploy workflow injects them at build
   time). The anon key is public by design; the Anthropic key stays in the function.

If the frontend env vars aren't set, the app loads normally and the chat shows a "not configured"
notice instead of calling out.

### Access gate

Set a `CHAT_ACCESS_CODE` secret on the function (Supabase dashboard → Edge Functions → Secrets) to
lock the whole app behind a code. On load the app asks the function (free `validate` check — no Claude
call) whether a code is required; if so, it shows a full-screen prompt before anything else is usable.
The code is validated server-side and remembered in the browser (`localStorage`). With no
`CHAT_ACCESS_CODE` set, the app and chat are open. Note: a front-end gate on a public static site is a
soft barrier — the real protection for your API spend is the server-side check in the function.

### Tests

`tests/chat-agent.spec.ts` mocks the Edge Function with a canned stream and verifies the panel,
quick-start chips, resize, and the send → propose → **Apply** flow. The full-flow test needs the dev
server started with `VITE_SUPABASE_FUNCTION_URL` set (any value — the test intercepts the request);
otherwise it skips that case. Run with `npm run dev` in one terminal and `npx playwright test` in another.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
