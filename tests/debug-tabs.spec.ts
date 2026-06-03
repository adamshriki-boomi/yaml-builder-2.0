import { test, expect } from '@playwright/test';

test('debug: inspect tab rendering', async ({ page }) => {
  await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Screenshot initial state
  await page.screenshot({ path: 'tests/screenshots/01-initial.png', fullPage: true });

  // Check what's rendered in the DOM
  const bodyHTML = await page.evaluate(() => document.querySelector('#root')?.innerHTML?.substring(0, 3000));
  console.log('=== ROOT HTML (first 3000 chars) ===');
  console.log(bodyHTML);

  // Check if ExTab / ex-tab exists in DOM
  const exTabCount = await page.locator('ex-tab').count();
  console.log(`ex-tab elements found: ${exTabCount}`);

  const exTabItemCount = await page.locator('ex-tab-item').count();
  console.log(`ex-tab-item elements found: ${exTabItemCount}`);

  // Check tab items text
  const tabTexts = await page.locator('ex-tab-item').allTextContents();
  console.log('Tab item texts:', tabTexts);

  // Check if any tab-item has selected attribute
  const selectedTabs = await page.locator('ex-tab-item[selected]').count();
  console.log(`Tabs with selected attribute: ${selectedTabs}`);

  // Check the tab-content area
  const tabContent = await page.locator('.tab-content').innerHTML();
  console.log('=== TAB CONTENT HTML ===');
  console.log(tabContent?.substring(0, 2000));

  // Check if ConnectorForm rendered
  const inputs = await page.locator('.tab-content ex-input, .tab-content input').count();
  console.log(`Input elements in tab-content: ${inputs}`);

  // Check for any console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.waitForTimeout(500);
  console.log('Console errors:', errors);
});

test('debug: try clicking tabs manually', async ({ page }) => {
  await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Try clicking the first tab item directly
  const firstTab = page.locator('ex-tab-item').first();
  await firstTab.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'tests/screenshots/02-after-click-first-tab.png', fullPage: true });

  const tabContent = await page.locator('.tab-content').innerHTML();
  console.log('=== TAB CONTENT AFTER CLICK ===');
  console.log(tabContent?.substring(0, 1000));

  // Check selectedIndex on ex-tab
  const selectedIndex = await page.evaluate(() => {
    const tab = document.querySelector('ex-tab') as any;
    return tab?.selectedIndex;
  });
  console.log('ex-tab selectedIndex:', selectedIndex);
});
