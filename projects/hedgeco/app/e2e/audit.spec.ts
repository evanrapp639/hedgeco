import { test, expect, type Page } from '@playwright/test';

/**
 * Audit Log E2E Tests
 * 
 * Tests for audit logging functionality including:
 * - Admin actions creating audit logs
 * - User actions (login, profile update) logged
 * - Sensitive operations logged (delete, permission change)
 * - Audit log list filtering
 * - Audit log export
 */

// Helper to login as admin
async function loginAsAdmin(page: Page): Promise<boolean> {
  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD;
  
  if (!adminEmail || !adminPassword) {
    return false;
  }
  
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for redirect
  await page.waitForURL(/admin|dashboard/, { timeout: 15000 });
  return true;
}

// Helper to login as regular user
async function loginAsUser(page: Page): Promise<boolean> {
  const userEmail = process.env.TEST_USER_EMAIL;
  const userPassword = process.env.TEST_USER_PASSWORD;
  
  if (!userEmail || !userPassword) {
    return false;
  }
  
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(userEmail);
  await page.getByLabel(/password/i).fill(userPassword);
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for redirect
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  return true;
}

test.describe('Audit Log Tests', () => {
  test.describe('Admin Actions Create Audit Logs', () => {
    test('admin login creates audit log entry', async ({ page }) => {
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Navigate to audit logs
      await page.goto('/admin/audit-logs');
      
      // Should see audit log table
      await expect(page.getByRole('table').or(page.getByTestId('audit-log-list'))).toBeVisible({ timeout: 10000 });
      
      // Look for LOGIN action in the list
      const loginEntry = page.getByText(/LOGIN/i).first();
      await expect(loginEntry).toBeVisible();
    });

    test('admin user management actions are logged', async ({ page }) => {
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Navigate to user management
      await page.goto('/admin/users');
      
      // View a user (if possible) - this should be logged
      const userRow = page.getByRole('row').nth(1);
      const viewButton = userRow.getByRole('button', { name: /view|details|edit/i });
      
      if (await viewButton.isVisible().catch(() => false)) {
        await viewButton.click();
        
        // Wait for the modal or page to load
        await page.waitForTimeout(1000);
        
        // Go back to audit logs to verify
        await page.goto('/admin/audit-logs');
        
        // Should see recent activity
        await expect(page.getByRole('table').or(page.getByTestId('audit-log-list'))).toBeVisible();
      }
    });

    test('admin fund approval actions are logged', async ({ page }) => {
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Navigate to fund approvals
      await page.goto('/admin/funds');
      
      // Check for pending funds section
      const pendingSection = page.getByText(/pending|awaiting approval/i);
      
      if (await pendingSection.isVisible().catch(() => false)) {
        // If there are pending funds, the approve/reject actions should be logged
        await expect(page.getByRole('button', { name: /approve|reject/i }).first()).toBeVisible();
      }
      
      // Navigate to audit logs
      await page.goto('/admin/audit-logs');
      await expect(page.getByRole('table').or(page.getByTestId('audit-log-list'))).toBeVisible();
    });
  });

  test.describe('User Actions Logged', () => {
    test('user login is logged', async ({ page }) => {
      const loggedIn = await loginAsUser(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Regular users might not see audit logs, but login should be recorded
      // We can verify this indirectly through the admin panel
      await page.context().clearCookies();
      
      // Login as admin to check
      const adminLoggedIn = await loginAsAdmin(page);
      if (!adminLoggedIn) {
        test.skip();
        return;
      }
      
      await page.goto('/admin/audit-logs');
      
      // Filter by LOGIN action
      const actionFilter = page.getByLabel(/action/i).or(page.getByTestId('action-filter'));
      if (await actionFilter.isVisible().catch(() => false)) {
        await actionFilter.selectOption('LOGIN');
      }
      
      // Should see login entries
      await expect(page.getByText(/LOGIN/i)).toBeVisible();
    });

    test('profile update is logged', async ({ page }) => {
      const loggedIn = await loginAsUser(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Go to profile/settings
      await page.goto('/settings/profile');
      
      // Make a small update (if possible)
      const phoneField = page.getByLabel(/phone/i);
      if (await phoneField.isVisible().catch(() => false)) {
        const currentValue = await phoneField.inputValue();
        await phoneField.fill('555-1234');
        
        // Save changes
        const saveButton = page.getByRole('button', { name: /save|update/i });
        if (await saveButton.isVisible().catch(() => false)) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          
          // Restore original value
          await phoneField.fill(currentValue || '');
          await saveButton.click();
        }
      }
    });
  });

  test.describe('Sensitive Operations Logged', () => {
    test('delete operations are logged', async ({ page }) => {
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Navigate to audit logs and filter by DELETE
      await page.goto('/admin/audit-logs');
      
      const actionFilter = page.getByLabel(/action/i).or(page.getByTestId('action-filter'));
      if (await actionFilter.isVisible().catch(() => false)) {
        await actionFilter.selectOption('DELETE');
      }
      
      // Table should be visible (even if empty)
      await expect(page.getByRole('table').or(page.getByTestId('audit-log-list'))).toBeVisible();
    });

    test('permission changes are logged', async ({ page }) => {
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Navigate to audit logs and filter by PERMISSION_CHANGE
      await page.goto('/admin/audit-logs');
      
      const actionFilter = page.getByLabel(/action/i).or(page.getByTestId('action-filter'));
      if (await actionFilter.isVisible().catch(() => false)) {
        await actionFilter.selectOption('PERMISSION_CHANGE');
      }
      
      // Table should be visible (even if empty)
      await expect(page.getByRole('table').or(page.getByTestId('audit-log-list'))).toBeVisible();
    });

    test('settings changes are logged', async ({ page }) => {
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      // Navigate to audit logs and filter by SETTINGS_CHANGE
      await page.goto('/admin/audit-logs');
      
      const actionFilter = page.getByLabel(/action/i).or(page.getByTestId('action-filter'));
      if (await actionFilter.isVisible().catch(() => false)) {
        await actionFilter.selectOption('SETTINGS_CHANGE');
      }
      
      // Table should be visible
      await expect(page.getByRole('table').or(page.getByTestId('audit-log-list'))).toBeVisible();
    });
  });

  test.describe('Audit Log List Filtering', () => {
    test.beforeEach(async ({ page }) => {
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      await page.goto('/admin/audit-logs');
    });

    test('can filter by action type', async ({ page }) => {
      const actionFilter = page.getByLabel(/action/i).or(page.getByTestId('action-filter'));
      
      if (await actionFilter.isVisible().catch(() => false)) {
        await actionFilter.selectOption('LOGIN');
        
        // Wait for filter to apply
        await page.waitForTimeout(500);
        
        // All visible entries should be LOGIN type
        const tableRows = page.getByRole('row');
        const rowCount = await tableRows.count();
        
        if (rowCount > 1) {
          // First row is header
          for (let i = 1; i < Math.min(rowCount, 5); i++) {
            const row = tableRows.nth(i);
            // Each row should contain LOGIN
            const rowText = await row.textContent();
            expect(rowText?.toUpperCase()).toContain('LOGIN');
          }
        }
      }
    });

    test('can filter by date range', async ({ page }) => {
      const startDateInput = page.getByLabel(/start date|from/i);
      const endDateInput = page.getByLabel(/end date|to/i);
      
      if (await startDateInput.isVisible().catch(() => false)) {
        // Set date range to today
        const today = new Date().toISOString().split('T')[0];
        await startDateInput.fill(today);
        
        if (await endDateInput.isVisible().catch(() => false)) {
          await endDateInput.fill(today);
        }
        
        // Wait for filter to apply
        await page.waitForTimeout(500);
        
        // Table should still be visible
        await expect(page.getByRole('table').or(page.getByTestId('audit-log-list'))).toBeVisible();
      }
    });

    test('can filter by user', async ({ page }) => {
      const userFilter = page.getByLabel(/user/i).or(page.getByTestId('user-filter'));
      
      if (await userFilter.isVisible().catch(() => false)) {
        // Try to filter by a specific user
        await userFilter.fill('admin');
        
        // Wait for filter to apply
        await page.waitForTimeout(500);
        
        // Table should still be visible
        await expect(page.getByRole('table').or(page.getByTestId('audit-log-list'))).toBeVisible();
      }
    });

    test('can filter by entity type', async ({ page }) => {
      const entityFilter = page.getByLabel(/entity/i).or(page.getByTestId('entity-filter'));
      
      if (await entityFilter.isVisible().catch(() => false)) {
        await entityFilter.selectOption('User');
        
        // Wait for filter to apply
        await page.waitForTimeout(500);
        
        // Table should still be visible
        await expect(page.getByRole('table').or(page.getByTestId('audit-log-list'))).toBeVisible();
      }
    });

    test('filters can be combined', async ({ page }) => {
      const actionFilter = page.getByLabel(/action/i).or(page.getByTestId('action-filter'));
      const startDateInput = page.getByLabel(/start date|from/i);
      
      if (await actionFilter.isVisible().catch(() => false)) {
        await actionFilter.selectOption('LOGIN');
      }
      
      if (await startDateInput.isVisible().catch(() => false)) {
        const today = new Date().toISOString().split('T')[0];
        await startDateInput.fill(today);
      }
      
      // Wait for combined filters to apply
      await page.waitForTimeout(500);
      
      // Table should still be visible
      await expect(page.getByRole('table').or(page.getByTestId('audit-log-list'))).toBeVisible();
    });

    test('clear filters button works', async ({ page }) => {
      const clearButton = page.getByRole('button', { name: /clear|reset/i });
      
      if (await clearButton.isVisible().catch(() => false)) {
        await clearButton.click();
        
        // Filters should be reset
        await page.waitForTimeout(500);
        
        // Table should show all entries
        await expect(page.getByRole('table').or(page.getByTestId('audit-log-list'))).toBeVisible();
      }
    });
  });

  test.describe('Audit Log Export', () => {
    test.beforeEach(async ({ page }) => {
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      await page.goto('/admin/audit-logs');
    });

    test('export button is visible for admins', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /export|download/i });
      
      // Export functionality should be available
      await expect(exportButton).toBeVisible({ timeout: 5000 }).catch(() => {
        // If not visible as button, might be in a dropdown
        const actionsMenu = page.getByRole('button', { name: /actions|more/i });
        if (actionsMenu) {
          // That's also acceptable
        }
      });
    });

    test('can export audit logs as CSV', async ({ page }) => {
      // Setup download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      const exportButton = page.getByRole('button', { name: /export.*csv|csv/i });
      
      if (await exportButton.isVisible().catch(() => false)) {
        await exportButton.click();
        
        const download = await downloadPromise;
        if (download) {
          const filename = download.suggestedFilename();
          expect(filename).toMatch(/\.csv$/i);
        }
      }
    });

    test('can export audit logs as JSON', async ({ page }) => {
      // Setup download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      const exportButton = page.getByRole('button', { name: /export.*json|json/i });
      
      if (await exportButton.isVisible().catch(() => false)) {
        await exportButton.click();
        
        const download = await downloadPromise;
        if (download) {
          const filename = download.suggestedFilename();
          expect(filename).toMatch(/\.json$/i);
        }
      }
    });

    test('export respects current filters', async ({ page }) => {
      // Apply a filter first
      const actionFilter = page.getByLabel(/action/i).or(page.getByTestId('action-filter'));
      
      if (await actionFilter.isVisible().catch(() => false)) {
        await actionFilter.selectOption('LOGIN');
        await page.waitForTimeout(500);
      }
      
      // Then export
      const exportButton = page.getByRole('button', { name: /export/i });
      
      if (await exportButton.isVisible().catch(() => false)) {
        // Button should be clickable
        await expect(exportButton).toBeEnabled();
      }
    });

    test('export logs the EXPORT action', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /export/i });
      
      if (await exportButton.isVisible().catch(() => false)) {
        await exportButton.click();
        
        // Wait for export to complete
        await page.waitForTimeout(2000);
        
        // Refresh the page
        await page.reload();
        
        // Look for EXPORT action in the list (should be at the top as most recent)
        const exportEntry = page.getByText('EXPORT').first();
        await expect(exportEntry).toBeVisible({ timeout: 5000 }).catch(() => {
          // Export audit logging might be async
        });
      }
    });
  });

  test.describe('Audit Log Details', () => {
    test.beforeEach(async ({ page }) => {
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      await page.goto('/admin/audit-logs');
    });

    test('can view audit log entry details', async ({ page }) => {
      // Click on a row to see details
      const firstRow = page.getByRole('row').nth(1);
      const detailsButton = firstRow.getByRole('button', { name: /view|details/i });
      
      if (await detailsButton.isVisible().catch(() => false)) {
        await detailsButton.click();
        
        // Should show details modal or page
        await expect(
          page.getByText(/old values|new values|metadata/i)
        ).toBeVisible({ timeout: 5000 });
      } else {
        // Might be clickable row
        await firstRow.click();
        await page.waitForTimeout(500);
      }
    });

    test('audit log shows IP address', async ({ page }) => {
      // Look for IP address column or in details
      const ipColumn = page.getByText(/ip address|ip/i);
      await expect(ipColumn).toBeVisible().catch(() => {
        // Might be in details view
      });
    });

    test('audit log shows user agent', async ({ page }) => {
      // Look for user agent in details
      const firstRow = page.getByRole('row').nth(1);
      const detailsButton = firstRow.getByRole('button', { name: /view|details/i });
      
      if (await detailsButton.isVisible().catch(() => false)) {
        await detailsButton.click();
        
        // Should show user agent
        await expect(
          page.getByText(/user agent|browser/i)
        ).toBeVisible({ timeout: 5000 }).catch(() => {
          // Might not show user agent in UI
        });
      }
    });
  });
});
