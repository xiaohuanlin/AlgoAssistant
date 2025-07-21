import { test, expect } from '@playwright/test';

test.describe('Review E2E Integration', () => {
  test('should login and render review list', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
    await page.goto('http://localhost:3000/review');
    await expect(page.locator('.review-list')).toBeVisible();
  });

  // TODO: Add more tests for filter, detail, create, batch mark, batch delete
});
