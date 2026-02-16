# Squidstack E2E Tests

End-to-end testing framework for the Squidstack microservices application using Playwright. Runs after deployment to validate the complete application stack (UI + all backend APIs).

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Test Organization](#test-organization)
- [Adding New Tests](#adding-new-tests)
- [Workflow Integration](#workflow-integration)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Technical Details](#technical-details)

---

## Overview

**What it does:**
- Validates the deployed Squidstack application is working correctly
- Tests UI functionality via browser automation (Playwright + Chromium)
- Tests backend APIs directly (health checks, endpoints, auth)
- Runs automatically after each deployment in CloudBees workflows
- Generates detailed evidence reports with test results

**Why this approach:**
- Tests are deployed as a Kubernetes Deployment (not a Job) that stays running
- Tests are stored in a ConfigMap (mounted at runtime) rather than baked into Docker image
- Tests are executed on-demand via `kubectl exec` from the workflow
- This allows test updates without rebuilding Docker images

---

## Architecture

### Deployment Model

```
┌─────────────────────────────────────────────────────┐
│  CloudBees Workflow (squid-release-with-manifest)   │
│  ─────────────────────────────────────────────────  │
│  1. Deploy all services (UI + APIs)                 │
│  2. Deploy E2E test framework (Helm)                │
│  3. kubectl exec into test pod                      │
│  4. Run: npx playwright test --reporter=list        │
│  5. Parse output & generate evidence                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Kubernetes Cluster                                  │
│  ─────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────┐   │
│  │ Deployment: squidstack-e2e-tests            │   │
│  │ - Container stays running (tail -f /dev/null)│   │
│  │ - Has Playwright + Chromium installed       │   │
│  │ - Mounts ConfigMap at /app/tests/           │   │
│  └─────────────────────────────────────────────┘   │
│                       ↓                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ ConfigMap: squidstack-e2e-tests-tests       │   │
│  │ - Auto-populated from chart/tests/**/*.js   │   │
│  │ - Contains all test files                   │   │
│  │ - Updated on Helm upgrade                   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Key Components

1. **Docker Image** (`gururepservice/squidstack-e2e-tests:latest`)
   - Based on `mcr.microsoft.com/playwright:v1.40.0-jammy`
   - Contains Playwright, Chromium, and test runner setup
   - Does NOT contain test files (they come from ConfigMap)

2. **Helm Chart** (`chart/`)
   - Deploys a Kubernetes Deployment (not Job)
   - Creates ConfigMap from `chart/tests/` directory
   - Mounts ConfigMap to `/app/tests/`

3. **Tests** (`chart/tests/`)
   - Organized in `ui/` and `api/` subdirectories
   - Automatically loaded into ConfigMap by Helm
   - No workflow changes needed when adding tests

---

## Test Organization

```
chart/tests/
├── ui/                          # UI tests (browser automation)
│   ├── home.spec.js            # Home page tests (5 tests)
│   ├── catalog.spec.js         # Catalog/product tests (5 tests)
│   ├── navigation.spec.js      # Routing, navigation (5 tests)
│   └── auth.spec.js            # Login/logout UI (5 tests)
└── api/                         # API tests (direct HTTP)
    ├── kraken-auth.spec.js     # Auth service (4 tests)
    ├── clam-catalog.spec.js    # Catalog service (5 tests)
    ├── barnacle-reviews.spec.js # Reviews service (4 tests)
    ├── cuttlefish-orders.spec.js # Orders service (3 tests)
    ├── nautilus-inventory.spec.js # Inventory service (3 tests)
    └── octopus-payments.spec.js  # Payments service (3 tests)
```

**Total: 42 tests**
- 20 UI tests (validate user-facing functionality)
- 22 API tests (validate backend services)

### Test Patterns

**UI Tests:**
```javascript
test('should load the home page successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Squid/i);
});
```

**API Tests:**
```javascript
test('kraken-auth health check', async ({ request }) => {
  const response = await request.get('/api/auth/health');
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);
});
```

---

## Adding New Tests

### Quick Start

1. **Create a new test file:**
   ```bash
   cd chart/tests/ui/  # or chart/tests/api/
   touch my-new-feature.spec.js
   ```

2. **Write your test:**
   ```javascript
   const { test, expect } = require('@playwright/test');

   test.describe('My New Feature', () => {
     test('should do something', async ({ page }) => {
       await page.goto('/my-feature');
       // ... test logic
     });
   });
   ```

3. **Commit and push:**
   ```bash
   git add chart/tests/ui/my-new-feature.spec.js
   git commit -m "Add tests for new feature"
   git push
   ```

4. **That's it!** The next deployment will:
   - Automatically include your test in the ConfigMap
   - Run it along with all other tests
   - Show results in evidence

### Important Notes

- **File names must be unique** across both `ui/` and `api/` folders (ConfigMap flattens structure)
- **No workflow changes needed** - tests are auto-discovered
- **No Docker rebuild needed** - tests come from ConfigMap
- Tests use `baseUrl` from environment variable (set via Helm values)

---

## Workflow Integration

### How It Works

The E2E tests run as part of `squid-release-with-manifest.yaml` workflow:

```yaml
e2e-tests:
  needs: [all-services-deployed]
  steps:
    - name: Deploy E2E test framework
      uses: cloudbees-io/helm-install@v1
      with:
        chart-location: ./chart
        release-name: squidstack-e2e-tests

    - name: Wait for test pod to be ready
      run: kubectl wait --for=condition=ready pod ...

    - name: Run E2E tests and collect results
      run: |
        POD=$(kubectl get pod -l app=squidstack-e2e-tests ...)
        TEST_OUTPUT=$(kubectl exec $POD -- npx playwright test --reporter=list)
        # Parse results and generate evidence
```

### Evidence Output

The workflow generates comprehensive evidence showing:

```markdown
## Test Summary
| Metric      | Value      |
|-------------|------------|
| Status      | ✅ PASSED  |
| Passed      | 42         |
| Failed      | 0          |
| Duration    | (16.3s)    |

## Environment Details
- Environment: squid-demo-3
- Base URL: https://squid-demo-3.guru-rep.sa-demo.beescloud.com
- Pod: squidstack-e2e-tests-...

## Test Cases
| Status | Test Description                          |
|--------|-------------------------------------------|
| ✅     | should load the home page successfully    |
| ✅     | kraken-auth health check                  |
| ...    | (all 42 tests listed)                     |

## Detailed Test Output
[Full Playwright output]
```

### Workflow Behavior

- **Tests passing:** Workflow continues ✅, evidence shows PASSED
- **Tests failing:** Workflow continues ⚠️, evidence shows FAILED (does not fail the workflow)
- **Pod OOM:** Evidence shows warning about resource limits

---

## Configuration

### Helm Values (`chart/values.yaml`)

```yaml
image:
  repository: gururepservice/squidstack-e2e-tests
  tag: latest
  pullPolicy: Always

baseUrl: "https://squid-demo-3.guru-rep.sa-demo.beescloud.com"

resources:
  limits:
    cpu: 2000m      # 2 CPUs (needed for Chromium)
    memory: 4Gi     # 4GB RAM (42 tests with browser)
  requests:
    cpu: 1000m      # 1 CPU
    memory: 2Gi     # 2GB RAM
```

### Key Settings

- **baseUrl**: Target application URL (set per environment)
- **resources**: MUST have enough memory for Playwright + Chromium
  - Too little memory → OOM kill (exit code 137)
  - Minimum: 2Gi memory, 1000m CPU
  - Recommended: 4Gi memory, 2000m CPU

### Playwright Config (`playwright.config.js`)

```javascript
module.exports = {
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    trace: 'retain-on-failure',
  },
  retries: 2,  // Retry flaky tests
  timeout: 30000,
};
```

---

## Troubleshooting

### Common Issues

#### 1. "No tests found"

**Symptoms:**
```
Error: No tests found
```

**Causes:**
- Tests not in `chart/tests/` directory
- Helm can't see test files (they were outside `chart/`)

**Solution:**
- Ensure tests are in `chart/tests/ui/` or `chart/tests/api/`
- Check ConfigMap: `kubectl get cm squidstack-e2e-tests-tests -o yaml`

#### 2. Exit code 137 (OOM Killed)

**Symptoms:**
```
command terminated with exit code 137
```

**Causes:**
- Not enough memory for Playwright + Chromium
- 42 tests running sequentially need significant RAM

**Solution:**
- Increase `resources.limits.memory` in `values.yaml`
- Current setting: 4Gi (sufficient for 42 tests)

#### 3. Tests show as FAILED when all passed

**Symptoms:**
- Evidence shows "Status: ❌ FAILED"
- But all individual tests show ✅

**Causes:**
- Shell parsing issues in workflow
- `grep -c` returning "00" instead of "0"

**Solution:**
- This was fixed in workflow commit `cd35dfd`
- Uses `|| true` instead of `|| echo "0"` for grep

#### 4. "sh: bad number" errors

**Symptoms:**
```
sh: 0: bad number
```

**Causes:**
- Arithmetic comparison in POSIX shell with non-clean variables
- Whitespace or extra characters in PASSED/FAILED variables

**Solution:**
- Fixed in workflow commit `bc2c85a`
- Uses string comparison (`=`) instead of arithmetic (`-eq`)

---

## Technical Details

### Why Deployment Instead of Job?

**Initial approach:** Used Kubernetes Job with Helm hooks
- ❌ Jobs run once and exit
- ❌ Can't easily re-run tests
- ❌ Harder to debug

**Current approach:** Kubernetes Deployment
- ✅ Pod stays running
- ✅ Run tests on-demand via `kubectl exec`
- ✅ Easy to debug: `kubectl exec -it $POD -- /bin/bash`
- ✅ Can re-run tests without redeploying

### Why ConfigMap for Tests?

**Benefits:**
- ✅ Update tests without rebuilding Docker image
- ✅ Faster iteration (just update ConfigMap)
- ✅ Tests tracked in git, versioned with releases
- ✅ Automatic discovery (no manual manifest updates)

**How it works:**
```yaml
# In chart/templates/configmap.yaml
data:
{{- range $path, $_ := .Files.Glob "tests/ui/*.spec.js" }}
  {{ trimPrefix "tests/ui/" $path }}: |
{{ $.Files.Get $path | indent 4 }}
{{- end }}
{{- range $path, $_ := .Files.Glob "tests/api/*.spec.js" }}
  {{ trimPrefix "tests/api/" $path }}: |
{{ $.Files.Get $path | indent 4 }}
{{- end }}
```

Helm reads all `.spec.js` files and creates ConfigMap entries.

### Version Pinning

**Critical:** Playwright version MUST match Docker image version

```json
// package.json
"dependencies": {
  "@playwright/test": "1.40.0"  // Exact version, no ^
}
```

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy
```

Mismatch causes: `Playwright Test or Playwright was just updated to X.X.X`

### Shell Compatibility

The workflow uses **Alpine's /bin/sh** (not bash). Key differences:

- Must use POSIX-compliant syntax
- String comparisons (`=`) safer than arithmetic (`-eq`)
- Quote all variables: `"${VAR}"`
- Use `|| true` not `|| echo "0"` with `grep -c`

---

## File Structure

```
squidstack-e2e-tests/
├── chart/
│   ├── Chart.yaml                    # Helm chart metadata
│   ├── values.yaml                   # Default values
│   ├── templates/
│   │   ├── deployment.yaml           # Kubernetes Deployment
│   │   └── configmap.yaml            # Auto-generated from tests/
│   └── tests/
│       ├── README.md                 # Test organization guide
│       ├── ui/                       # UI tests (20 tests)
│       │   ├── home.spec.js
│       │   ├── catalog.spec.js
│       │   ├── navigation.spec.js
│       │   └── auth.spec.js
│       └── api/                      # API tests (22 tests)
│           ├── kraken-auth.spec.js
│           ├── clam-catalog.spec.js
│           ├── barnacle-reviews.spec.js
│           ├── cuttlefish-orders.spec.js
│           ├── nautilus-inventory.spec.js
│           └── octopus-payments.spec.js
├── Dockerfile                        # Test runner image
├── package.json                      # Dependencies (Playwright 1.40.0)
├── package-lock.json                 # Locked versions
├── playwright.config.js              # Playwright settings
└── README.md                         # This file
```

---

## Quick Reference

### Run tests locally
```bash
npm install
BASE_URL=https://squid-demo-3.guru-rep.sa-demo.beescloud.com npm test
```

### Debug in cluster
```bash
# Get pod name
POD=$(kubectl get pod -l app=squidstack-e2e-tests -n squid-demo-3 -o jsonpath='{.items[0].metadata.name}')

# Run tests
kubectl exec -n squid-demo-3 $POD -- npx playwright test

# Debug interactively
kubectl exec -it -n squid-demo-3 $POD -- /bin/bash
```

### View ConfigMap
```bash
kubectl get configmap squidstack-e2e-tests-tests -n squid-demo-3 -o yaml
```

### Check resources
```bash
kubectl top pod -n squid-demo-3 -l app=squidstack-e2e-tests
```

---

## Summary

This E2E testing framework:
- ✅ Runs 42 tests (20 UI + 22 API) in ~16 seconds
- ✅ Automatically executes after every deployment
- ✅ Generates detailed evidence reports
- ✅ Requires no workflow changes when adding tests
- ✅ Provides fast feedback on application health
- ✅ Validates complete stack (UI → APIs → Database)

**To add a test:** Just create a `.spec.js` file in `chart/tests/` and commit. That's it!
