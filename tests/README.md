# E2E Tests

This directory contains all E2E tests for Squidstack.

## Structure

- **ui/** - UI tests that run in a browser using Playwright
- **api/** - Direct API endpoint tests for individual microservices

## Adding New Tests

To add a new test:
1. Create a new `.spec.js` file in either `ui/` or `api/` subdirectory
2. Commit and push to the repo
3. The Helm chart automatically includes the test in the ConfigMap
4. No workflow changes needed!

## Test Organization

All tests are automatically loaded into the ConfigMap and mounted into the test runner pod at `/app/tests/`.

The ConfigMap flattens the structure, so:
- `chart/tests/ui/home.spec.js` → `/app/tests/home.spec.js`
- `chart/tests/api/kraken-auth.spec.js` → `/app/tests/kraken-auth.spec.js`

File names must be unique across all subdirectories.
