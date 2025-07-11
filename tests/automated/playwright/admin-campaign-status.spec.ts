import { test, expect } from '@playwright/test';

test.describe('Admin Campaign Status Management', () => {
  test('should allow an admin to create, pause, activate, archive, and then delete a campaign', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for this specific test

    const campaignName = `Status Test Campaign ${Date.now()}`;

    // --- 1. Login ---
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('Email').fill('vercilliusjrmila+johnadmin@gmail.com');
    await page.getByLabel('Password').fill('johnadmin');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 20000 });

    // --- 2. Navigate to Campaigns Page ---
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await expect(page.getByRole('heading', { name: 'Bot Campaigns' })).toBeVisible({ timeout: 20000 });
    // Wait for the table to have at least one row, indicating it has loaded.
    await expect(page.locator('tbody > tr').first()).toBeVisible({ timeout: 20000 });

    // --- 3. Create a New Campaign for Testing ---
    await page.getByRole('button', { name: 'Create Campaign' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Campaign' })).toBeVisible({ timeout: 20000 });

    const nextButton = page.locator('div.flex.justify-between button', { hasText: 'Next' });

    // Fill out the wizard
    await page.getByLabel('Campaign Name').fill(campaignName);
    await page.getByText('Select a client').click();
    await page.getByRole('option', { name: 'Test Client' }).click();
    await page.getByText('Select a template').click();
    await page.getByRole('option', { name: 'Referral Onboarding' }).click();
    await nextButton.click();
    await page.getByLabel('Discord Server ID (Guild ID)').fill('123456789012345678');
    await nextButton.click();
    await nextButton.click(); // Bot Identity
    await nextButton.click(); // Onboarding Flow
    await nextButton.click(); // Access & Moderation
    const saveButton = page.getByRole('button', { name: 'Save Campaign' });
    await expect(saveButton).toBeEnabled({ timeout: 10000 });
    await saveButton.click();

    // Verify campaign is created by waiting for its row to appear in the table.
    await expect(page.getByRole('heading', { name: 'Bot Campaigns' })).toBeVisible({ timeout: 30000 });
    const row = page.getByRole('row', { name: campaignName });
    await expect(row).toBeVisible({ timeout: 20000 });

    const toast = page.locator('li[role="status"]');

    // --- 4. Pause, Activate, and Archive the Campaign ---

    // PAUSE
    await row.locator('td:last-child button').click();
    await page.getByRole('menuitem', { name: 'Pause' }).click();
    await expect(toast).toBeVisible();
    await expect(toast).not.toBeVisible({ timeout: 10000 });
    await expect(row.getByText('Paused')).toBeVisible({ timeout: 10000 });

    // ACTIVATE (RESUME)
    await row.locator('td:last-child button').click();
    await page.getByRole('menuitem', { name: 'Resume' }).click();
    await expect(toast).toBeVisible();
    await expect(toast).not.toBeVisible({ timeout: 10000 });
    await expect(row.getByText('Active')).toBeVisible({ timeout: 10000 });

    // ARCHIVE
    await row.locator('td:last-child button').click();
    await page.once('dialog', dialog => dialog.accept());
    await page.getByRole('menuitem', { name: 'Archive' }).click();
    await expect(toast).toBeVisible();
    await expect(toast).not.toBeVisible({ timeout: 10000 });
    
    // Set the filter to 'Archived' to find the campaign
    await page.getByRole('combobox').nth(2).click(); // Clicks the Status filter
    await page.getByRole('option', { name: 'Archived' }).click();

    // Re-locate the row in the new filtered view
    const archivedRow = page.getByRole('row', { name: campaignName });
    await expect(archivedRow.getByText('Archived')).toBeVisible({ timeout: 10000 });

    // --- 5. Clean Up: Permanently Delete the Campaign ---
    await archivedRow.locator('td:last-child button').click();
    await page.once('dialog', dialog => dialog.accept());
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(toast).toBeVisible();
    await expect(toast).not.toBeVisible({ timeout: 10000 });
    await expect(archivedRow).not.toBeVisible({ timeout: 10000 });
  });
}); 