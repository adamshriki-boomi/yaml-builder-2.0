import { test, expect } from '@playwright/test';

test('audit all icons - Connector Config tab', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Add a header to show delete icon
  await page.locator('.tab-content ex-button', { hasText: 'Add Header' }).click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'tests/screenshots/icons-tab1-headers.png', fullPage: false });

  // Check all ex-icon-button elements and their rendered state
  const iconButtons = await page.evaluate(() => {
    const btns = document.querySelectorAll('ex-icon-button');
    return Array.from(btns).map(btn => {
      const shadow = btn.shadowRoot;
      const icon = shadow?.querySelector('ex-icon');
      const svg = shadow?.querySelector('svg');
      return {
        iconProp: (btn as any).icon,
        labelProp: (btn as any).label,
        hasIconElement: !!icon,
        hasSvg: !!svg,
        iconInnerHTML: icon?.innerHTML?.substring(0, 100) || 'none',
      };
    });
  });
  console.log('Icon buttons in tab 1:', JSON.stringify(iconButtons, null, 2));
});

test('audit all icons - Steps tab with REST step', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
  await page.waitForTimeout(300);

  // Steps live inside reports — add a report first
  await page.getByText('Add First Report').click();
  await page.waitForTimeout(300);

  await page.getByText('+ Add REST Step').first().click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'tests/screenshots/icons-tab3-steps.png', fullPage: false });

  const iconButtons = await page.evaluate(() => {
    const btns = document.querySelectorAll('ex-icon-button');
    return Array.from(btns).map(btn => {
      const shadow = btn.shadowRoot;
      const icon = shadow?.querySelector('ex-icon');
      const svg = icon?.shadowRoot?.querySelector('svg');
      return {
        iconProp: (btn as any).icon,
        labelProp: (btn as any).label,
        hasIconElement: !!icon,
        iconName: (icon as any)?.icon || 'none',
        hasSvg: !!svg,
        svgContent: svg?.innerHTML?.substring(0, 50) || 'empty',
      };
    });
  });
  console.log('Icon buttons in steps tab:', JSON.stringify(iconButtons, null, 2));
});

test('audit all icons - Parameters tab', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.locator('ex-tab-item', { hasText: 'Interface Parameters' }).click();
  await page.waitForTimeout(300);

  await page.locator('.tab-content ex-button').first().click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'tests/screenshots/icons-tab2-params.png', fullPage: false });

  const iconButtons = await page.evaluate(() => {
    const btns = document.querySelectorAll('ex-icon-button');
    return Array.from(btns).map(btn => {
      const shadow = btn.shadowRoot;
      const icon = shadow?.querySelector('ex-icon');
      const svg = icon?.shadowRoot?.querySelector('svg');
      return {
        iconProp: (btn as any).icon,
        hasSvg: !!svg,
        svgContent: svg?.innerHTML?.substring(0, 80) || 'empty',
      };
    });
  });
  console.log('Icon buttons in params tab:', JSON.stringify(iconButtons, null, 2));
});

