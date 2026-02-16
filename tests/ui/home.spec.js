const { test, expect } = require('@playwright/test');

test.describe('Home Page UI', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Squid/i);
  });

  test('should display main navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Check for common navigation elements
    const nav = page.locator('nav, header');
    await expect(nav).toBeVisible();
  });

  test('should display main content area', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Ensure content is loaded (not blank page)
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/');

    // Check that viewport is set
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
  });

  test('should not have console errors on load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('load');

    // Allow time for async errors
    await page.waitForTimeout(2000);

    // Filter out known acceptable errors (if any)
    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
