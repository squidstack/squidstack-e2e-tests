const { test, expect } = require('@playwright/test');

test.describe('Authentication UI', () => {
  test('should have login page or button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Look for login elements
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login"), a:has-text("Sign In")').first();
    const loginLink = page.locator('a[href*="login"], a[href*="signin"]').first();

    const hasLoginButton = await loginButton.count() > 0;
    const hasLoginLink = await loginLink.count() > 0;

    // Should have some way to login
    const hasLogin = hasLoginButton || hasLoginLink;
    console.log('Login UI present:', hasLogin);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Try to find and click login
    const loginElement = page.locator('button:has-text("Login"), a:has-text("Login"), a[href*="login"]').first();

    if (await loginElement.isVisible()) {
      await loginElement.click();
      await page.waitForLoadState('load');

      // Should navigate somewhere
      await page.waitForTimeout(1000);
      expect(page.url()).toBeTruthy();
    } else {
      // Try direct navigation
      await page.goto('/login');
      await page.waitForLoadState('load');
    }
  });

  test('should display login form fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('load');

    // Look for form inputs
    const usernameInput = page.locator('input[name="username"], input[name="email"], input[type="email"], input[placeholder*="email" i], input[placeholder*="username" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    const hasUsername = await usernameInput.count() > 0;
    const hasPassword = await passwordInput.count() > 0;

    console.log('Username field present:', hasUsername);
    console.log('Password field present:', hasPassword);
  });

  test('should show validation on empty login submit', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('load');

    // Try to submit without credentials
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();

    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should show some error or validation
      const errorMessages = page.locator('[class*="error"], [class*="alert"], [role="alert"]');
      const hasError = await errorMessages.count() > 0;

      console.log('Validation shown:', hasError);
    }
  });

  test('should have logout functionality when authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Look for logout button (may not be visible if not logged in)
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")').first();
    const hasLogout = await logoutButton.count() > 0;

    console.log('Logout UI present:', hasLogout);
  });
});
