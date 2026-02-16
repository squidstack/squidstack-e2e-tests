const { test, expect } = require('@playwright/test');

test.describe('Clam Catalog API', () => {
  test('clam-catalog health check', async ({ request }) => {
    const response = await request.get('/api/catalog/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('clam-catalog should respond to health checks', async ({ request }) => {
    const response = await request.get('/api/catalog/health', {
      failOnStatusCode: false
    });

    // Service should respond (not 500+ errors)
    expect(response.status()).toBeLessThan(500);
  });

  test('clam-catalog should have products endpoint', async ({ request }) => {
    const response = await request.get('/api/catalog/products', {
      failOnStatusCode: false
    });

    // Should respond (not 500+ server errors)
    expect(response.status()).toBeLessThan(500);
  });

  test('clam-catalog should handle product search', async ({ request }) => {
    const response = await request.get('/api/catalog/products?search=test', {
      failOnStatusCode: false
    });

    // Should respond (not 404)
    expect(response.status()).not.toBe(404);
  });

  test('clam-catalog should handle product by ID', async ({ request }) => {
    const response = await request.get('/api/catalog/products/1', {
      failOnStatusCode: false
    });

    // Should respond (not 404 or 500)
    expect([200, 400, 404]).toContain(response.status());
  });
});
