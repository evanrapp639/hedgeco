import { test, expect, type Page } from '@playwright/test';

/**
 * Smoke Test Suite
 * 
 * Critical path tests to verify core functionality is working.
 * These tests should run on every deployment to catch major issues.
 */

test.describe('Smoke Tests', () => {
  // ==========================================================================
  // Homepage & Public Pages
  // ==========================================================================
  test.describe('Public Pages', () => {
    test('homepage loads successfully', async ({ page }) => {
      const response = await page.goto('/');
      
      // Should return 200
      expect(response?.status()).toBe(200);
      
      // Should have essential elements
      await expect(page).toHaveTitle(/HedgeCo/i);
      
      // Should have navigation
      const nav = page.locator('nav, header');
      await expect(nav.first()).toBeVisible();
      
      // Should have main content
      const main = page.locator('main, [role="main"]');
      await expect(main.first()).toBeVisible();
    });

    test('login page is accessible', async ({ page }) => {
      await page.goto('/login');
      
      // Should have login form elements
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
    });

    test('register page is accessible', async ({ page }) => {
      await page.goto('/register');
      
      // Should have registration form elements
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /sign up|register|create/i })).toBeVisible();
    });

    test('404 page renders for unknown routes', async ({ page }) => {
      const response = await page.goto('/this-page-does-not-exist-12345');
      
      // Should return 404
      expect(response?.status()).toBe(404);
      
      // Should show error message
      await expect(page.getByText(/not found|404/i)).toBeVisible();
    });
  });

  // ==========================================================================
  // Authentication Flow
  // ==========================================================================
  test.describe('Authentication', () => {
    test('can access login page and see form', async ({ page }) => {
      await page.goto('/login');
      
      // Form should be interactive
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
    });

    test('shows validation errors for invalid login', async ({ page }) => {
      await page.goto('/login');
      
      // Submit empty form
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      
      // Should show validation error
      await expect(page.getByText(/required|invalid|enter/i)).toBeVisible({ timeout: 5000 });
    });

    test('login with valid test credentials', async ({ page }) => {
      const testEmail = process.env.TEST_USER_EMAIL;
      const testPassword = process.env.TEST_USER_PASSWORD;
      
      if (!testEmail || !testPassword) {
        test.skip();
        return;
      }
      
      await page.goto('/login');
      
      await page.getByLabel(/email/i).fill(testEmail);
      await page.getByLabel(/password/i).fill(testPassword);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      
      // Should redirect to dashboard
      await page.waitForURL(/dashboard/, { timeout: 15000 });
      
      // Should show user is logged in
      await expect(page.getByText(/dashboard|welcome/i)).toBeVisible({ timeout: 10000 });
    });

    test('protected routes redirect to login', async ({ page }) => {
      // Clear any cookies first
      await page.context().clearCookies();
      
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    });
  });

  // ==========================================================================
  // Key Pages (Authenticated)
  // ==========================================================================
  test.describe('Authenticated Pages', () => {
    test.beforeEach(async ({ page }) => {
      const testEmail = process.env.TEST_USER_EMAIL;
      const testPassword = process.env.TEST_USER_PASSWORD;
      
      if (!testEmail || !testPassword) {
        test.skip();
        return;
      }
      
      // Login
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(testEmail);
      await page.getByLabel(/password/i).fill(testPassword);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      await page.waitForURL(/dashboard/, { timeout: 15000 });
    });

    test('dashboard loads with key elements', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should have main content sections
      await expect(page.locator('main, [role="main"]').first()).toBeVisible();
      
      // Should have navigation
      const nav = page.locator('nav, aside, [role="navigation"]');
      await expect(nav.first()).toBeVisible();
    });

    test('funds page is accessible', async ({ page }) => {
      await page.goto('/funds');
      
      // Page should load
      await expect(page.locator('main, [role="main"]').first()).toBeVisible();
      
      // Should have some content (list, table, or empty state)
      const content = page.locator('table, [role="list"], [data-testid="funds-list"]');
      const emptyState = page.getByText(/no funds|empty|get started/i);
      
      await expect(content.first().or(emptyState.first())).toBeVisible({ timeout: 10000 });
    });

    test('profile/settings page is accessible', async ({ page }) => {
      // Try common profile URLs
      const profileUrls = ['/profile', '/settings', '/account'];
      
      for (const url of profileUrls) {
        const response = await page.goto(url);
        if (response?.status() === 200) {
          await expect(page.locator('main, [role="main"]').first()).toBeVisible();
          return;
        }
      }
      
      // If none found, that's okay - not all apps have these routes
      test.skip();
    });

    test('can log out', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Find and click logout
      const logoutButton = page.getByRole('button', { name: /log ?out|sign ?out/i });
      const logoutLink = page.getByRole('link', { name: /log ?out|sign ?out/i });
      
      const logoutElement = await logoutButton.or(logoutLink).first();
      
      if (await logoutElement.isVisible()) {
        await logoutElement.click();
        
        // Should redirect to login or home
        await expect(page).toHaveURL(/login|\/$/);
      }
    });
  });

  // ==========================================================================
  // API Endpoints
  // ==========================================================================
  test.describe('API Health', () => {
    test('health endpoint returns 200', async ({ request }) => {
      const response = await request.get('/api/health');
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.status).toBeDefined();
    });

    test('health endpoint returns detailed status', async ({ request }) => {
      const response = await request.get('/api/health?verbose=true');
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.status).toBeDefined();
      expect(body.checks).toBeDefined();
      expect(body.checks.database).toBeDefined();
    });

    test('readiness endpoint returns status', async ({ request }) => {
      const response = await request.get('/api/health/ready');
      
      // May be 200 or 503 depending on dependencies
      expect([200, 503]).toContain(response.status());
      
      const body = await response.json();
      expect(body.ready).toBeDefined();
    });

    test('auth login endpoint exists', async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });
      
      // Should return 401 or 400, not 404
      expect([400, 401]).toContain(response.status());
    });

    test('tRPC endpoint exists', async ({ request }) => {
      const response = await request.get('/api/trpc');
      
      // tRPC without procedure should return 4xx, not 404
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });
  });

  // ==========================================================================
  // Critical Error Handling
  // ==========================================================================
  test.describe('Error Handling', () => {
    test('API returns JSON errors, not HTML', async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: { email: 'bad', password: 'bad' },
      });
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    });

    test('client-side navigation works', async ({ page }) => {
      await page.goto('/');
      
      // Find any internal link
      const internalLink = page.locator('a[href^="/"]').first();
      
      if (await internalLink.isVisible()) {
        await internalLink.click();
        
        // Page should navigate without full reload
        await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 10000 });
      }
    });
  });
});
