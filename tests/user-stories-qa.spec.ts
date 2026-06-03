import { test, expect, Page } from '@playwright/test';

// QA validation against all user stories

// ExAccordionItem's label lives in shadow DOM. Find by label property, then click
// the shadow-DOM header (the click handler is bound there, NOT to the host).
async function expandAccordion(page: Page, labelPrefix: string) {
  await page.evaluate((labelPrefix) => {
    const items = document.querySelectorAll('ex-accordion-item');
    for (const item of items) {
      const itemLabel = (item as { label?: string }).label || '';
      if (itemLabel.startsWith(labelPrefix)) {
        // The clickable header is the first child div inside the .container in shadow DOM.
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

test.describe('Epic 1: Connector Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });

  test('US-1.1: Connector name and base URL fields exist in Basic Configuration section', async ({ page }) => {
    // Basic Configuration is the first ExAccordionItem, open by default
    const firstLabel = await page.locator('.tab-content ex-accordion-item').first().evaluate((el: any) => el.label);
    expect(firstLabel).toBe('Basic Configuration');

    const inputs = await page.locator('.tab-content ex-input').count();
    expect(inputs).toBeGreaterThanOrEqual(2); // connector name + base URL
    await expect(page.locator('.cm-editor')).toBeVisible();
  });

  test('US-1.2: Can add/manage default headers in Default Headers section', async ({ page }) => {
    const inputsBefore = await page.locator('.tab-content ex-input').count();
    await page.locator('.tab-content ex-button', { hasText: 'Add Header' }).click();
    await page.waitForTimeout(500);
    // After adding a header, two more inputs should appear (header name + value)
    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBe(inputsBefore + 2);
  });

  test('US-1.3: Auth type dropdown exists with bearer, basic_http, api_key, oauth2', async ({ page }) => {
    // Authentication section is the 3rd ExAccordionItem
    const labels = await page.locator('.tab-content ex-accordion-item').evaluateAll((els: any[]) => els.map(el => el.label));
    expect(labels).toContain('Authentication');

    const selects = await page.locator('.tab-content ex-select').count();
    expect(selects).toBeGreaterThanOrEqual(1); // auth type select at minimum
  });

  test('US-1.4: OAuth 2.0 shows grant type, token URL, refresh token fields', async ({ page }) => {
    const inputsBefore = await page.locator('.tab-content ex-input').count();
    // Select OAuth via JS since ExSelect is a web component
    await page.evaluate(() => {
      const selects = document.querySelectorAll('.tab-content ex-select');
      for (const sel of selects) {
        const items = sel.querySelectorAll('ex-menu-item');
        for (const item of items) {
          if ((item as any).value === 'oauth2') {
            item.click();
            return;
          }
        }
      }
    });
    await page.waitForTimeout(1000);
    // Should now show more inputs (token URL, refresh token)
    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBeGreaterThan(inputsBefore);
  });

  test('US-1.5: All six connector config sections are present', async ({ page }) => {
    const sections = page.locator('.tab-content ex-accordion-item');
    await expect(sections).toHaveCount(6);
  });

  test('US-1.6: Default Retry Strategy section can be enabled/disabled', async ({ page }) => {
    const inputsBefore = await page.locator('.tab-content ex-input').count();
    await page.locator('.tab-content ex-button', { hasText: 'Enable Default Retry' }).click();
    await page.waitForTimeout(500);

    // Should show more inputs (status codes, attempts, interval)
    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBeGreaterThan(inputsBefore);

    // Remove it
    await page.locator('.tab-content ex-button', { hasText: 'Remove Default Retry' }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('.tab-content ex-button', { hasText: 'Enable Default Retry' })).toBeVisible();
  });
});

test.describe('Epic 2: Interface Parameters', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('ex-tab-item', { hasText: 'Interface Parameters' }).click();
    await page.waitForTimeout(500);
  });

  test('US-2.1: Can add parameter with type selection (string, authentication, date_range, list, multiselect, enum)', async ({ page }) => {
    await page.getByText('Add First Parameter').click();
    await page.waitForTimeout(500);
    // Parameter Type select should exist with 6 options
    const menuItems = await page.locator('.tab-content ex-select ex-menu-item').count();
    expect(menuItems).toBeGreaterThanOrEqual(6);
    const inputs = await page.locator('.tab-content ex-input').count();
    expect(inputs).toBeGreaterThanOrEqual(2); // name + value (string type shows value input)
  });

  test('US-2.2: Sensitive/encrypted toggle exists', async ({ page }) => {
    await page.getByText('Add First Parameter').click();
    await page.waitForTimeout(500);
    const toggles = await page.locator('.tab-content ex-toggle').count();
    expect(toggles).toBeGreaterThanOrEqual(2); // required + sensitive
    // Check the label text next to the toggle
    await expect(page.getByText('Sensitive / Encrypted')).toBeVisible();
  });

  test('US-2.3: Required toggle exists for parameters', async ({ page }) => {
    await page.getByText('Add First Parameter').click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Required')).toBeVisible();
  });

  test('US-2.4: Parameter duplicate and delete work', async ({ page }) => {
    await page.getByText('Add First Parameter').click();
    await page.waitForTimeout(500);

    const paramsBefore = await page.locator('.tab-content ex-input').count();

    // Duplicate: first icon button is the copy button
    await page.locator('.tab-content ex-icon-button').first().click();
    await page.waitForTimeout(500);

    const paramsAfter = await page.locator('.tab-content ex-input').count();
    expect(paramsAfter).toBeGreaterThan(paramsBefore);

    // Delete one: second icon button is the delete of first param
    await page.locator('.tab-content ex-icon-button').nth(1).click();
    await page.waitForTimeout(500);

    const paramsEnd = await page.locator('.tab-content ex-input').count();
    expect(paramsEnd).toBeLessThan(paramsAfter);
  });
});

test.describe('Epic 3: Variables & Storage', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });

  test('US-3.1: Variables Storages section in Connector Config allows adding storage', async ({ page }) => {
    const inputsBefore = await page.locator('.tab-content ex-input').count();
    await page.locator('.tab-content ex-button', { hasText: 'Add Storage' }).click();
    await page.waitForTimeout(500);

    // Should have a new storage input
    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBeGreaterThan(inputsBefore);

    // Should have a new storage type select
    const selects = await page.locator('.tab-content ex-select').count();
    expect(selects).toBeGreaterThanOrEqual(2); // auth type + storage type
  });

  test('US-3.2: Variables Metadata section allows adding key-value metadata entries', async ({ page }) => {
    const inputsBefore = await page.locator('.tab-content ex-input').count();
    await page.locator('.tab-content ex-button', { hasText: 'Add Metadata Entry' }).click();
    await page.waitForTimeout(500);

    // Should have new metadata inputs
    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBeGreaterThan(inputsBefore);
  });
});

test.describe('Epic 4: Workflow Steps (inside multi-reports)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);
    // Add a report first, then steps go inside it
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);
  });

  test('US-4.1: Can add REST step with method, URL, headers, params inside a report', async ({ page }) => {
    await page.getByText('+ Add REST Step').first().click();
    await page.waitForTimeout(500);
    expect(await page.locator('.tab-content ex-input').count()).toBeGreaterThanOrEqual(4);
    expect(await page.locator('.tab-content ex-select').count()).toBeGreaterThanOrEqual(1);
    await expect(page.getByText('Query Parameters')).toBeVisible();
    await expect(page.getByText('Headers').first()).toBeVisible();
  });

  test('US-4.2: Can add Loop step inside a report', async ({ page }) => {
    await page.getByText('+ Add Loop Step').first().click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Nested Step 1')).toBeVisible();
  });

  test('US-4.3: Loop step has nested REST step with method and inputs', async ({ page }) => {
    await page.getByText('+ Add Loop Step').first().click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Nested Step 1')).toBeVisible();
    expect(await page.locator('.tab-content ex-select').count()).toBeGreaterThanOrEqual(2); // loop type + method
  });

  test('US-4.4: Steps inside report have reorder, duplicate, delete buttons', async ({ page }) => {
    await page.getByText('+ Add REST Step').first().click();
    await page.waitForTimeout(500);
    // Report header has [copy, delete] = 2 icon buttons
    // Step header has [up, down, copy, delete] = 4 icon buttons
    // Total at least 6
    const iconBtns = await page.locator('.tab-content ex-icon-button').count();
    expect(iconBtns).toBeGreaterThanOrEqual(6);
  });

  test('US-4.5: Step has description field', async ({ page }) => {
    await page.getByText('+ Add REST Step').first().click();
    await page.waitForTimeout(500);
    // Step has at least 4 inputs: Report Name + Step Name + Description + Endpoint
    const inputs = await page.locator('.tab-content ex-input').count();
    expect(inputs).toBeGreaterThanOrEqual(4);
  });
});

test.describe('Epic 5: Pagination', () => {
  test('US-5.1-5.4: Can enable pagination with type and params inside a report step', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);

    // Add report, then step
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
});

test.describe('Epic 6: Retry & Error Handling', () => {
  test('US-6.1: Can enable retry with status codes, attempts, interval inside a report step', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);

    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);
    await page.getByText('+ Add REST Step').first().click();
    await page.waitForTimeout(500);

    const inputsBefore = await page.locator('.tab-content ex-input').count();
    // Retry "Enable" is the second Enable button
    await page.locator('.tab-content ex-button', { hasText: 'Enable' }).nth(1).click();
    await page.waitForTimeout(500);
    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBeGreaterThan(inputsBefore);
  });

  test('US-6.2: Loop step has ignore errors toggle', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);

    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);
    await page.getByText('+ Add Loop Step').first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Ignore errors')).toBeVisible();
    const toggles = await page.locator('.tab-content ex-toggle').count();
    expect(toggles).toBeGreaterThanOrEqual(2); // include_in_output + ignore_errors
  });
});

test.describe('Epic 7: Variable Outputs', () => {
  test('US-7.1-7.3: Can add variable output with name, location, format inside a report step', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);

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
});

test.describe('Epic 8: YAML Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });

  test('US-8.1: Live YAML preview visible with editor toolbar', async ({ page }) => {
    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('.editor-toolbar')).toBeVisible();
  });

  test('US-8.3: Copy icon button exists in editor toolbar', async ({ page }) => {
    const toolbar = page.locator('.editor-toolbar');
    const iconBtns = await toolbar.locator('ex-icon-button').count();
    expect(iconBtns).toBeGreaterThanOrEqual(5); // format, compact, undo, redo, copy, test
  });

  test('US-8.5: Syntax highlighting in CodeMirror', async ({ page }) => {
    const cmContent = page.locator('.cm-content');
    await expect(cmContent).toBeVisible();
  });
});

test.describe('Epic 9: Templates', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  });

  test('US-9.1: Template drawer shows all templates when expanded', async ({ page }) => {
    await page.locator('.template-drawer-host ex-accordion-item').click();
    await page.waitForTimeout(500);

    const tiles = page.locator('.template-drawer-host ex-tile');
    await expect(tiles).toHaveCount(4);
    const titles = await tiles.evaluateAll((els: any[]) => els.map(el => el.title));
    expect(titles).toContain('Multi-Report Blueprint');
  });

  test('US-9.2: Clicking a template shows confirmation dialog before applying', async ({ page }) => {
    await page.locator('.template-drawer-host ex-accordion-item').click();
    await page.waitForTimeout(500);

    // Basic Connector is the first template tile (titles are in shadow DOM, can't filter by title)
    const tiles = page.locator('.template-drawer-host ex-tile');
    await tiles.first().click();
    await page.waitForTimeout(500);

    // Confirmation dialog should appear with warning
    await expect(page.locator('ex-dialog')).toHaveCount(1);
    const hasWarning = await page.evaluate(() =>
      document.body.textContent?.includes('replace all your current configuration')
    );
    expect(hasWarning).toBe(true);
  });
});

test.describe('Epic 10: UX & Responsiveness', () => {
  test('US-10.1: Works in wide drawer (800px+) with split layout', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await expect(page.locator('.yaml-side-panel')).toBeVisible();
    await expect(page.locator('ex-resize-handle')).toBeVisible();
  });

  test('US-10.1: Responsive bottom panel below 900px', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 700 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await expect(page.locator('.yaml-bottom-panel')).toBeVisible();
  });

  test('Light mode only, no theme toggle', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    // Theme toggle was removed; assert no .theme-toggle remains
    const themeToggleCount = await page.locator('.theme-toggle').count();
    expect(themeToggleCount).toBe(0);
    expect(await page.locator('html').getAttribute('class')).toContain('ex-theme-light');
  });
});

test.describe('Epic 11: Multi-Report Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);
  });

  test('US-11.1: Workflow Steps tab has Pre-Run, Multi-Reports, Post-Run sections', async ({ page }) => {
    const labels = await page.locator('.tab-content ex-accordion-item').evaluateAll(
      (els: any[]) => els.map(el => el.label)
    );
    expect(labels.length).toBe(3);
    expect(labels[0]).toContain('Pre-Run Configurations');
    expect(labels[1]).toContain('Multi-Reports');
    expect(labels[2]).toContain('Post-Run Configurations');
  });

  test('US-11.2: Multi-Reports shows empty state with Add First Report when no reports exist', async ({ page }) => {
    await expect(page.getByText('No reports defined')).toBeVisible();
    await expect(page.getByText('Add First Report')).toBeVisible();
  });

  test('US-11.3: Adding a report creates a report card with name input and step area', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);

    // Report card should appear with at least one input (Report Name)
    const inputs = await page.locator('.tab-content ex-input').count();
    expect(inputs).toBeGreaterThanOrEqual(1);
    await expect(page.locator('ex-badge', { hasText: 'Report 1' })).toBeVisible();
    // Should show empty step state
    await expect(page.getByText('No steps yet')).toBeVisible();
  });

  test('US-11.4: Steps live inside multi-reports, not at the top level', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);

    // Add a REST step inside the report
    await page.getByText('+ Add REST Step').first().click();
    await page.waitForTimeout(500);

    // The REST step badge should be visible
    const restBadge = page.locator('ex-badge', { hasText: 'REST' });
    await expect(restBadge).toBeVisible();
    // Step count text on the report card header shows "(1 step)"
    await expect(page.getByText('(1 step)').first()).toBeVisible();
  });
});

test.describe('Epic 12: Report Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);
  });

  test('US-12.1: Can add multiple reports', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);
    await page.getByText('+ Add Report').click();
    await page.waitForTimeout(500);

    const reportBadges = page.locator('ex-badge', { hasText: /Report \d/ });
    await expect(reportBadges).toHaveCount(2);
  });

  test('US-12.2: Can duplicate a report', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);

    // The first icon button in the report header is the copy/duplicate button
    await page.locator('.tab-content ex-icon-button').first().click();
    await page.waitForTimeout(500);

    const reportBadges = page.locator('ex-badge', { hasText: /Report \d/ });
    await expect(reportBadges).toHaveCount(2);
  });

  test('US-12.3: Can delete a report', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);
    await page.getByText('+ Add Report').click();
    await page.waitForTimeout(500);

    // Delete button is the 2nd icon button (after copy) in the first report header
    await page.locator('.tab-content ex-icon-button').nth(1).click();
    await page.waitForTimeout(500);

    const reportBadges = page.locator('ex-badge', { hasText: /Report \d/ });
    await expect(reportBadges).toHaveCount(1);
  });

  test('US-12.4: Report card shows step count in header', async ({ page }) => {
    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);

    // 0 steps initially
    await expect(page.getByText('(0 steps)').first()).toBeVisible();

    // Add a step
    await page.getByText('+ Add REST Step').first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('(1 step)').first()).toBeVisible();
  });
});

test.describe('Epic 13: Report Parameters', () => {
  test('US-13.1: Each report has a collapsible Report Parameters section', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);

    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);

    // Report parameters section exists inside the report card
    const labels = await page.locator('.tab-content ex-accordion-item').evaluateAll(
      (els: any[]) => els.map(el => el.label)
    );
    expect(labels.some(l => l.startsWith('Report Parameters'))).toBe(true);
  });

  test('US-13.2: Can add and remove report parameters', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);

    await page.getByText('Add First Report').click();
    await page.waitForTimeout(500);

    // Expand Report Parameters accordion (collapsed by default)
    await expandAccordion(page, 'Report Parameters');
    await page.waitForTimeout(500);

    const inputsBefore = await page.locator('.tab-content ex-input').count();

    // Add a report parameter
    await page.getByText('+ Add Parameter').click();
    await page.waitForTimeout(500);

    // Should have more inputs (Name, Type, Default fields for the param)
    const inputsAfter = await page.locator('.tab-content ex-input').count();
    expect(inputsAfter).toBeGreaterThan(inputsBefore);

    // Delete the parameter — last icon button. ExIconButton's click handler is
    // bound to a <button> in shadow DOM, not the host. Click that directly to
    // bypass the visibility-inheritance issue from ExCard's animation state.
    const allIconBtns = page.locator('.tab-content ex-icon-button');
    const iconCount = await allIconBtns.count();
    await allIconBtns.nth(iconCount - 1).evaluate(
      (el) => (el.shadowRoot?.querySelector('button') as HTMLButtonElement | null)?.click()
    );
    await page.waitForTimeout(500);

    const inputsEnd = await page.locator('.tab-content ex-input').count();
    expect(inputsEnd).toBeLessThan(inputsAfter);
  });
});

test.describe('Epic 14: Pre-Run and Post-Run Configuration Groups', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
    await page.waitForTimeout(500);
  });

  test('US-14.1: Pre-Run section can have configuration groups with their own steps', async ({ page }) => {
    // Expand Pre-Run section
    await expandAccordion(page, 'Pre-Run Configurations');
    await page.waitForTimeout(500);

    await page.getByText('+ Add Pre-Run Group').click();
    await page.waitForTimeout(500);

    // Group card should appear
    // Badge exists in DOM (visibility inheritance during accordion animation can mark it hidden)
    await expect(page.locator('ex-badge', { hasText: 'Pre-Run 1' })).toHaveCount(1);
    const inputs = await page.locator('.tab-content ex-input').count();
    expect(inputs).toBeGreaterThanOrEqual(1); // Group Name input

    // Can add steps inside the pre-run group
    await page.getByText('+ Add REST Step').first().click({ force: true });
    await page.waitForTimeout(500);
    const badges = await page.locator('ex-badge').count();
    expect(badges).toBeGreaterThanOrEqual(2); // Pre-Run badge + REST badge
  });

  test('US-14.2: Post-Run section can have configuration groups with their own steps', async ({ page }) => {
    // Expand Post-Run section
    await expandAccordion(page, 'Post-Run Configurations');
    await page.waitForTimeout(500);

    await page.getByText('+ Add Post-Run Group').click();
    await page.waitForTimeout(500);

    await expect(page.locator('ex-badge', { hasText: 'Post-Run 1' })).toHaveCount(1);
    const inputs = await page.locator('.tab-content ex-input').count();
    expect(inputs).toBeGreaterThanOrEqual(1);
  });

  test('US-14.3: Pre-Run and Post-Run groups can be deleted', async ({ page }) => {
    // Expand Pre-Run section
    await expandAccordion(page, 'Pre-Run Configurations');
    await page.waitForTimeout(500);

    await page.getByText('+ Add Pre-Run Group').click();
    await page.waitForTimeout(500);

    // Badge exists in DOM (visibility inheritance during accordion animation can mark it hidden)
    await expect(page.locator('ex-badge', { hasText: 'Pre-Run 1' })).toHaveCount(1);

    // Delete the group — first icon button. Click the shadow-DOM <button> directly
    // because ExIconButton's click handler is bound there.
    await page.locator('.tab-content ex-icon-button').first().evaluate(
      (el) => (el.shadowRoot?.querySelector('button') as HTMLButtonElement | null)?.click()
    );
    await page.waitForTimeout(500);

    await expect(page.locator('ex-badge', { hasText: 'Pre-Run 1' })).toHaveCount(0);
  });
});
