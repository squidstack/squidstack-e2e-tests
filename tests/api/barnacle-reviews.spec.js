const { test, expect } = require('@playwright/test');

test.describe('Barnacle Reviews API', () => {
  test('barnacle-reviews health check', async ({ request }) => {
    const response = await request.get('/api/reviews/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('barnacle-reviews should respond to health checks', async ({ request }) => {
    const response = await request.get('/api/reviews/health', {
      failOnStatusCode: false
    });

    // Service should respond (not 500+ errors)
    expect(response.status()).toBeLessThan(500);
  });

  test('barnacle-reviews should have reviews endpoint', async ({ request }) => {
    const response = await request.get('/api/reviews', {
      failOnStatusCode: false
    });

    // Should respond (not 404)
    expect(response.status()).not.toBe(404);
  });

  test('barnacle-reviews should handle product reviews', async ({ request }) => {
    const response = await request.get('/api/reviews/product/1', {
      failOnStatusCode: false
    });

    // Should respond (not 500)
    expect(response.status()).toBeLessThan(500);
  });
});
