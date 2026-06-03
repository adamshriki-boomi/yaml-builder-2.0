import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5173/yaml-builder/';

// ExAccordionItem's label lives in shadow DOM, so Playwright's hasText filter
// can't find a collapsed item by label. Find by label property, then click the
// shadow-DOM header (the click handler is bound there, NOT to the host).
async function expandAccordion(page: Page, labelPrefix: string) {
  await page.evaluate((labelPrefix) => {
    const items = document.querySelectorAll('ex-accordion-item');
    for (const item of items) {
      const itemLabel = (item as { label?: string }).label || '';
      if (itemLabel.startsWith(labelPrefix)) {
        // The clickable header is the first child div inside the .container in shadow DOM.
        // (Host click and inner h3 click do NOT toggle; only this wrapper does.)
        const header = item.shadowRoot?.querySelector('.container > div:first-child');
        if (header) {
          (header as HTMLElement).click();
        }
        return;
      }
    }
  }, labelPrefix);
}

async function clickConfirmInDialog(page: Page) {
  // Click the Confirm ExButton inside the active dialog. ExButton dispatches a click
  // event from its host element on user click; we mimic that here.
  const handle = await page.evaluateHandle(() => {
    const dialog = document.querySelector('ex-dialog');
    if (!dialog) return null;
    const buttons = dialog.querySelectorAll('ex-button');
    for (const btn of buttons) {
      if (btn.textContent?.includes('Confirm')) return btn;
    }
    return null;
  });
  const el = handle.asElement();
  if (el) await el.click();
}

// ============================================================================
// Tab navigation and content
// ============================================================================

test.describe('Tab navigation and content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
  });

  test('first tab is selected by default with visible indicator', async ({ page }) => {
    const activeTab = page.locator('ex-tab-item[selected]');
    await expect(activeTab).toHaveCount(1);
    await expect(activeTab).toContainText('Connector Configuration');
  });

  test('Connector Configuration tab shows all six accordion sections', async ({ page }) => {
    const sections = page.locator('.tab-content ex-accordion-item');
    await expect(sections).toHaveCount(6);

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

  test('clicking Interface Parameters tab switches content', async ({ page }) => {
    await page.locator('ex-tab-item', { hasText: 'Interface Parameters' }).click();
    await page.waitForTimeout(500);
    const active = page.locator('ex-tab-item[selected]');
    await expect(active).toContainText('Interface Parameters');
    const sections = page.locator('.tab-content ex-accordion-item');
    await expect(sections).toHaveCount(1);
  });

  test('clicking Workflow Steps tab switches content', async ({ page }) => {
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);
    const active = page.locator('ex-tab-item[selected]');
    await expect(active).toContainText('Workflow Steps');
    const sections = page.locator('.tab-content ex-accordion-item');
    await expect(sections).toHaveCount(3);
  });

  test('can cycle through all tabs and back', async ({ page }) => {
    await expect(page.locator('.tab-content ex-accordion-item')).toHaveCount(6);

    await page.locator('ex-tab-item', { hasText: 'Interface Parameters' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.tab-content ex-accordion-item')).toHaveCount(1);

    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.tab-content ex-accordion-item')).toHaveCount(3);

    await page.locator('ex-tab-item', { hasText: 'Connector Configuration' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.tab-content ex-accordion-item')).toHaveCount(6);
  });
});

// ============================================================================
// YAML Editor
// ============================================================================

test.describe('YAML Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
  });

  test('YAML editor panel is visible with toolbar and CodeMirror', async ({ page }) => {
    await expect(page.locator('.yaml-side-panel')).toBeVisible();
    await expect(page.locator('.editor-toolbar')).toBeVisible();
    await expect(page.locator('.cm-editor')).toBeVisible();
  });

  test('Editor toolbar has icon buttons including copy and test toggle', async ({ page }) => {
    const toolbar = page.locator('.editor-toolbar');
    await expect(toolbar).toBeVisible();
    const iconBtns = await toolbar.locator('ex-icon-button').count();
    expect(iconBtns).toBeGreaterThanOrEqual(5);
  });

  test('Test toggle switches right panel to TestPanel', async ({ page }) => {
    const toolbar = page.locator('.editor-toolbar');
    const iconBtns = toolbar.locator('ex-icon-button');
    await iconBtns.last().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Test your Blueprint configuration')).toBeVisible();
    await expect(page.locator('.yaml-side-panel .cm-editor')).toHaveCount(0);
  });
});

// ============================================================================
// Templates
// ============================================================================

test.describe('Templates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
  });

  test('Template drawer shows all template options when expanded', async ({ page }) => {
    // Trigger is the accordion-item header at the bottom of the form column
    const trigger = page.locator('.template-drawer-host ex-accordion-item');
    await trigger.click();
    await page.waitForTimeout(500);

    const tiles = page.locator('.template-drawer-host ex-tile');
    await expect(tiles).toHaveCount(4);

    const titles = await tiles.evaluateAll((els: any[]) => els.map(el => el.title));
    expect(titles).toContain('Basic Connector');
    expect(titles).toContain('Cursor Pagination');
    expect(titles).toContain('External Variables Loop');
    expect(titles).toContain('Multi-Report Blueprint');
  });

  test('Selecting a template shows confirmation then populates YAML', async ({ page }) => {
    const trigger = page.locator('.template-drawer-host ex-accordion-item');
    await trigger.click();
    await page.waitForTimeout(500);

    // Basic Connector is the first tile (titles are in shadow DOM, can't filter by hasText)
    const tiles = page.locator('.template-drawer-host ex-tile');
    await tiles.first().click();
    await page.waitForTimeout(500);

    await expect(page.locator('ex-dialog')).toHaveCount(1);

    await clickConfirmInDialog(page);
    await page.waitForTimeout(2000);

    const cmText = await page.evaluate(() => {
      const cmLines = document.querySelectorAll('.cm-line');
      return Array.from(cmLines).map(l => l.textContent).join('\n');
    });
    expect(cmText.length).toBeGreaterThan(50);
  });

  test('Multi-Report Blueprint template populates all sections', async ({ page }) => {
    const trigger = page.locator('.template-drawer-host ex-accordion-item');
    await trigger.click();
    await page.waitForTimeout(500);

    // Multi-Report Blueprint is index 3 (Basic, Cursor, External, Multi-Report order)
    const tiles = page.locator('.template-drawer-host ex-tile');
    await tiles.nth(3).click();
    await page.waitForTimeout(500);

    await clickConfirmInDialog(page);
    await page.waitForTimeout(2000);

    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);

    // Multi-Reports accordion item label should include the report count
    const labels = await page.locator('.tab-content ex-accordion-item').evaluateAll(
      (els: any[]) => els.map(el => el.label)
    );
    const multiReportsLabel = labels.find(l => l.startsWith('Multi-Reports'));
    expect(multiReportsLabel).toBeTruthy();
    expect(multiReportsLabel).toContain('5');
  });
});

// ============================================================================
// Connector Configuration interactions
// ============================================================================

test.describe('Connector Configuration - interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
  });

  test('can add a default header', async ({ page }) => {
    const inputsBefore = await page.locator('.tab-content ex-input').count();

    await page.locator('.tab-content ex-button', { hasText: 'Add Header' }).click();
    await page.waitForTimeout(500);

    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBe(inputsBefore + 2);
  });

  test('Basic Configuration section has connector name and base URL inputs', async ({ page }) => {
    const inputs = await page.locator('.tab-content ex-input').count();
    expect(inputs).toBeGreaterThanOrEqual(2);
  });

  test('Authentication section has auth type select', async ({ page }) => {
    const selects = await page.locator('.tab-content ex-select').count();
    expect(selects).toBeGreaterThanOrEqual(1);
  });

  test('Variables Storages section allows adding storage', async ({ page }) => {
    const inputsBefore = await page.locator('.tab-content ex-input').count();
    await page.locator('.tab-content ex-button', { hasText: 'Add Storage' }).click();
    await page.waitForTimeout(500);

    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBeGreaterThan(inputsBefore);
    const selects = await page.locator('.tab-content ex-select').count();
    expect(selects).toBeGreaterThanOrEqual(2);
  });

  test('Variables Metadata section allows adding entries', async ({ page }) => {
    const inputsBefore = await page.locator('.tab-content ex-input').count();
    await page.locator('.tab-content ex-button', { hasText: 'Add Metadata Entry' }).click();
    await page.waitForTimeout(500);

    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBeGreaterThan(inputsBefore);
  });

  test('Default Retry Strategy can be enabled', async ({ page }) => {
    const inputsBefore = await page.locator('.tab-content ex-input').count();
    await page.locator('.tab-content ex-button', { hasText: 'Enable Default Retry' }).click();
    await page.waitForTimeout(500);

    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBeGreaterThan(inputsBefore);
  });
});

// ============================================================================
// Interface Parameters interactions
// ============================================================================

test.describe('Interface Parameters - interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.locator('ex-tab-item', { hasText: 'Interface Parameters' }).click();
    await page.waitForTimeout(500);
  });

  test('shows empty state initially', async ({ page }) => {
    await expect(page.getByText('No parameters defined')).toBeVisible();
  });

  test('can add a parameter with all expected fields', async ({ page }) => {
    await page.getByText('Add First Parameter').click();
    await page.waitForTimeout(500);

    const inputs = await page.locator('.tab-content ex-input').count();
    expect(inputs).toBeGreaterThanOrEqual(2);
    const selects = await page.locator('.tab-content ex-select').count();
    expect(selects).toBeGreaterThanOrEqual(1);
    const toggles = await page.locator('.tab-content ex-toggle').count();
    expect(toggles).toBeGreaterThanOrEqual(2);
  });

  test('parameter type select has all six types', async ({ page }) => {
    await page.getByText('Add First Parameter').click();
    await page.waitForTimeout(500);

    const menuItemCount = await page.locator('.tab-content ex-select ex-menu-item').count();
    expect(menuItemCount).toBeGreaterThanOrEqual(6);
  });

  test('can duplicate and delete a parameter', async ({ page }) => {
    await page.getByText('Add First Parameter').click();
    await page.waitForTimeout(500);

    const inputsBefore = await page.locator('.tab-content ex-input').count();

    // First icon button = duplicate (in the parameter card's slot="header")
    await page.locator('.tab-content ex-icon-button').first().click();
    await page.waitForTimeout(500);

    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBeGreaterThan(inputsBefore);

    // Second icon button on the first card = delete
    await page.locator('.tab-content ex-icon-button').nth(1).click();
    await page.waitForTimeout(500);

    const inputsEnd = await page.locator('.tab-content ex-input').count();
    expect(inputsEnd).toBeLessThan(inputsAfter);
  });
});

// ============================================================================
// Workflow Steps - multi-report structure
// ============================================================================

test.describe('Workflow Steps - multi-report structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);
  });

  test('has three accordion sections: Pre-Run, Multi-Reports, Post-Run', async ({ page }) => {
    const labels = await page.locator('.tab-content ex-accordion-item').evaluateAll(
      (els: any[]) => els.map(el => el.label)
    );
    expect(labels.length).toBe(3);
    expect(labels[0]).toContain('Pre-Run Configurations');
    expect(labels[1]).toContain('Multi-Reports');
    expect(labels[2]).toContain('Post-Run Configurations');
  });

  test('Multi-Reports section shows empty state with Add First Report button', async ({ page }) => {
    await expect(page.getByText('No reports defined')).toBeVisible();
    await expect(page.getByText('Add First Report')).toBeVisible();
  });

  test('can add a multi-report', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);

    const inputs = await page.locator('.tab-content ex-input').count();
    expect(inputs).toBeGreaterThanOrEqual(1);
    const reportBadges = await page.locator('ex-badge').count();
    expect(reportBadges).toBeGreaterThanOrEqual(1);
  });

  test('can add a REST step inside a multi-report', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);

    await page.getByText('+ Add REST Step').first().click();
    await page.waitForTimeout(500);

    const badges = await page.locator('ex-badge').count();
    expect(badges).toBeGreaterThanOrEqual(2);
    const inputs = await page.locator('.tab-content ex-input').count();
    expect(inputs).toBeGreaterThanOrEqual(4);
  });

  test('can add a Loop step inside a multi-report', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);

    await page.getByText('+ Add Loop Step').first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Nested Step 1')).toBeVisible();
  });

  test('can add multiple reports and see + Add Report button', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);

    await expect(page.getByText('+ Add Report')).toBeVisible();

    await page.getByText('+ Add Report').click();
    await page.waitForTimeout(500);

    const reportBadges = page.locator('ex-badge', { hasText: /Report \d/ });
    await expect(reportBadges).toHaveCount(2);
  });

  test('can duplicate a report', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);

    // First icon button in the report card's header slot is "duplicate"
    await page.locator('.tab-content ex-icon-button').first().click();
    await page.waitForTimeout(500);

    const reportBadges = page.locator('ex-badge', { hasText: /Report \d/ });
    await expect(reportBadges).toHaveCount(2);
  });

  test('can delete a report', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);
    await page.getByText('+ Add Report').click();
    await page.waitForTimeout(500);

    const reportBadgesBefore = await page.locator('ex-badge', { hasText: /Report \d/ }).count();
    expect(reportBadgesBefore).toBe(2);

    // Second icon button on the first card = delete
    await page.locator('.tab-content ex-icon-button').nth(1).click();
    await page.waitForTimeout(500);

    const reportBadgesAfter = await page.locator('ex-badge', { hasText: /Report \d/ }).count();
    expect(reportBadgesAfter).toBe(1);
  });

  test('step inside report has reorder, duplicate, delete buttons', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);

    await page.getByText('+ Add REST Step').first().click();
    await page.waitForTimeout(500);

    // Report card header has [copy, delete] = 2 icon buttons
    // Step card header has [up, down, copy, delete] = 4 icon buttons
    const iconBtns = await page.locator('.tab-content ex-icon-button').count();
    expect(iconBtns).toBeGreaterThanOrEqual(6);
  });

  test('can enable pagination on a step inside a report', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);
    await page.getByText('+ Add REST Step').first().click();
    await page.waitForTimeout(500);

    const selectsBefore = await page.locator('.tab-content ex-select').count();
    await page.locator('.tab-content ex-button', { hasText: 'Enable' }).first().click();
    await page.waitForTimeout(500);

    const selectsAfter = await page.locator('.tab-content ex-select').count();
    expect(selectsAfter).toBeGreaterThan(selectsBefore);
  });

  test('can enable retry on a step inside a report', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);
    await page.getByText('+ Add REST Step').first().click();
    await page.waitForTimeout(500);

    const inputsBefore = await page.locator('.tab-content ex-input').count();
    await page.locator('.tab-content ex-button', { hasText: 'Enable' }).nth(1).click();
    await page.waitForTimeout(500);

    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBeGreaterThan(inputsBefore);
  });

  test('can add a variable output on a step inside a report', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);
    await page.getByText('+ Add REST Step').first().click();
    await page.waitForTimeout(500);

    const inputsBefore = await page.locator('.tab-content ex-input').count();
    const sectionAddButtons = page.locator('.form-section-title ex-button');
    await sectionAddButtons.last().click();
    await page.waitForTimeout(500);

    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBeGreaterThan(inputsBefore);
  });

  test('Pre-Run section allows adding configuration groups', async ({ page }) => {
    await expandAccordion(page, 'Pre-Run Configurations');
    await page.waitForTimeout(500);

    await page.getByText('+ Add Pre-Run Group').click();
    await page.waitForTimeout(500);

    const inputs = await page.locator('.tab-content ex-input').count();
    expect(inputs).toBeGreaterThanOrEqual(1);
    // Badge exists in DOM (visibility may be inherited-hidden during accordion animation)
    await expect(page.locator('ex-badge', { hasText: 'Pre-Run 1' })).toHaveCount(1);
  });

  test('Post-Run section allows adding configuration groups', async ({ page }) => {
    await expandAccordion(page, 'Post-Run Configurations');
    await page.waitForTimeout(500);

    await page.getByText('+ Add Post-Run Group').click();
    await page.waitForTimeout(500);

    const inputs = await page.locator('.tab-content ex-input').count();
    expect(inputs).toBeGreaterThanOrEqual(1);
    await expect(page.locator('ex-badge', { hasText: 'Post-Run 1' })).toHaveCount(1);
  });
});

// ============================================================================
// Resizable panels
// ============================================================================

test.describe('Resizable panels', () => {
  test('side resizer is visible in wide mode', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await expect(page.locator('ex-resize-handle')).toBeVisible();
  });
});
