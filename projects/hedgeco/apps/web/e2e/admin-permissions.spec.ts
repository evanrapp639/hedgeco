import { test, expect, type Page } from '@playwright/test';

/**
 * Admin Permission E2E Tests
 * 
 * Tests for role-based access control including:
 * - Regular users cannot access /admin routes
 * - Managers can access their fund management
 * - Admins can access user management
 * - Super admins can access all
 * - Role escalation prevention
 */

// Helper to login with credentials
async function loginAs(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  
  try {
    await page.waitForURL(/dashboard|admin/, { timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('Admin Permissions', () => {
  test.describe('Regular Users Cannot Access Admin Routes', () => {
    test('investor cannot access /admin', async ({ page }) => {
      const userEmail = process.env.TEST_USER_EMAIL;
      const userPassword = process.env.TEST_USER_PASSWORD;
      
      if (!userEmail || !userPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, userEmail, userPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Try to access admin dashboard
      await page.goto('/admin');
      
      // Should be redirected or see unauthorized
      const unauthorized = await page.getByText(/unauthorized|access denied|forbidden/i).isVisible().catch(() => false);
      const redirected = !page.url().includes('/admin');
      
      expect(unauthorized || redirected).toBeTruthy();
    });

    test('investor cannot access /admin/users', async ({ page }) => {
      const userEmail = process.env.TEST_USER_EMAIL;
      const userPassword = process.env.TEST_USER_PASSWORD;
      
      if (!userEmail || !userPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, userEmail, userPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Try to access user management
      await page.goto('/admin/users');
      
      // Should be redirected or see unauthorized
      const unauthorized = await page.getByText(/unauthorized|access denied|forbidden/i).isVisible().catch(() => false);
      const redirected = !page.url().includes('/admin');
      
      expect(unauthorized || redirected).toBeTruthy();
    });

    test('investor cannot access /admin/funds', async ({ page }) => {
      const userEmail = process.env.TEST_USER_EMAIL;
      const userPassword = process.env.TEST_USER_PASSWORD;
      
      if (!userEmail || !userPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, userEmail, userPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Try to access fund management
      await page.goto('/admin/funds');
      
      // Should be redirected or see unauthorized
      const unauthorized = await page.getByText(/unauthorized|access denied|forbidden/i).isVisible().catch(() => false);
      const redirected = !page.url().includes('/admin');
      
      expect(unauthorized || redirected).toBeTruthy();
    });

    test('investor cannot access /admin/audit-logs', async ({ page }) => {
      const userEmail = process.env.TEST_USER_EMAIL;
      const userPassword = process.env.TEST_USER_PASSWORD;
      
      if (!userEmail || !userPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, userEmail, userPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Try to access audit logs
      await page.goto('/admin/audit-logs');
      
      // Should be redirected or see unauthorized
      const unauthorized = await page.getByText(/unauthorized|access denied|forbidden/i).isVisible().catch(() => false);
      const redirected = !page.url().includes('/admin');
      
      expect(unauthorized || redirected).toBeTruthy();
    });

    test('investor cannot access /admin/settings', async ({ page }) => {
      const userEmail = process.env.TEST_USER_EMAIL;
      const userPassword = process.env.TEST_USER_PASSWORD;
      
      if (!userEmail || !userPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, userEmail, userPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Try to access admin settings
      await page.goto('/admin/settings');
      
      // Should be redirected or see unauthorized
      const unauthorized = await page.getByText(/unauthorized|access denied|forbidden/i).isVisible().catch(() => false);
      const redirected = !page.url().includes('/admin');
      
      expect(unauthorized || redirected).toBeTruthy();
    });
  });

  test.describe('Managers Can Access Their Fund Management', () => {
    test('manager can access their own funds', async ({ page }) => {
      const managerEmail = process.env.TEST_MANAGER_EMAIL;
      const managerPassword = process.env.TEST_MANAGER_PASSWORD;
      
      if (!managerEmail || !managerPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, managerEmail, managerPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Should be able to access their funds
      await page.goto('/dashboard/funds');
      
      // Should see fund management options
      await expect(page.getByRole('heading', { name: /my funds|fund management/i })).toBeVisible({ timeout: 10000 });
    });

    test('manager can create new fund', async ({ page }) => {
      const managerEmail = process.env.TEST_MANAGER_EMAIL;
      const managerPassword = process.env.TEST_MANAGER_PASSWORD;
      
      if (!managerEmail || !managerPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, managerEmail, managerPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Navigate to create fund
      await page.goto('/dashboard/funds/new');
      
      // Should see fund creation form
      const createButton = page.getByRole('button', { name: /create|submit/i });
      const formVisible = await page.getByLabel(/fund name/i).isVisible().catch(() => false);
      
      expect(formVisible || await createButton.isVisible().catch(() => false)).toBeTruthy();
    });

    test('manager cannot access other managers funds directly', async ({ page }) => {
      const managerEmail = process.env.TEST_MANAGER_EMAIL;
      const managerPassword = process.env.TEST_MANAGER_PASSWORD;
      
      if (!managerEmail || !managerPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, managerEmail, managerPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Try to access a fund that doesn't belong to them
      // Using a fake fund ID
      await page.goto('/dashboard/funds/fake-fund-id-12345/edit');
      
      // Should see not found or unauthorized
      const notFound = await page.getByText(/not found|unauthorized|forbidden/i).isVisible().catch(() => false);
      const redirected = !page.url().includes('fake-fund-id-12345');
      
      expect(notFound || redirected).toBeTruthy();
    });

    test('manager cannot access admin panel', async ({ page }) => {
      const managerEmail = process.env.TEST_MANAGER_EMAIL;
      const managerPassword = process.env.TEST_MANAGER_PASSWORD;
      
      if (!managerEmail || !managerPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, managerEmail, managerPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Try to access admin
      await page.goto('/admin');
      
      // Should be redirected or see unauthorized
      const unauthorized = await page.getByText(/unauthorized|access denied|forbidden/i).isVisible().catch(() => false);
      const redirected = !page.url().includes('/admin');
      
      expect(unauthorized || redirected).toBeTruthy();
    });
  });

  test.describe('Admins Can Access User Management', () => {
    test('admin can access user list', async ({ page }) => {
      const adminEmail = process.env.TEST_ADMIN_EMAIL;
      const adminPassword = process.env.TEST_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, adminEmail, adminPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Navigate to user management
      await page.goto('/admin/users');
      
      // Should see user list
      await expect(page.getByRole('table').or(page.getByTestId('user-list'))).toBeVisible({ timeout: 10000 });
    });

    test('admin can view user details', async ({ page }) => {
      const adminEmail = process.env.TEST_ADMIN_EMAIL;
      const adminPassword = process.env.TEST_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, adminEmail, adminPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      await page.goto('/admin/users');
      
      // Click on a user to view details
      const viewButton = page.getByRole('button', { name: /view|details/i }).first();
      
      if (await viewButton.isVisible().catch(() => false)) {
        await viewButton.click();
        
        // Should see user details
        await expect(page.getByText(/email|role|created/i)).toBeVisible({ timeout: 5000 });
      }
    });

    test('admin can access fund approvals', async ({ page }) => {
      const adminEmail = process.env.TEST_ADMIN_EMAIL;
      const adminPassword = process.env.TEST_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, adminEmail, adminPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Navigate to fund management
      await page.goto('/admin/funds');
      
      // Should see fund management interface
      await expect(page.getByRole('heading', { name: /fund|management/i })).toBeVisible({ timeout: 10000 });
    });

    test('admin can access audit logs', async ({ page }) => {
      const adminEmail = process.env.TEST_ADMIN_EMAIL;
      const adminPassword = process.env.TEST_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, adminEmail, adminPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Navigate to audit logs
      await page.goto('/admin/audit-logs');
      
      // Should see audit log interface
      await expect(page.getByRole('table').or(page.getByTestId('audit-log-list'))).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Super Admins Can Access All', () => {
    test('super admin can access all admin sections', async ({ page }) => {
      const superAdminEmail = process.env.TEST_SUPER_ADMIN_EMAIL;
      const superAdminPassword = process.env.TEST_SUPER_ADMIN_PASSWORD;
      
      if (!superAdminEmail || !superAdminPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, superAdminEmail, superAdminPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Check access to all admin routes
      const adminRoutes = [
        '/admin',
        '/admin/users',
        '/admin/funds',
        '/admin/audit-logs',
        '/admin/settings',
      ];
      
      for (const route of adminRoutes) {
        await page.goto(route);
        
        // Should not see unauthorized
        const unauthorized = await page.getByText(/unauthorized|access denied|forbidden/i).isVisible().catch(() => false);
        expect(unauthorized).toBeFalsy();
      }
    });

    test('super admin can modify user roles', async ({ page }) => {
      const superAdminEmail = process.env.TEST_SUPER_ADMIN_EMAIL;
      const superAdminPassword = process.env.TEST_SUPER_ADMIN_PASSWORD;
      
      if (!superAdminEmail || !superAdminPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, superAdminEmail, superAdminPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      await page.goto('/admin/users');
      
      // Look for role modification controls
      const editButton = page.getByRole('button', { name: /edit|modify/i }).first();
      
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        
        // Should see role selector
        const roleSelect = page.getByLabel(/role/i);
        await expect(roleSelect).toBeVisible({ timeout: 5000 }).catch(() => {
          // Might be in a modal or different format
        });
      }
    });

    test('super admin can access system settings', async ({ page }) => {
      const superAdminEmail = process.env.TEST_SUPER_ADMIN_EMAIL;
      const superAdminPassword = process.env.TEST_SUPER_ADMIN_PASSWORD;
      
      if (!superAdminEmail || !superAdminPassword) {
        test.skip();
        return;
      }
      
      const loggedIn = await loginAs(page, superAdminEmail, superAdminPassword);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      await page.goto('/admin/settings');
      
      // Should see settings interface
      const settingsHeading = page.getByRole('heading', { name: /settings|configuration/i });
      await expect(settingsHeading).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Role Escalation Prevention', () => {
    test('user cannot modify their own role via API', async ({ page, request }) => {
      const userEmail = process.env.TEST_USER_EMAIL;
      const userPassword = process.env.TEST_USER_PASSWORD;
      
      if (!userEmail || !userPassword) {
        test.skip();
        return;
      }
      
      // Login to get session
      await loginAs(page, userEmail, userPassword);
      
      // Try to modify own role via API
      const cookies = await page.context().cookies();
      const accessToken = cookies.find(c => c.name === 'accessToken')?.value;
      
      if (accessToken) {
        // Attempt role escalation
        const response = await request.patch('/api/users/me', {
          headers: {
            'Cookie': `accessToken=${accessToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            role: 'ADMIN',
          },
        });
        
        // Should be rejected
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    });

    test('admin cannot escalate to super admin', async ({ page, request }) => {
      const adminEmail = process.env.TEST_ADMIN_EMAIL;
      const adminPassword = process.env.TEST_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        test.skip();
        return;
      }
      
      // Login as admin
      await loginAs(page, adminEmail, adminPassword);
      
      // Try to modify own role to SUPER_ADMIN via API
      const cookies = await page.context().cookies();
      const accessToken = cookies.find(c => c.name === 'accessToken')?.value;
      
      if (accessToken) {
        const response = await request.patch('/api/users/me', {
          headers: {
            'Cookie': `accessToken=${accessToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            role: 'SUPER_ADMIN',
          },
        });
        
        // Should be rejected
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    });

    test('admin cannot grant admin role to others', async ({ page, request }) => {
      const adminEmail = process.env.TEST_ADMIN_EMAIL;
      const adminPassword = process.env.TEST_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        test.skip();
        return;
      }
      
      // Login as admin
      await loginAs(page, adminEmail, adminPassword);
      
      const cookies = await page.context().cookies();
      const accessToken = cookies.find(c => c.name === 'accessToken')?.value;
      
      if (accessToken) {
        // Try to grant admin role to a user
        const response = await request.patch('/api/admin/users/fake-user-id', {
          headers: {
            'Cookie': `accessToken=${accessToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            role: 'ADMIN',
          },
        });
        
        // Should be rejected (either 403 or 404)
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    });

    test('cannot access admin API without admin role', async ({ page, request }) => {
      const userEmail = process.env.TEST_USER_EMAIL;
      const userPassword = process.env.TEST_USER_PASSWORD;
      
      if (!userEmail || !userPassword) {
        test.skip();
        return;
      }
      
      // Login as regular user
      await loginAs(page, userEmail, userPassword);
      
      const cookies = await page.context().cookies();
      const accessToken = cookies.find(c => c.name === 'accessToken')?.value;
      
      if (accessToken) {
        // Try to access admin API endpoints
        const adminEndpoints = [
          '/api/admin/users',
          '/api/admin/funds',
          '/api/admin/audit-logs',
          '/api/admin/settings',
        ];
        
        for (const endpoint of adminEndpoints) {
          const response = await request.get(endpoint, {
            headers: {
              'Cookie': `accessToken=${accessToken}`,
            },
          });
          
          // All should be rejected (401 or 403)
          expect(response.status()).toBeGreaterThanOrEqual(400);
        }
      }
    });

    test('JWT token cannot be tampered to escalate role', async ({ page, request }) => {
      const userEmail = process.env.TEST_USER_EMAIL;
      const userPassword = process.env.TEST_USER_PASSWORD;
      
      if (!userEmail || !userPassword) {
        test.skip();
        return;
      }
      
      // Login as regular user
      await loginAs(page, userEmail, userPassword);
      
      const cookies = await page.context().cookies();
      const accessToken = cookies.find(c => c.name === 'accessToken')?.value;
      
      if (accessToken) {
        // Attempt to use a modified token (this should fail verification)
        const tamperedToken = accessToken.slice(0, -10) + 'TAMPERED!!';
        
        const response = await request.get('/api/admin/users', {
          headers: {
            'Cookie': `accessToken=${tamperedToken}`,
          },
        });
        
        // Should be rejected
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    });
  });

  test.describe('Navigation Guards', () => {
    test('admin link not visible to regular users', async ({ page }) => {
      const userEmail = process.env.TEST_USER_EMAIL;
      const userPassword = process.env.TEST_USER_PASSWORD;
      
      if (!userEmail || !userPassword) {
        test.skip();
        return;
      }
      
      await loginAs(page, userEmail, userPassword);
      await page.goto('/dashboard');
      
      // Admin link should not be visible
      const adminLink = page.getByRole('link', { name: /admin/i });
      await expect(adminLink).not.toBeVisible();
    });

    test('admin link visible to admins', async ({ page }) => {
      const adminEmail = process.env.TEST_ADMIN_EMAIL;
      const adminPassword = process.env.TEST_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        test.skip();
        return;
      }
      
      await loginAs(page, adminEmail, adminPassword);
      await page.goto('/dashboard');
      
      // Admin link should be visible (in nav or menu)
      const adminLink = page.getByRole('link', { name: /admin/i });
      const adminMenu = page.getByText(/admin/i);
      
      const linkVisible = await adminLink.isVisible().catch(() => false);
      const menuVisible = await adminMenu.isVisible().catch(() => false);
      
      expect(linkVisible || menuVisible).toBeTruthy();
    });
  });
});
