import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173/yaml-builder-2.0/';

// A canned assistant reply: a short explanation plus one ```yaml block (the proposal).
const PROPOSED_YAML = [
  'connector:',
  '  name: Test Connector',
  '  base_url: https://api.test.com',
  '  auth:',
  '    type: bearer',
  'multi-reports:',
  '  - name: Test Report',
  '    steps:',
  '      - type: rest',
  '        name: Get Data',
  '        method: GET',
  '        endpoint: /data',
  '',
].join('\n');

function mockStreamBody(): string {
  const text = `Here is a basic connector for you.\n\n\`\`\`yaml\n${PROPOSED_YAML}\`\`\`\n`;
  return `data: ${JSON.stringify({ text })}\n\ndata: [DONE]\n\n`;
}

// Intercept the Supabase Edge Function and return our canned SSE stream.
async function mockChatProxy(page: Page) {
  await page.route('**/functions/v1/chat-proxy', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: mockStreamBody(),
    });
  });
}

test.describe('AI Chat Agent', () => {
  test.beforeEach(async ({ page }) => {
    await mockChatProxy(page);
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  });

  test('chat panel renders at the bottom of the form column', async ({ page }) => {
    await expect(page.locator('.chat-panel-host')).toBeVisible();
    await expect(page.locator('.chat-panel-title')).toContainText('AI Assistant');
    await expect(page.locator('.chat-composer ex-textarea')).toBeVisible();
  });

  test('quick-start chips show on an empty conversation', async ({ page }) => {
    const chips = page.locator('.chat-chips ex-button');
    await expect(chips).toHaveCount(4);
  });

  test('dragging the top handle upward grows the panel', async ({ page }) => {
    const host = page.locator('.chat-panel-host');
    const before = await host.boundingBox();
    const handle = page.locator('.chat-panel-handle');
    const hb = await handle.boundingBox();
    if (!before || !hb) throw new Error('chat panel not measurable');

    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(hb.x + hb.width / 2, hb.y - 120, { steps: 8 });
    await page.mouse.up();

    const after = await host.boundingBox();
    expect(after!.height).toBeGreaterThan(before.height);
  });

  test('send a message → proposed YAML appears → Apply updates the editor', async ({ page }) => {
    // Type a request and send it.
    await page.locator('.chat-composer-input').click();
    await page.keyboard.type('Create a basic REST connector with bearer auth');
    await page.locator('.chat-composer-row ex-icon-button').first().click();
    await page.waitForTimeout(800);

    // If the dev server wasn't started with VITE_SUPABASE_FUNCTION_URL, the app never calls the
    // proxy and shows a config notice instead. Skip the rest in that case (see README / chat setup).
    const notConfigured = await page.getByText('VITE_SUPABASE_FUNCTION_URL').count();
    test.skip(
      notConfigured > 0,
      'Set VITE_SUPABASE_FUNCTION_URL (any value) when starting the dev server to run the full chat flow test.',
    );

    // The proposal card should render with an Apply action.
    await expect(page.locator('.chat-proposal-card')).toBeVisible({ timeout: 5000 });

    await page.locator('.chat-proposal-actions ex-button', { hasText: 'Apply' }).click();

    // The applied YAML should flow into the editor (and the form).
    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            Array.from(document.querySelectorAll('.cm-line'))
              .map((l) => l.textContent)
              .join('\n'),
          ),
        { timeout: 5000 },
      )
      .toContain('Test Connector');
  });
});
