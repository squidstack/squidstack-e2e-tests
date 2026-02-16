const { test, expect } = require('@playwright/test');

test.describe('Nautilus Inventory API', () => {
  test('nautilus-inventory health check', async ({ request }) => {
    const response = await request.get('/api/inventory/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('nautilus-inventory should respond to health checks', async ({ request }) => {
    const response = await request.get('/api/inventory/health', {
      failOnStatusCode: false
    });

    // Service should respond (not 500+ errors)
    expect(response.status()).toBeLessThan(500);
  });

  test('nautilus-inventory should have stock endpoint', async ({ request }) => {
    const response = await request.get('/api/inventory/stock/1', {
      failOnStatusCode: false
    });

    // Should respond (not 404)
    expect(response.status()).not.toBe(404);
  });
});
