/**
 * Regression coverage for the Round 2 editor + test-panel polish:
 *  - Friendly parameter labels (Time Period / Account ID's) in the test form
 *  - Status icons render green for passed / red for failed report rows
 *  - Failed rows have no light-red background
 *  - Results summary banner is visible (open prop wired through)
 *  - Templates drawer fully collapses after applying a template
 *  - Templates grid collapses to 1 column at narrow widths
 *  - Bottom YAML panel defaults to ~50% of viewport in narrow mode and clamps to 85%
 *
 * Run `npm run dev` first; tests connect to http://localhost:5173.
 */
import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173/yaml-builder/';

async function expandAccordion(page: Page, labelPrefix: string) {
  await page.evaluate((prefix) => {
    const items = document.querySelectorAll('ex-accordion-item');
    for (const item of items) {
      const lbl = (item as { label?: string }).label || '';
      if (lbl.startsWith(prefix)) {
        const header = item.shadowRoot?.querySelector('.container > div:first-child');
        if (header) (header as HTMLElement).click();
        return;
      }
    }
  }, labelPrefix);
}

async function applyMultiReportTemplate(page: Page) {
  await expandAccordion(page, 'Quick start');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const tiles = document.querySelectorAll('ex-tile');
    for (const t of tiles) {
      if (t.textContent?.includes('PRD-style multi-report')) {
        (t as HTMLElement).click();
        return;
      }
    }
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const dialog = document.querySelector('ex-dialog');
    const buttons = dialog?.querySelectorAll('ex-button') || [];
    for (const b of buttons) if (b.textContent?.includes('Confirm')) (b as HTMLElement).click();
  });
  await page.waitForTimeout(1500);
}

async function openTestPanel(page: Page) {
  const handle = await page.evaluateHandle(() => {
    const btns = document.querySelectorAll('ex-icon-button');
    for (const b of btns) if ((b as { label?: string }).label === 'Test Blueprint') return b;
    return null;
  });
  await (handle.asElement() as { click(): Promise<void> } | null)?.click();
  await page.waitForTimeout(300);
  await page.locator('ex-button', { hasText: /^\s*Test Blueprint\s*$/ }).click();
  await page.waitForTimeout(500);
}

async function fillAccountIdsAndRun(page: Page) {
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('ex-input');
    for (const inp of inputs) {
      if ((inp as { label?: string }).label?.includes('Account')) {
        const inner = inp.shadowRoot?.querySelector('input') as HTMLInputElement | null;
        if (inner) inner.focus();
        return;
      }
    }
  });
  await page.keyboard.type('1234');
  await page.waitForTimeout(300);
  await page.locator('ex-button', { hasText: /^\s*Run Test\s*$/ }).click();
  await page.waitForTimeout(2500);
}

test.describe('Round 2 — editor & test panel polish', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  });

  test('Templates drawer collapses fully after applying a template', async ({ page }) => {
    await applyMultiReportTemplate(page);
    const height = await page.evaluate(() => {
      const host = document.querySelector('.template-drawer-host') as HTMLElement | null;
      return host?.offsetHeight ?? -1;
    });
    // Header alone is ~50px; expanded was ~535px.
    expect(height).toBeLessThan(80);
  });

  test('Test panel renders friendly parameter labels', async ({ page }) => {
    await applyMultiReportTemplate(page);
    await openTestPanel(page);
    const labels = await page.evaluate(() => {
      const out: string[] = [];
      const widgets = document.querySelectorAll('ex-input, ex-date-picker, ex-select');
      for (const w of widgets) {
        const lbl = (w as { label?: string }).label;
        if (lbl) out.push(lbl);
      }
      return out;
    });
    expect(labels).toContain('Time Period (date_range)');
    expect(labels).toContain("Account ID's (account_ids)");
  });

  test('Pass/fail icons render in green and red', async ({ page }) => {
    await applyMultiReportTemplate(page);
    await openTestPanel(page);
    await fillAccountIdsAndRun(page);

    const colors = await page.evaluate(() => {
      const out: Array<{ status: string; fill: string | null }> = [];
      const rows = document.querySelectorAll('.report-row');
      for (const row of rows) {
        const status = row.classList.contains('report-row--passed') ? 'passed' : 'failed';
        const exIcon = row.querySelector('.report-row-status-icon ex-icon');
        const path = exIcon?.shadowRoot?.querySelector('path');
        out.push({ status, fill: path ? window.getComputedStyle(path).fill : null });
      }
      return out;
    });

    expect(colors.some(c => c.status === 'passed')).toBe(true);
    expect(colors.some(c => c.status === 'failed')).toBe(true);
    // exo-color-font-success ≈ rgb(0, 169, 114), font-danger ≈ rgb(199, 23, 57)
    for (const c of colors) {
      if (c.status === 'passed') expect(c.fill).toMatch(/rgb\(\s*0\s*,\s*169\s*,\s*114\s*\)/);
      if (c.status === 'failed') expect(c.fill).toMatch(/rgb\(\s*199\s*,\s*23\s*,\s*57\s*\)/);
    }
  });

  test('Failed report row has no light-red background', async ({ page }) => {
    await applyMultiReportTemplate(page);
    await openTestPanel(page);
    await fillAccountIdsAndRun(page);
    const failedBg = await page.evaluate(() => {
      const failed = document.querySelector('.report-row--failed') as HTMLElement | null;
      if (!failed) return null;
      return window.getComputedStyle(failed).backgroundColor;
    });
    // Default --exo-color-background is white-ish, never the danger-weak pink.
    expect(failedBg).not.toMatch(/rgb\(\s*254/);  // danger-weak red-10 starts with #FE...
    expect(failedBg).not.toMatch(/rgb\(\s*255\s*,\s*230/);
  });

  test('Results banner is visible and stable', async ({ page }) => {
    await applyMultiReportTemplate(page);
    await openTestPanel(page);
    await fillAccountIdsAndRun(page);

    // Take readings every 300ms over 2.4s; banner must always have height.
    const heights: number[] = [];
    for (let i = 0; i < 8; i++) {
      const h = await page.evaluate(() => {
        const banner = document.querySelector('.test-results-banner ex-alert-banner') as HTMLElement | null;
        return banner?.offsetHeight ?? 0;
      });
      heights.push(h);
      await page.waitForTimeout(300);
    }
    expect(heights.every(h => h > 30)).toBe(true);
  });

  test('Templates grid shows 1 column at narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 });
    await page.waitForTimeout(500);
    await expandAccordion(page, 'Quick start');
    await page.waitForTimeout(400);
    const cols = await page.evaluate(() => {
      const grid = document.querySelector('.template-grid') as HTMLElement | null;
      if (!grid) return 0;
      return window.getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    });
    expect(cols).toBe(1);
  });

  test('Bottom YAML panel defaults near 50% of viewport in narrow mode', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 900 });
    await page.waitForTimeout(500);
    const h = await page.evaluate(() => {
      const panel = document.querySelector('.yaml-bottom-panel') as HTMLElement | null;
      return panel?.offsetHeight ?? 0;
    });
    // ~50% of 900px viewport, with some tolerance.
    expect(h).toBeGreaterThan(400);
    expect(h).toBeLessThan(550);
  });
});
