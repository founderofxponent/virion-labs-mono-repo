import { test, expect } from '@playwright/test';

test.describe('Admin Campaign Management', () => {
  // Set a longer timeout for the entire test suite
  test.setTimeout(120000); // 2 minutes

  // Login as admin before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('Email').fill('vercilliusjrmila+johnadmin@gmail.com');
    await page.getByLabel('Password').fill('johnadmin');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForSelector('h1:has-text("Admin Dashboard")');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 20000 });
  });

  test('should allow an admin to create a new campaign from start to finish', async ({ page }) => {
    // Navigate to the bot campaigns page
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await expect(page.getByRole('heading', { name: 'Bot Campaigns' })).toBeVisible({ timeout: 20000 });

    // Click the "Create Campaign" button and wait for the wizard to load
    await page.getByRole('button', { name: 'Create Campaign' }).click();
    await page.waitForSelector('h1:has-text("Create New Campaign")');
    await expect(page.getByRole('heading', { name: 'Create New Campaign' })).toBeVisible({ timeout: 20000 });

    const campaignName = `Test Campaign ${Date.now()}`;
    const nextButton = page.locator('div.flex.justify-between button', { hasText: 'Next' });

    // --- Step 1: Vitals ---
    await expect(page.locator('div.text-2xl.font-semibold').first()).toHaveText('Vitals', { timeout: 10000 });
    await page.getByLabel('Campaign Name').fill(campaignName);
    await page.getByText('Select a client').click();
    await page.getByRole('option', { name: 'Test Client' }).click();
    await page.getByText('Select a template').click();
    await page.getByRole('option', { name: 'Referral Onboarding' }).click();
    await page.getByLabel('Description').fill('This is a test campaign created by Playwright.');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // --- Step 2: Placement & Schedule ---
    await expect(page.locator('div.text-2xl.font-semibold').first()).toHaveText('Placement & Schedule', { timeout: 10000 });
    await page.getByLabel('Discord Server ID (Guild ID)').fill('123456789012345678');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // --- Step 3: Bot Identity ---
    await expect(page.locator('div.text-2xl.font-semibold').first()).toHaveText('Bot Identity', { timeout: 10000 });
    await page.getByLabel('Bot Name').fill('TestCampaign Bot');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // --- Step 4: Onboarding Flow ---
    await expect(page.locator('div.text-2xl.font-semibold').first()).toHaveText('Onboarding Flow', { timeout: 10000 });
    await page.getByLabel('Welcome Message').fill('Welcome to the test campaign!');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // --- Step 5: Access & Moderation ---
    await expect(page.locator('div.text-2xl.font-semibold').first()).toHaveText('Access & Moderation', { timeout: 10000 });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // --- Step 6: Advanced ---
    await expect(page.locator('div.text-2xl.font-semibold').first()).toHaveText('Advanced', { timeout: 10000 });
    await page.locator('#template-select').click();
    await page.getByRole('option', { name: 'Start from blank' }).click();
    
    const saveButton = page.getByRole('button', { name: 'Save Campaign' });
    await expect(saveButton).toBeEnabled({ timeout: 10000 });
    await saveButton.click();

    // --- Final Verification ---
    await expect(page.getByRole('heading', { name: 'Bot Campaigns' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('cell', { name: campaignName })).toBeVisible({ timeout: 10000 });
    
    console.log(`Successfully created and verified campaign: "${campaignName}"`);
  });
}); 