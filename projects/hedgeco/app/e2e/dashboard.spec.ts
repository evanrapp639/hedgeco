import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 * 
 * Tests for investor, manager, and provider dashboard rendering
 * and role-based content visibility
 */

test.describe('Dashboard', () => {
  test.describe('Investor Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Use investor credentials if available
      const investorEmail = process.env.TEST_USER_EMAIL;
      const investorPassword = process.env.TEST_USER_PASSWORD;
      
      if (investorEmail && investorPassword) {
        await page.goto('/login');
        await page.getByLabel(/email/i).fill(investorEmail);
        await page.getByLabel(/password/i).fill(investorPassword);
        await page.getByRole('button', { name: /sign in/i }).click();
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
      }
    });

    test('should render investor dashboard with welcome message', async ({ page }) => {
      const testEmail = process.env.TEST_USER_EMAIL;
      if (!testEmail) {
        test.skip();
        return;
      }
      
      await page.goto('/dashboard');
      
      // Check welcome message
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
      
      // Check for investor-specific content
      await expect(page.getByText(/track your fund research/i)).toBeVisible();
    });

    test('should display investor quick stats', async ({ page }) => {
      const testEmail = process.env.TEST_USER_EMAIL;
      if (!testEmail) {
        test.skip();
        return;
      }
      
      await page.goto('/dashboard');
      
      // Check for investor stat cards
      await expect(page.getByText(/watchlist/i).first()).toBeVisible();
      await expect(page.getByText(/searches/i).first()).toBeVisible();
      await expect(page.getByText(/messages/i).first()).toBeVisible();
      await expect(page.getByText(/documents/i).first()).toBeVisible();
    });

    test('should display quick action buttons', async ({ page }) => {
      const testEmail = process.env.TEST_USER_EMAIL;
      if (!testEmail) {
        test.skip();
        return;
      }
      
      await page.goto('/dashboard');
      
      // Check for action buttons
      await expect(page.getByRole('link', { name: /browse funds/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /view watchlist/i })).toBeVisible();
    });
  });

  test.describe('Manager Dashboard', () => {
    test('should render manager dashboard when logged in as manager', async ({ page }) => {
      const managerEmail = process.env.TEST_MANAGER_EMAIL;
      const managerPassword = process.env.TEST_MANAGER_PASSWORD;
      
      if (!managerEmail || !managerPassword) {
        test.skip();
        return;
      }
      
      // Login as manager
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(managerEmail);
      await page.getByLabel(/password/i).fill(managerPassword);
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
      
      // Check for manager-specific content
      await expect(page.getByText(/manage your funds/i)).toBeVisible();
      
      // Check for manager stat cards
      await expect(page.getByText(/your funds/i).first()).toBeVisible();
      await expect(page.getByText(/profile views/i).first()).toBeVisible();
      await expect(page.getByText(/inquiries/i).first()).toBeVisible();
    });

    test('should show fund management actions for managers', async ({ page }) => {
      const managerEmail = process.env.TEST_MANAGER_EMAIL;
      const managerPassword = process.env.TEST_MANAGER_PASSWORD;
      
      if (!managerEmail || !managerPassword) {
        test.skip();
        return;
      }
      
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(managerEmail);
      await page.getByLabel(/password/i).fill(managerPassword);
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
      
      // Check for manager actions
      await expect(page.getByRole('link', { name: /add new fund/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /view my funds/i })).toBeVisible();
    });
  });

  test.describe('Role-Based Content Visibility', () => {
    test('should not show manager content to investors', async ({ page }) => {
      const investorEmail = process.env.TEST_USER_EMAIL;
      const investorPassword = process.env.TEST_USER_PASSWORD;
      
      if (!investorEmail || !investorPassword) {
        test.skip();
        return;
      }
      
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(investorEmail);
      await page.getByLabel(/password/i).fill(investorPassword);
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
      
      // Manager-specific content should NOT be visible
      await expect(page.getByRole('link', { name: /add new fund/i })).not.toBeVisible();
      await expect(page.getByText(/manage your funds and investor relations/i)).not.toBeVisible();
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();
      
      // Try to access dashboard
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });

    test('should show accreditation status for investors', async ({ page }) => {
      const investorEmail = process.env.TEST_USER_EMAIL;
      const investorPassword = process.env.TEST_USER_PASSWORD;
      
      if (!investorEmail || !investorPassword) {
        test.skip();
        return;
      }
      
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(investorEmail);
      await page.getByLabel(/password/i).fill(investorPassword);
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
      
      // Should show accreditation badge (either accredited or pending)
      const accreditedBadge = page.getByText(/accredited investor/i);
      const pendingBadge = page.getByText(/accreditation pending/i);
      
      await expect(accreditedBadge.or(pendingBadge)).toBeVisible();
    });
  });

  test.describe('Dashboard Loading States', () => {
    test('should show loading state initially', async ({ page }) => {
      const testEmail = process.env.TEST_USER_EMAIL;
      const testPassword = process.env.TEST_USER_PASSWORD;
      
      if (!testEmail || !testPassword) {
        test.skip();
        return;
      }
      
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(testEmail);
      await page.getByLabel(/password/i).fill(testPassword);
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Navigate to dashboard - may briefly show loading
      await page.goto('/dashboard');
      
      // Either loading or content should be visible
      const loading = page.getByText(/loading/i);
      const welcome = page.getByRole('heading', { name: /welcome back/i });
      
      await expect(loading.or(welcome)).toBeVisible({ timeout: 10000 });
      
      // Eventually should show welcome
      await expect(welcome).toBeVisible({ timeout: 15000 });
    });
  });
});
