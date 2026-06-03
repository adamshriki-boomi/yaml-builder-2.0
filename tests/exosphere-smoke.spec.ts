import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173/yaml-builder/';

test.describe('Exosphere alignment — smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  });

  test('top tab bar uses ExTab + ExTabItem with all 3 tabs', async ({ page }) => {
    await expect(page.locator('ex-tab')).toBeVisible();
    const items = page.locator('ex-tab ex-tab-item');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText('Connector Configuration');
    await expect(items.nth(1)).toContainText('Interface Parameters');
    await expect(items.nth(2)).toContainText('Workflow Steps');
    // selected reflects to the attribute (Lit @property({ reflect: true }))
    await expect(items.nth(0)).toHaveAttribute('selected', /.*/);
  });

  test('Connector Configuration uses 6 ExAccordion sections with correct labels', async ({ page }) => {
    const sections = page.locator('.tab-content ex-accordion-item');
    await expect(sections).toHaveCount(6);

    // label is a Lit property — read via JS evaluation, not attribute selector
    const labels = await sections.evaluateAll((els: any[]) => els.map(el => el.label));
    expect(labels).toEqual([
      'Basic Configuration',
      'Default Headers',
      'Authentication',
      'Default Retry Strategy',
      'Variables Storages',
      'Variables Metadata',
    ]);
  });

  test('Interface Parameters tab shows ExEmptyState when empty', async ({ page }) => {
    await page.locator('ex-tab-item', { hasText: 'Interface Parameters' }).click();
    await page.waitForTimeout(300);
    const empty = page.locator('.tab-content ex-empty-state').first();
    await expect(empty).toBeVisible();
    const label = await empty.evaluate((el: any) => el.label);
    expect(label).toBe('No parameters defined');
  });

  test('Workflow Steps tab shows ExEmptyState for empty reports', async ({ page }) => {
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(300);
    const empties = page.locator('.tab-content ex-empty-state');
    expect(await empties.count()).toBeGreaterThan(0);
    const labels = await empties.evaluateAll((els: any[]) => els.map(el => el.label));
    expect(labels).toContain('No reports defined');
  });

  test('YAML editor side panel renders with ExResizeHandle', async ({ page }) => {
    await expect(page.locator('.yaml-side-panel')).toBeVisible();
    await expect(page.locator('ex-resize-handle')).toBeVisible();
    await expect(page.locator('.editor-toolbar')).toBeVisible();
    await expect(page.locator('.cm-editor')).toBeVisible();
    // ExIconButton presence check (6 toolbar buttons)
    const iconButtons = page.locator('.editor-toolbar ex-icon-button');
    await expect(iconButtons).toHaveCount(6);
  });

  test('template trigger expands an ExAccordion inline with ExTile cards', async ({ page }) => {
    const accordionItem = page.locator('.template-drawer-host ex-accordion-item');
    await expect(accordionItem).toHaveCount(1);

    const labelBefore = await accordionItem.evaluate((el: any) => el.label);
    expect(labelBefore).toBe('Quick start: Select a template');

    const openBefore = await accordionItem.evaluate((el: any) => el.open);
    expect(openBefore).toBeFalsy();

    // Click the accordion's header (its shadow-DOM button) — easiest path is to click the host
    await accordionItem.click();
    await page.waitForTimeout(500);

    const openAfter = await accordionItem.evaluate((el: any) => el.open);
    expect(openAfter).toBeTruthy();

    const tileCount = await page.locator('.template-drawer-host ex-tile').count();
    expect(tileCount).toBeGreaterThan(0);
  });

  test('selecting a template opens the confirm ExDialog', async ({ page }) => {
    const accordionItem = page.locator('.template-drawer-host ex-accordion-item');
    await accordionItem.click();
    await page.waitForTimeout(500);
    const firstTile = page.locator('.template-drawer-host ex-tile').first();
    await firstTile.click();
    await page.waitForTimeout(800);

    // Don't use toBeVisible — ExDialog renders via shadow-DOM positioning that
    // confuses Playwright's interim visibility check. Verify behavior via the
    // open property + computed style.
    const dialog = page.locator('ex-dialog').first();
    await expect(dialog).toHaveCount(1);
    const open = await dialog.evaluate((el: any) => el.open);
    expect(open).toBeTruthy();
    const display = await dialog.evaluate(el => getComputedStyle(el).display);
    expect(display).not.toBe('none');
    const title = await dialog.evaluate((el: any) => el.dialogTitle);
    expect(title).toBe('Replace Configuration?');
  });

  test('test panel toggle reveals an ExEmptyState idle screen', async ({ page }) => {
    // Find the Test Blueprint icon-button (the 6th toolbar button)
    const testToggle = page.locator('.editor-toolbar ex-icon-button').nth(5);
    await testToggle.click();
    await page.waitForTimeout(400);
    const emptyLabels = await page.locator('ex-empty-state').evaluateAll((els: any[]) => els.map(e => e.label));
    expect(emptyLabels).toContain('Test your Blueprint configuration');
  });

  test('no raw <button> elements in light DOM (Exosphere internals live in shadow DOM)', async ({ page }) => {
    // querySelectorAll does NOT cross shadow boundaries. Playwright's locator does.
    // Use the explicit DOM API to count only light-DOM buttons (the ones we own).
    const count = await page.evaluate(() => document.querySelectorAll('button').length);
    expect(count).toBe(0);
  });

  test('no raw hex colors in inline styles', async ({ page }) => {
    const offenders = await page.evaluate(() => {
      const results: string[] = [];
      const all = document.querySelectorAll<HTMLElement>('[style]');
      const hexRe = /#[0-9a-fA-F]{3,8}\b/;
      all.forEach(el => {
        const s = el.getAttribute('style') || '';
        if (hexRe.test(s)) results.push(el.tagName + ' :: ' + s);
      });
      return results;
    });
    expect(offenders).toEqual([]);
  });
});
