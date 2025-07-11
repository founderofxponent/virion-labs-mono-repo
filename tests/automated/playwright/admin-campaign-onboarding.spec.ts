import { test, expect } from '@playwright/test';

test.describe('Admin Campaign Onboarding Fields Management in Campaign Wizard', () => {
  test.setTimeout(180000); // 3 minutes

  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('Email').fill('vercilliusjrmila+johnadmin@gmail.com');
    await page.getByLabel('Password').fill('johnadmin');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 20000 });
    
    // Navigate to bot campaigns page by clicking the link
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await expect(page.getByRole('heading', { name: 'Bot Campaigns' })).toBeVisible({ timeout: 20000 });
    // Wait for the table to have at least one row, indicating it has loaded.
    await expect(page.locator('tbody > tr').first()).toBeVisible({ timeout: 20000 });
  });

  test('should allow an admin to manage onboarding fields within the campaign wizard', async ({ page }) => {
    // Listen for all console events and log them to the test's output
    page.on('console', msg => console.log(`Browser Console: ${msg.text()}`));

    // --- SETUP: Navigate to edit campaign ---
    // 1. Click the first campaign's actions button, then the edit button
    const firstRow = page.locator('tbody').getByRole('row').first();
    await firstRow.locator('td:last-child button').click(); // Clicks the action menu button
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    
    // Wait for the main content area to be ready before looking for the wizard
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });

    await expect(page.getByRole('heading', { name: 'Edit Campaign' })).toBeVisible({ timeout: 20000 });

    // 2. Navigate to the "Onboarding Flow" tab by clicking through the previous tabs
    await expect(page.getByRole('button', { name: 'Vitals' })).toBeVisible({ timeout: 20000 }); // Ensure wizard is loaded
    
    await page.getByRole('button', { name: 'Placement & Schedule' }).click();
    await expect(page.getByLabel('Discord Server ID (Guild ID)')).toBeVisible();

    await page.getByRole('button', { name: 'Bot Identity' }).click();
    await expect(page.getByLabel('Bot Name')).toBeVisible();

    await page.getByRole('button', { name: 'Onboarding Flow' }).click();
    await expect(page.getByRole('heading', { name: 'Onboarding Questions' })).toBeVisible();

    const questionText = `Test Question ${Date.now()}`;
    const updatedQuestionText = `${questionText} - Edited`;

    // --- CREATE ---
    // 3. Add a new question
    await page.getByRole('button', { name: 'Add Question' }).click();

    // Find the new question form (the last one) and fill it out
    const newQuestionForm = page.locator('.p-4.border.rounded-lg').last();
    await expect(newQuestionForm).toBeVisible();

    const questionInput = newQuestionForm.getByLabel('Question Label');
    await questionInput.fill(questionText);

    // Verify the new question's input field has the correct text
    await expect(questionInput).toHaveValue(questionText);

    // --- EDIT ---
    // 4. Edit the newly created question by changing the text
    await questionInput.fill(updatedQuestionText);
    
    // Verify the question text was updated
    await expect(questionInput).toHaveValue(updatedQuestionText);

    // --- DELETE ---
    // 5. Delete the question
    await newQuestionForm.getByRole('button', { name: 'Delete question' }).click();
    
    // Verify the question form containing the specific text is no longer visible
    await expect(page.locator('.p-4.border.rounded-lg', { hasText: updatedQuestionText })).not.toBeVisible();

    // --- SAVE CAMPAIGN ---
    // 6. Navigate to the final tab to enable the save button
    await page.getByRole('button', { name: 'Access & Moderation' }).click();
    await expect(page.getByLabel('Enable Moderation')).toBeVisible();
    
    await page.getByRole('button', { name: 'Advanced' }).click();
    await expect(page.getByRole('heading', { name: 'Landing Page Configuration' })).toBeVisible();

    // 7. Save the campaign to persist changes
    await page.getByRole('button', { name: 'Save Campaign' }).click();

    // Verify toast confirmation
    await expect(page.getByText('Campaign updated successfully!')).toBeVisible({ timeout: 20000 });
  });
}); 