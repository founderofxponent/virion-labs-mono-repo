import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test('should allow an admin to log in successfully', async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:3000/login');

    // Enter admin credentials
    await page.getByLabel('Email').fill('vercilliusjrmila+johnadmin@gmail.com');
    await page.getByLabel('Password').fill('johnadmin');

    // Click the login button
    await page.getByRole('button', { name: 'Sign in' }).click();

    // The redirect is handled by a useEffect, so instead of waiting for the URL,
    // we will wait for an element on the destination page to be visible.
    const dashboardHeader = page.getByRole('heading', { name: 'Admin Dashboard' });
    await expect(dashboardHeader).toBeVisible({ timeout: 10000 }); // Wait up to 10 seconds

    // Also, verify that admin-specific navigation is present
    const campaignsLink = page.getByRole('link', { name: 'Campaigns' });
    await expect(campaignsLink).toBeVisible();
  });
}); 