import { test, expect } from '@playwright/test';

test.describe('Admin Campaign Configuration', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('Email').fill('vercilliusjrmila+johnadmin@gmail.com');
    await page.getByLabel('Password').fill('johnadmin');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForSelector('h1:has-text("Admin Dashboard")');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 20000 });
  });

  test('should allow an admin to configure an existing campaign', async ({ page }) => {
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await page.waitForURL('**/bot-campaigns');
    await expect(page.getByRole('heading', { name: 'Bot Campaigns' })).toBeVisible({ timeout: 20000 });

    await expect(page.locator('table > tbody > tr').first()).toBeVisible({ timeout: 20000 });
    
    const firstRow = page.locator('table > tbody > tr').first();
    const originalCampaignName = await firstRow.locator('td').first().locator('div.font-medium').textContent();

    expect(originalCampaignName, "The campaign name should not be empty.").not.toBeNull();
    console.log(`Original campaign name: "${originalCampaignName}"`);

    await firstRow.locator('td:last-child button').click();
    await page.getByRole('menuitem', { name: 'Edit Campaign' }).click();
    
    await page.waitForURL('**/bot-campaigns/*/edit', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Edit Campaign' })).toBeVisible();

    await expect(page.locator('div.animate-pulse')).not.toBeVisible({ timeout: 20000 });
    
    await page.getByRole('button', { name: 'Bot Identity' }).click();
    await page.getByLabel('Bot Name').fill(`Bot-${Date.now()}`);

    const nextButton = page.locator('div.mt-6.flex.justify-between button', { hasText: 'Next' });
    await nextButton.click(); // To Onboarding Flow
    await nextButton.click(); // To Access & Moderation
    await nextButton.click(); // To Advanced
    
    const saveButton = page.getByRole('button', { name: 'Save Campaign' });
    await expect(saveButton).toBeEnabled({ timeout: 10000 });

    // Wait for the navigation to complete after clicking Save
    await Promise.all([
        page.waitForURL('**/bot-campaigns', { timeout: 30000 }), // Increased timeout
        saveButton.click()
    ]);

    console.log(`Current URL: ${page.url()}`);

    await expect(page.getByRole('heading', { name: 'Bot Campaigns' })).toBeVisible();
    
    console.log(`Successfully updated bot name for campaign: "${originalCampaignName}"`);
  });
}); 