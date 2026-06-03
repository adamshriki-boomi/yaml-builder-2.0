import { test, expect } from '@playwright/test';

test('debug scroll: add 2 REST steps and measure heights', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 700 });
  await page.goto('http://localhost:5173/yaml-builder/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.locator('ex-tab-item', { hasText: 'Workflow Steps' }).click();
  await page.waitForTimeout(500);

  // Steps live inside reports — add a report first
  await page.getByText('Add First Report').click();
  await page.waitForTimeout(300);

  // Add 2 REST steps inside the report
  await page.getByText('+ Add REST Step').first().click();
  await page.waitForTimeout(300);
  await page.getByText('+ Add REST Step').first().click();
  await page.waitForTimeout(300);

  // Measure all the container heights
  const measurements = await page.evaluate(() => {
    const tabContent = document.querySelector('.tab-content') as HTMLElement;
    const accordion = tabContent?.querySelector('ex-accordion') as HTMLElement;
    const accordionItem = tabContent?.querySelector('ex-accordion-item') as HTMLElement;

    // Check all elements in the hierarchy for overflow issues
    const results: Record<string, any> = {};

    results.tabContent = {
      clientHeight: tabContent?.clientHeight,
      scrollHeight: tabContent?.scrollHeight,
      overflow: getComputedStyle(tabContent).overflow,
      overflowY: getComputedStyle(tabContent).overflowY,
    };

    results.accordion = {
      clientHeight: accordion?.clientHeight,
      scrollHeight: accordion?.scrollHeight,
      overflow: accordion ? getComputedStyle(accordion).overflow : 'N/A',
    };

    results.accordionItem = {
      clientHeight: accordionItem?.clientHeight,
      scrollHeight: accordionItem?.scrollHeight,
      overflow: accordionItem ? getComputedStyle(accordionItem).overflow : 'N/A',
    };

    // Check shadow DOM of accordion-item for any overflow:hidden
    if (accordionItem?.shadowRoot) {
      const inner = accordionItem.shadowRoot.querySelector('.accordion, .accordion-item, [class*="accordion"]') as HTMLElement;
      if (inner) {
        results.accordionItemShadow = {
          className: inner.className,
          overflow: getComputedStyle(inner).overflow,
          maxHeight: getComputedStyle(inner).maxHeight,
          height: getComputedStyle(inner).height,
        };
      }
      // List all elements in shadow root with their overflow
      const allShadow = accordionItem.shadowRoot.querySelectorAll('*');
      results.shadowElements = Array.from(allShadow).slice(0, 10).map(el => ({
        tag: el.tagName,
        class: el.className,
        overflow: getComputedStyle(el).overflow,
        maxHeight: getComputedStyle(el).maxHeight,
        height: getComputedStyle(el).height?.substring(0, 30),
      }));
    }

    // Check the wrapper div around accordion + add buttons
    const wrapperDiv = tabContent?.firstElementChild as HTMLElement;
    if (wrapperDiv) {
      results.wrapperDiv = {
        tag: wrapperDiv.tagName,
        clientHeight: wrapperDiv.clientHeight,
        scrollHeight: wrapperDiv.scrollHeight,
        overflow: getComputedStyle(wrapperDiv).overflow,
      };
    }

    return results;
  });

  console.log(JSON.stringify(measurements, null, 2));

  // Try to scroll to the very bottom
  const canScroll = await page.evaluate(() => {
    const tc = document.querySelector('.tab-content') as HTMLElement;
    const before = tc.scrollTop;
    tc.scrollTop = tc.scrollHeight;
    const after = tc.scrollTop;
    return { before, after, scrollHeight: tc.scrollHeight, clientHeight: tc.clientHeight, scrollable: after > before };
  });
  console.log('Scroll test:', canScroll);

  await page.screenshot({ path: 'tests/screenshots/scroll-debug-bottom.png', fullPage: false });
});
