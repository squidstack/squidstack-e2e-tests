const { test, expect } = require('@playwright/test');

test.describe('Octopus Payments API', () => {
  test('octopus-payments health check', async ({ request }) => {
    const response = await request.get('/api/payments/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('octopus-payments should respond to health checks', async ({ request }) => {
    const response = await request.get('/api/payments/health', {
      failOnStatusCode: false
    });

    // Service should respond (not 500+ errors)
    expect(response.status()).toBeLessThan(500);
  });

  test('octopus-payments should require auth for payment operations', async ({ request }) => {
    const response = await request.post('/api/payments/process', {
      data: {},
      failOnStatusCode: false
    });

    // Should respond (typically 401, 403, 405 without auth)
    expect([400, 401, 403, 405]).toContain(response.status());
  });
});
