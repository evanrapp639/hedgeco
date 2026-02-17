import { test as setup, expect } from '@playwright/test';

/**
 * Global Setup for E2E Tests
 * 
 * This file runs before all tests and can be used to:
 * - Create authenticated states
 * - Set up test data
 * - Configure global test fixtures
 */

// Storage state path for authenticated sessions
export const STORAGE_STATE = 'e2e/.auth/user.json';
export const ADMIN_STORAGE_STATE = 'e2e/.auth/admin.json';

/**
 * Setup authenticated user session
 * Saves auth cookies/tokens to be reused in tests
 */
setup('authenticate as user', async ({ page }) => {
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;
  
  // Skip auth setup if no test credentials
  if (!testEmail || !testPassword) {
    console.log('Skipping user auth setup: TEST_USER_EMAIL or TEST_USER_PASSWORD not set');
    return;
  }
  
  // Navigate to login
  await page.goto('/login');
  
  // Fill login form
  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/password/i).fill(testPassword);
  
  // Submit
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  
  // Save storage state for reuse
  await page.context().storageState({ path: STORAGE_STATE });
});

/**
 * Setup admin user session
 */
setup('authenticate as admin', async ({ page }) => {
  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD;
  
  // Skip admin auth setup if no credentials
  if (!adminEmail || !adminPassword) {
    console.log('Skipping admin auth setup: TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD not set');
    return;
  }
  
  // Navigate to login
  await page.goto('/login');
  
  // Fill login form
  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);
  
  // Submit
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for redirect
  await expect(page).toHaveURL(/dashboard|admin/, { timeout: 15000 });
  
  // Save storage state
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
