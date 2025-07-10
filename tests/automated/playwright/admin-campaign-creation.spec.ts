import { test, expect } from '@playwright/test';

test.describe('Admin Campaign Management', () => {
  // Login as admin before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('Email').fill('vercilliusjrmila+johnadmin@gmail.com');
    await page.getByLabel('Password').fill('johnadmin');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 10000 });
  });

  test('should allow an admin to create a new campaign', async ({ page }) => {
    // Navigate to the bot campaigns page
    await page.getByRole('link', { name: 'Campaigns' }).click();
    
    // Wait for the heading on the campaigns page to be visible
    await expect(page.getByRole('heading', { name: 'Bot Campaigns' })).toBeVisible({ timeout: 10000 });

    // Click the "Create Campaign" button
    await page.getByRole('button', { name: 'Create Campaign' }).click();

    // Verify we are in the campaign wizard by waiting for its heading
    await expect(page.getByRole('heading', { name: 'Create New Campaign' })).toBeVisible({ timeout: 10000 });

    // --- Step 1: Vitals ---
    // Target the card title specifically to avoid ambiguity with the sidebar tab
    await expect(page.locator('.space-y-1\\.5 > .text-2xl')).toHaveText('Vitals');

    // Fill out the campaign vitals
    const campaignName = `Test Campaign ${Date.now()}`;
    await page.getByLabel('Campaign Name').fill(campaignName);
    
    // Select a client
    await page.getByText('Select a client').click();
    await page.getByText('Test Client').click();

    // Select a template
    await page.getByText('Select a template').click();
    await page.getByText('Custom').click();

    // Fill in description
    await page.getByLabel('Description').fill('This is a test campaign created by Playwright.');

    // Proceed to the next step
    // Use a more specific selector to avoid conflict with Next.js dev tools
    await page.locator('div.flex.justify-between button', { hasText: 'Next' }).click();

    // Verify we are on the next step
    await expect(page.locator('.space-y-1\\.5 > .text-2xl')).toHaveText('Placement & Schedule');
  });
}); 