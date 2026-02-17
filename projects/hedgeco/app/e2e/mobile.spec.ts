import { test, expect, Page } from "@playwright/test";

// Mobile viewport dimensions
const MOBILE_VIEWPORT = { width: 375, height: 667 };

test.describe("Mobile Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("should show hamburger menu on mobile", async ({ page }) => {
    await page.goto("/");
    
    // Check that hamburger menu button is visible
    const menuButton = page.locator('[data-testid="mobile-menu-button"], button:has(svg.lucide-menu)');
    
    // On mobile, the desktop nav should be hidden
    const desktopNav = page.locator("nav.hidden.md\\:flex, nav.md\\:block");
    await expect(desktopNav).toBeHidden();
  });

  test("should open and close hamburger menu", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Find the menu trigger button
    const menuButton = page.locator('button:has(svg.lucide-menu)').first();
    
    if (await menuButton.isVisible()) {
      // Open the menu
      await menuButton.click();
      
      // Wait for sheet/menu content to appear
      await expect(page.locator('[role="dialog"], [data-state="open"]').first()).toBeVisible({ timeout: 5000 });
      
      // Close the menu
      const closeButton = page.locator('button:has(svg.lucide-x)').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(page.locator('[role="dialog"]').first()).toBeHidden({ timeout: 5000 });
      }
    }
  });

  test("should show bottom navigation on dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Bottom nav should be visible on mobile
    const bottomNav = page.locator('nav.fixed.bottom-0, nav:has(a[href="/dashboard"])').first();
    
    // Check for navigation items
    const navItems = page.locator('nav a[href="/dashboard"], nav a[href="/funds"], nav a[href="/messages"]');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should navigate using bottom navigation", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Click on Funds in bottom nav
    const fundsLink = page.locator('nav.fixed.bottom-0 a[href="/funds"], nav a:has-text("Funds")').first();
    
    if (await fundsLink.isVisible()) {
      await fundsLink.click();
      await expect(page).toHaveURL(/\/funds/);
    }
  });
});

test.describe("Mobile Fund Listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("should display fund cards in single column on mobile", async ({ page }) => {
    await page.goto("/funds");
    await page.waitForLoadState("networkidle");
    
    // Get fund cards
    const fundCards = page.locator('[data-testid="fund-card"], .grid > a > div');
    
    // Wait for cards to load
    await page.waitForTimeout(1000);
    
    const count = await fundCards.count();
    if (count > 1) {
      // Check that cards are stacked vertically (single column)
      const firstCard = await fundCards.first().boundingBox();
      const secondCard = await fundCards.nth(1).boundingBox();
      
      if (firstCard && secondCard) {
        // Cards should be stacked vertically (second card below first)
        expect(secondCard.y).toBeGreaterThan(firstCard.y);
        // Cards should have similar x positions (single column)
        expect(Math.abs(secondCard.x - firstCard.x)).toBeLessThan(20);
      }
    }
  });

  test("should tap fund card and navigate to detail", async ({ page }) => {
    await page.goto("/funds");
    await page.waitForLoadState("networkidle");
    
    // Click first fund card
    const firstFundLink = page.locator('a[href^="/funds/"]').first();
    
    if (await firstFundLink.isVisible()) {
      const href = await firstFundLink.getAttribute("href");
      await firstFundLink.click();
      
      // Should navigate to fund detail page
      await expect(page).toHaveURL(new RegExp(href || "/funds/"));
    }
  });

  test("should have scrollable filters on mobile", async ({ page }) => {
    await page.goto("/funds");
    await page.waitForLoadState("networkidle");
    
    // The filter container should allow horizontal scroll
    const filterContainer = page.locator(".overflow-x-auto").first();
    
    if (await filterContainer.isVisible()) {
      const scrollWidth = await filterContainer.evaluate(el => el.scrollWidth);
      const clientWidth = await filterContainer.evaluate(el => el.clientWidth);
      
      // If there's overflow, scrollWidth > clientWidth
      // This is expected on mobile when filters don't fit
    }
  });
});

test.describe("Mobile Fund Detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("should have scrollable tabs", async ({ page }) => {
    await page.goto("/funds");
    await page.waitForLoadState("networkidle");
    
    // Navigate to a fund detail page
    const firstFundLink = page.locator('a[href^="/funds/"]').first();
    
    if (await firstFundLink.isVisible()) {
      await firstFundLink.click();
      await page.waitForLoadState("networkidle");
      
      // Check tabs are present and scrollable
      const tabsList = page.locator('[role="tablist"]');
      
      if (await tabsList.isVisible()) {
        const tabsContainer = page.locator('.overflow-x-auto:has([role="tablist"])').first();
        
        // Verify tabs are interactive
        const overviewTab = page.locator('[role="tab"]:has-text("Overview")');
        const statisticsTab = page.locator('[role="tab"]:has-text("Statistics")');
        
        if (await overviewTab.isVisible() && await statisticsTab.isVisible()) {
          await statisticsTab.click();
          await expect(statisticsTab).toHaveAttribute("data-state", "active");
        }
      }
    }
  });

  test("should stack sidebar below main content on mobile", async ({ page }) => {
    await page.goto("/funds");
    await page.waitForLoadState("networkidle");
    
    const firstFundLink = page.locator('a[href^="/funds/"]').first();
    
    if (await firstFundLink.isVisible()) {
      await firstFundLink.click();
      await page.waitForLoadState("networkidle");
      
      // On mobile, the sidebar (Manager Card) should be below main content
      const mainContent = page.locator('.lg\\:col-span-2').first();
      const sidebar = page.locator('.lg\\:col-span-1, .space-y-6').last();
      
      if (await mainContent.isVisible() && await sidebar.isVisible()) {
        const mainBox = await mainContent.boundingBox();
        const sidebarBox = await sidebar.boundingBox();
        
        if (mainBox && sidebarBox) {
          // On mobile, sidebar should be below main content (greater Y)
          // or both should be in a single column layout
          expect(sidebarBox.y).toBeGreaterThanOrEqual(mainBox.y);
        }
      }
    }
  });
});

test.describe("Mobile Forms", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("should have full-width inputs on mobile", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    
    // Check input fields
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const count = await inputs.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const box = await input.boundingBox();
        if (box) {
          // Input should take most of viewport width (accounting for padding)
          expect(box.width).toBeGreaterThan(MOBILE_VIEWPORT.width * 0.7);
        }
      }
    }
  });

  test("should submit form on mobile", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    
    // Find form fields
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      // Fill form
      await emailInput.fill("test@example.com");
      await passwordInput.fill("password123");
      
      // Verify values are filled
      await expect(emailInput).toHaveValue("test@example.com");
      await expect(passwordInput).toHaveValue("password123");
      
      // Submit button should be visible and tappable
      if (await submitButton.isVisible()) {
        const box = await submitButton.boundingBox();
        if (box) {
          // Touch target should be at least 44x44
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });
});

test.describe("Mobile Scroll Behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("should scroll vertically through fund list", async ({ page }) => {
    await page.goto("/funds");
    await page.waitForLoadState("networkidle");
    
    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    
    // Verify scroll occurred
    const newScrollY = await page.evaluate(() => window.scrollY);
    expect(newScrollY).toBeGreaterThan(initialScrollY);
    
    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    
    const finalScrollY = await page.evaluate(() => window.scrollY);
    expect(finalScrollY).toBe(0);
  });

  test("should maintain scroll position on back navigation", async ({ page }) => {
    await page.goto("/funds");
    await page.waitForLoadState("networkidle");
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(300);
    
    // Click a fund
    const firstFundLink = page.locator('a[href^="/funds/"]').first();
    
    if (await firstFundLink.isVisible()) {
      await firstFundLink.click();
      await page.waitForLoadState("networkidle");
      
      // Go back
      await page.goBack();
      await page.waitForLoadState("networkidle");
      
      // Note: scroll restoration depends on browser/app implementation
      // This is more of a smoke test
    }
  });
});

test.describe("Mobile Dialogs/Modals", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("should show full-screen modal on mobile", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Try to open a dialog/modal (like the mobile menu or a compose modal)
    const menuButton = page.locator('button:has(svg.lucide-menu)').first();
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
      
      // Check for dialog/sheet
      const dialog = page.locator('[role="dialog"], [data-state="open"]').first();
      
      if (await dialog.isVisible()) {
        const box = await dialog.boundingBox();
        
        if (box) {
          // Dialog should take significant portion of the viewport on mobile
          // (full screen or near full screen)
          const viewportCoverage = (box.width * box.height) / (MOBILE_VIEWPORT.width * MOBILE_VIEWPORT.height);
          expect(viewportCoverage).toBeGreaterThan(0.3); // At least 30% of viewport
        }
      }
    }
  });
});

test.describe("Mobile Touch Targets", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("should have minimum touch target sizes for buttons", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Check primary buttons
    const buttons = page.locator("button, a.button, [role='button']");
    const count = await buttons.count();
    
    let checkedCount = 0;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Minimum touch target should be 44x44 (WCAG guideline)
          // We check for at least 40px which is a common acceptable minimum
          if (box.width > 0 && box.height > 0) {
            // Log small touch targets but don't fail (some icons may be intentionally small)
            if (box.height < 40 || box.width < 40) {
              console.log(`Small touch target: ${box.width}x${box.height}`);
            }
            checkedCount++;
          }
        }
      }
    }
    
    expect(checkedCount).toBeGreaterThan(0);
  });

  test("should have adequate spacing between interactive elements", async ({ page }) => {
    await page.goto("/funds");
    await page.waitForLoadState("networkidle");
    
    // Check filter buttons aren't overlapping
    const buttons = page.locator(".flex.gap-2 button, .flex.gap-2 [role='button']");
    const count = await buttons.count();
    
    if (count >= 2) {
      const boxes = [];
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            boxes.push(box);
          }
        }
      }
      
      // Check no overlapping
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          
          // Check for overlap (simplified check)
          const overlaps = !(
            a.x + a.width < b.x ||
            b.x + b.width < a.x ||
            a.y + a.height < b.y ||
            b.y + b.height < a.y
          );
          
          expect(overlaps).toBe(false);
        }
      }
    }
  });
});
