const { test, expect } = require('@playwright/test');

test.describe('Kraken Auth API', () => {
  test('kraken-auth health check', async ({ request }) => {
    const response = await request.get('/api/auth/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('kraken-auth should respond to health checks', async ({ request }) => {
    const response = await request.get('/api/auth/health', {
      failOnStatusCode: false
    });

    // Service should respond (not 500+ errors)
    expect(response.status()).toBeLessThan(500);
  });

  test('kraken-auth should have auth endpoints', async ({ request }) => {
    // Check that auth endpoints exist (may return 401/403 which is ok)
    const loginResponse = await request.post('/api/auth/login', {
      data: {},
      failOnStatusCode: false
    });

    // Should respond (not 404)
    expect(loginResponse.status()).not.toBe(404);
  });

  test('kraken-auth should reject invalid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'invalid',
        password: 'invalid'
      },
      failOnStatusCode: false
    });

    // Should reject (not 200, 201, or 500+)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});
