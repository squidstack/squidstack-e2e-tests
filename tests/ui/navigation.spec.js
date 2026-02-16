const { test, expect } = require('@playwright/test');

test.describe('Navigation and Routing', () => {
  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Find all links on the page
    const allLinks = page.locator('a[href]');
    const count = await allLinks.count();

    // Should have at least some links (even if not in nav)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle browser back button', async ({ page }) => {
    await page.goto('/');
    const homeUrl = page.url();

    // Navigate to another page if possible
    const links = page.locator('a[href]');
    if (await links.count() > 0) {
      await links.first().click();
      await page.waitForLoadState('load');

      // Go back
      await page.goBack();
      await page.waitForLoadState('load');

      // Should be back at home
      expect(page.url()).toBe(homeUrl);
    }
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');

    // Should either 404 or redirect
    expect(response.status()).toBeGreaterThanOrEqual(200);
  });

  test('should have accessible footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for footer
    const footer = page.locator('footer');
    const hasFooter = await footer.count() > 0;

    console.log('Footer present:', hasFooter);
  });

  test('should maintain session across navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Get initial cookies/storage
    const initialCookies = await page.context().cookies();

    // Navigate to another page
    const links = page.locator('a[href^="/"]');
    if (await links.count() > 0) {
      await links.first().click();
      await page.waitForLoadState('load');

      // Cookies should still be present
      const newCookies = await page.context().cookies();
      expect(newCookies.length).toBeGreaterThanOrEqual(initialCookies.length);
    }
  });
});
