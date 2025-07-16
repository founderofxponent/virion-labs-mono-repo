# Automated Testing Guide

This guide provides instructions on how to create and run automated end-to-end (E2E) tests for the Virion Labs platform.

## 1. Technology Stack

Our automated tests are built using **Playwright**, a modern and reliable framework for browser automation.

- **Language**: TypeScript
- **Test Runner**: Playwright Test
- **Key Features**: Auto-waits, resilient selectors, and detailed test tracing.

## 2. Project Structure

All automated tests are located in the `tests/automated/playwright/` directory. Each test file should correspond to a specific feature or user flow and end with the `.spec.ts` extension.

```
/tests
|-- /automated
|   |-- /playwright
|   |   |-- admin-login.spec.ts
|   |   |-- admin-campaign-creation.spec.ts
|   |   |-- ... (other test files)
|-- /manual
|-- TESTING_PROGRESS.md
|-- ...
```

## 3. How to Write a New Test

Follow these steps to create a new test file. We'll use the "Admin Campaign Creation" test as an example.

### Step 1: Create the Test File

Create a new file in `tests/automated/playwright/` (e.g., `feature-name.spec.ts`).

### Step 2: Import Dependencies

At the top of your file, import `test` and `expect` from Playwright.

```typescript
import { test, expect } from '@playwright/test';
```

### Step 3: Structure the Test with `test.describe`

Use `test.describe` to group related tests for a feature. This keeps your tests organized.

```typescript
test.describe('Admin Campaign Management', () => {
  // Your tests will go here
});
```

### Step 4: Use `beforeEach` for Setup (like Logging In)

If multiple tests require the same setup steps (e.g., logging in), use a `beforeEach` hook. This runs before every test in the `describe` block, reducing code duplication.

```typescript
test.describe('Admin Campaign Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('Email').fill('vercilliusjrmila+johnadmin@gmail.com');
    await page.getByLabel('Password').fill('johnadmin');
    await page.getByRole('button', { name: 'Sign in' }).click();
    // IMPORTANT: Wait for a unique element on the destination page to appear
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 20000 });
  });

  // ... your tests
});
```

### Step 5: Write the Test Logic with `test()`

Each individual test case is written inside a `test()` function. Give it a clear, descriptive name.

The test logic should mimic user actions: navigating, clicking, filling forms, etc.

**Best Practices for Stable Tests:**
- **Use Resilient Selectors**: Prefer user-facing roles and text (`getByRole`, `getByLabel`, `getByText`) over brittle CSS selectors where possible.
- **Wait for Conditions, Not Time**: Never use fixed timeouts like `page.waitForTimeout()`. Instead, wait for an element to be ready before interacting with it.
- **Wait for Buttons to be Enabled**: Before clicking a button, especially one that might be disabled while data loads, wait for it to be enabled.
- **Wait for Headings/Elements after Navigation**: After clicking a link or button that causes a page navigation, wait for a unique element on the *new* page to be visible. This is much more reliable than waiting for a URL to change.

**Example from our campaign creation test:**

```typescript
test('should allow an admin to create a new campaign', async ({ page }) => {
  // 1. Navigate and wait for the page to load
  await page.getByRole('link', { name: 'Campaigns' }).click();
  await expect(page.getByRole('heading', { name: 'Bot Campaigns' })).toBeVisible({ timeout: 20000 });

  // 2. Click the create button and wait for the wizard
  await page.getByRole('button', { name: 'Create Campaign' }).click();
  await expect(page.getByRole('heading', { name: 'Create New Campaign' })).toBeVisible({ timeout: 20000 });

  // 3. Interact with the form
  const campaignName = `Test Campaign ${Date.now()}`;
  await page.getByLabel('Campaign Name').fill(campaignName);
  
  // 4. Wait for the "Next" button to be enabled before clicking
  const nextButton = page.locator('div.flex.justify-between button', { hasText: 'Next' });
  await expect(nextButton).toBeEnabled();
  await nextButton.click();

  // 5. Verify the result of the action
  await expect(page.locator('div.text-2xl.font-semibold').first()).toHaveText('Placement & Schedule', { timeout: 10000 });

  // ... continue for all steps
});
```

## 4. How to Run Tests

You can run tests from the command line in the root of the `virion-labs-mono-repo` project.

### Run All Tests

To run all automated tests in the project:
```bash
npx playwright test
```

### Run a Specific Test File

To run a single test file, provide the path to the file:
```bash
npx playwright test tests/automated/playwright/admin-campaign-creation.spec.ts
```

### Run Tests in "Headed" Mode (With a Visible Browser)

To watch the test execute in a real browser window, add the `--headed` flag. This is extremely useful for debugging.
```bash
npx playwright test --headed
```

### View the Test Report

After a test run is complete, Playwright generates a detailed HTML report. You can open it with this command:
```bash
npx playwright show-report
```
This report allows you to see videos, traces, and error logs for each test, making it easy to diagnose failures. 