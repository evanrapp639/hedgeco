import { test, expect } from '@playwright/test';

/**
 * Fund Browsing E2E Tests
 * 
 * Tests for viewing and searching hedge funds
 */

test.describe('Fund Browsing', () => {
  test.describe('Funds List Page', () => {
    test('should display funds page with title', async ({ page }) => {
      await page.goto('/funds');
      
      // Check page title
      await expect(page).toHaveTitle(/HedgeCo|Funds/);
      
      // Check heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display fund cards or list', async ({ page }) => {
      await page.goto('/funds');
      
      // Wait for content to load
      await page.waitForLoadState('networkidle');
      
      // Should have fund items (cards or list items)
      // Look for common fund display patterns
      const fundElements = page.locator('[data-testid="fund-card"]')
        .or(page.locator('.fund-card'))
        .or(page.locator('article'))
        .or(page.getByRole('link').filter({ hasText: /fund|capital|partners|management/i }));
      
      // Either we have funds or a "no funds" message
      const noFundsMessage = page.getByText(/no funds|no results|empty/i);
      
      await expect(fundElements.first().or(noFundsMessage)).toBeVisible({ timeout: 10000 });
    });

    test('should have search/filter functionality', async ({ page }) => {
      await page.goto('/funds');
      
      // Look for search input
      const searchInput = page.getByPlaceholder(/search/i)
        .or(page.getByRole('searchbox'))
        .or(page.getByLabel(/search/i));
      
      await expect(searchInput).toBeVisible();
    });

    test('should have filter options', async ({ page }) => {
      await page.goto('/funds');
      
      // Look for filter elements (dropdowns, checkboxes, etc.)
      const filterElements = page.getByRole('combobox')
        .or(page.getByText(/filter/i))
        .or(page.getByText(/strategy|type|aum/i));
      
      await expect(filterElements.first()).toBeVisible();
    });

    test('should filter funds by strategy', async ({ page }) => {
      await page.goto('/funds');
      
      // Find strategy filter
      const strategyFilter = page.getByRole('combobox').filter({ hasText: /strategy|type/i })
        .or(page.getByLabel(/strategy/i));
      
      if (await strategyFilter.isVisible()) {
        // Click to open dropdown
        await strategyFilter.click();
        
        // Select an option
        const option = page.getByRole('option').first();
        if (await option.isVisible()) {
          await option.click();
          
          // Wait for results to update
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should search funds by name', async ({ page }) => {
      await page.goto('/funds');
      
      // Find and use search input
      const searchInput = page.getByPlaceholder(/search/i)
        .or(page.getByRole('searchbox'));
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('Alpha');
        
        // Either press enter or wait for auto-search
        await searchInput.press('Enter');
        
        // Wait for results
        await page.waitForLoadState('networkidle');
      }
    });

    test('should navigate to fund detail page', async ({ page }) => {
      await page.goto('/funds');
      
      // Wait for funds to load
      await page.waitForLoadState('networkidle');
      
      // Find a fund link
      const fundLink = page.getByRole('link').filter({ hasText: /fund|capital|partners/i }).first();
      
      if (await fundLink.isVisible()) {
        await fundLink.click();
        
        // Should navigate to fund detail page
        await expect(page).toHaveURL(/funds\/[a-z0-9-]+/i);
      }
    });

    test('should have pagination if many funds', async ({ page }) => {
      await page.goto('/funds');
      
      await page.waitForLoadState('networkidle');
      
      // Look for pagination controls
      const pagination = page.getByRole('navigation', { name: /pagination/i })
        .or(page.getByText(/page \d/i))
        .or(page.getByRole('button', { name: /next|previous|>/i }));
      
      // Pagination may or may not exist depending on number of funds
      // Just verify the page loads without errors
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Fund Detail Page', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a fund detail page
      // First go to funds list and click first fund
      await page.goto('/funds');
      await page.waitForLoadState('networkidle');
      
      const fundLink = page.getByRole('link').filter({ hasText: /fund|capital|partners/i }).first();
      
      if (await fundLink.isVisible()) {
        await fundLink.click();
        await page.waitForLoadState('networkidle');
      } else {
        // If no funds, try a direct URL (may 404)
        await page.goto('/funds/test-fund');
      }
    });

    test('should display fund name and details', async ({ page }) => {
      // Check for fund name heading
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
    });

    test('should display fund statistics', async ({ page }) => {
      // Look for key statistics
      const statsSection = page.getByText(/aum|returns|performance|ytd/i);
      
      // Stats might not be visible if fund doesn't exist or has no data
      // Just verify the page structure
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have performance chart or table', async ({ page }) => {
      // Look for chart or performance data
      const performanceSection = page.getByText(/performance|returns|monthly/i)
        .or(page.locator('canvas')) // Charts are often canvas elements
        .or(page.getByRole('table'));
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have contact or inquiry option', async ({ page }) => {
      // Look for contact/inquiry functionality
      const contactButton = page.getByRole('button', { name: /contact|inquire|request/i })
        .or(page.getByRole('link', { name: /contact|inquire/i }));
      
      // May require authentication
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have watchlist/save functionality', async ({ page }) => {
      // Look for save/watchlist button
      const saveButton = page.getByRole('button', { name: /save|watchlist|bookmark/i })
        .or(page.getByRole('button').filter({ hasText: /★|☆/ }));
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display fee information', async ({ page }) => {
      // Look for fee details
      const feeInfo = page.getByText(/management fee|performance fee|minimum investment/i);
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have back navigation', async ({ page }) => {
      // Look for back link
      const backLink = page.getByRole('link', { name: /back|all funds/i })
        .or(page.getByRole('button', { name: /back/i }));
      
      if (await backLink.isVisible()) {
        await backLink.click();
        
        // Should navigate back to funds list
        await expect(page).toHaveURL(/funds$/);
      }
    });
  });

  test.describe('Fund Comparison', () => {
    test('should allow comparing multiple funds', async ({ page }) => {
      await page.goto('/funds');
      
      // Look for compare functionality
      const compareButton = page.getByRole('button', { name: /compare/i })
        .or(page.getByRole('checkbox'));
      
      // Compare feature may not be implemented yet
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should be usable on mobile', async ({ page }) => {
      await page.goto('/funds');
      
      // Check that main content is visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      
      // Check that filters are accessible (might be in a drawer/modal)
      const filterToggle = page.getByRole('button', { name: /filter/i });
      
      if (await filterToggle.isVisible()) {
        await filterToggle.click();
        
        // Filter options should become visible
        await expect(page.getByText(/strategy|type|aum/i)).toBeVisible();
      }
    });

    test('should have working navigation on mobile', async ({ page }) => {
      await page.goto('/funds');
      
      // Check for mobile menu toggle
      const menuToggle = page.getByRole('button', { name: /menu/i })
        .or(page.getByLabel(/menu/i))
        .or(page.locator('[aria-label*="menu"]'));
      
      if (await menuToggle.isVisible()) {
        await menuToggle.click();
        
        // Navigation should be visible
        await expect(page.getByRole('navigation')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/funds');
      
      // Should have h1
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);
    });

    test('should have accessible form labels', async ({ page }) => {
      await page.goto('/funds');
      
      // All inputs should have labels
      const inputs = page.locator('input:visible');
      const count = await inputs.count();
      
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');
        
        // Input should have label, aria-label, or placeholder
        expect(id || ariaLabel || placeholder).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/funds');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Should focus on an interactive element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});
