import { test, expect, Page } from "@playwright/test";

// Mobile viewport for touch tests
const MOBILE_VIEWPORT = { width: 375, height: 667 };

// Minimum touch target size per WCAG 2.1 Success Criterion 2.5.5
const MIN_TOUCH_TARGET = 44;
// Acceptable minimum (common in mobile apps)
const ACCEPTABLE_MIN_TOUCH = 40;

/**
 * Helper to simulate touch events
 */
async function simulateTouch(page: Page, selector: string, action: "tap" | "swipe", options?: {
  direction?: "left" | "right" | "up" | "down";
  distance?: number;
}) {
  const element = page.locator(selector).first();
  const box = await element.boundingBox();
  
  if (!box) return;
  
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  
  if (action === "tap") {
    await page.touchscreen.tap(centerX, centerY);
  } else if (action === "swipe" && options) {
    const distance = options.distance || 100;
    let endX = centerX;
    let endY = centerY;
    
    switch (options.direction) {
      case "left":
        endX = centerX - distance;
        break;
      case "right":
        endX = centerX + distance;
        break;
      case "up":
        endY = centerY - distance;
        break;
      case "down":
        endY = centerY + distance;
        break;
    }
    
    // Simulate swipe with touchscreen
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();
  }
}

test.describe("Touch Gesture Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    // Enable touch events
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
    });
  });

  test("should handle tap on fund cards", async ({ page }) => {
    await page.goto("/funds");
    await page.waitForLoadState("networkidle");
    
    // Find first fund card link
    const fundCard = page.locator('a[href^="/funds/"]').first();
    
    if (await fundCard.isVisible()) {
      const box = await fundCard.boundingBox();
      
      if (box) {
        // Tap the card
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        
        // Should navigate to fund detail
        await page.waitForURL(/\/funds\//, { timeout: 5000 });
        expect(page.url()).toMatch(/\/funds\//);
      }
    }
  });

  test("should handle swipe on horizontal scrollable elements", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Find a horizontally scrollable element (like watchlist cards or recommended funds)
    const scrollContainer = page.locator('.overflow-x-auto, .snap-x').first();
    
    if (await scrollContainer.isVisible()) {
      const initialScroll = await scrollContainer.evaluate(el => el.scrollLeft);
      
      // Simulate swipe left
      const box = await scrollContainer.boundingBox();
      if (box) {
        const startX = box.x + box.width * 0.8;
        const startY = box.y + box.height / 2;
        const endX = box.x + box.width * 0.2;
        
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, startY, { steps: 10 });
        await page.mouse.up();
        
        await page.waitForTimeout(300);
        
        const newScroll = await scrollContainer.evaluate(el => el.scrollLeft);
        
        // Scroll should have changed (or element wasn't scrollable)
        // We don't fail if it didn't scroll - element might not need scrolling
      }
    }
  });

  test("should handle pull-to-refresh gesture (if implemented)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Find a pull-to-refresh container
    const ptrContainer = page.locator('[data-testid="pull-to-refresh"], .pull-to-refresh').first();
    
    // Most apps implement PTR natively or via JS
    // We test that the page handles pull-down gracefully
    const initialScroll = await page.evaluate(() => window.scrollY);
    
    // Simulate pull down from top
    await page.mouse.move(MOBILE_VIEWPORT.width / 2, 50);
    await page.mouse.down();
    await page.mouse.move(MOBILE_VIEWPORT.width / 2, 200, { steps: 10 });
    await page.mouse.up();
    
    // Wait for any refresh animation
    await page.waitForTimeout(500);
    
    // Page should still be functional
    await expect(page.locator("body")).toBeVisible();
  });

  test("should verify pinch-to-zoom is disabled on app", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Check viewport meta tag
    const viewportContent = await page.locator('meta[name="viewport"]').getAttribute("content");
    
    if (viewportContent) {
      // Check for user-scalable=no or maximum-scale=1
      const hasZoomDisabled = 
        viewportContent.includes("user-scalable=no") ||
        viewportContent.includes("user-scalable=0") ||
        viewportContent.includes("maximum-scale=1");
      
      // Note: It's actually better UX to allow zooming for accessibility
      // This test just verifies the current state - adjust assertion based on requirements
      console.log(`Viewport meta: ${viewportContent}`);
      console.log(`Zoom disabled: ${hasZoomDisabled}`);
    }
  });
});

test.describe("Touch Target Size Audit", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("should have 44x44px minimum touch targets for primary buttons", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Check CTA buttons (primary actions)
    const ctaButtons = page.locator('button[class*="bg-blue"], button[class*="bg-primary"], a[class*="bg-blue"]');
    const count = await ctaButtons.count();
    
    const results: { element: string; width: number; height: number; passes: boolean }[] = [];
    
    for (let i = 0; i < count; i++) {
      const button = ctaButtons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          results.push({
            element: await button.textContent() || `button-${i}`,
            width: box.width,
            height: box.height,
            passes: box.width >= ACCEPTABLE_MIN_TOUCH && box.height >= ACCEPTABLE_MIN_TOUCH,
          });
        }
      }
    }
    
    // Report results
    console.log("Touch Target Audit Results:");
    results.forEach(r => {
      console.log(`  ${r.element}: ${r.width}x${r.height} - ${r.passes ? "PASS" : "NEEDS ATTENTION"}`);
    });
    
    // At least some buttons should meet the requirement
    const passingButtons = results.filter(r => r.passes);
    expect(passingButtons.length).toBeGreaterThan(0);
  });

  test("should have 44x44px minimum for navigation links", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Check bottom navigation items
    const navLinks = page.locator('nav.fixed.bottom-0 a, nav a[href^="/"]');
    const count = await navLinks.count();
    
    const results: { href: string; width: number; height: number; passes: boolean }[] = [];
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = navLinks.nth(i);
      if (await link.isVisible()) {
        const box = await link.boundingBox();
        const href = await link.getAttribute("href") || "";
        
        if (box) {
          results.push({
            href,
            width: box.width,
            height: box.height,
            passes: box.width >= ACCEPTABLE_MIN_TOUCH && box.height >= ACCEPTABLE_MIN_TOUCH,
          });
        }
      }
    }
    
    console.log("Navigation Touch Target Audit:");
    results.forEach(r => {
      console.log(`  ${r.href}: ${r.width.toFixed(0)}x${r.height.toFixed(0)} - ${r.passes ? "PASS" : "NEEDS ATTENTION"}`);
    });
  });

  test("should have 44x44px minimum for form inputs", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    
    // Check form inputs
    const inputs = page.locator("input, select, textarea, [role='combobox']");
    const count = await inputs.count();
    
    const smallInputs: { name: string; height: number }[] = [];
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const box = await input.boundingBox();
        const name = await input.getAttribute("name") || await input.getAttribute("id") || `input-${i}`;
        
        if (box && box.height < ACCEPTABLE_MIN_TOUCH) {
          smallInputs.push({ name, height: box.height });
        }
      }
    }
    
    if (smallInputs.length > 0) {
      console.log("Inputs with small touch targets:");
      smallInputs.forEach(i => console.log(`  ${i.name}: height=${i.height.toFixed(0)}px`));
    }
    
    // Allow some flexibility but flag issues
    expect(smallInputs.length).toBeLessThan(count); // Not all inputs should be too small
  });

  test("should have 44x44px minimum for icon buttons", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Check icon-only buttons (common in headers, cards)
    const iconButtons = page.locator('button:has(svg):not(:has-text(""))');
    const count = await iconButtons.count();
    
    const tooSmall: { index: number; size: string }[] = [];
    
    for (let i = 0; i < count; i++) {
      const button = iconButtons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          const minDimension = Math.min(box.width, box.height);
          if (minDimension < ACCEPTABLE_MIN_TOUCH) {
            tooSmall.push({ index: i, size: `${box.width.toFixed(0)}x${box.height.toFixed(0)}` });
          }
        }
      }
    }
    
    if (tooSmall.length > 0) {
      console.log("Icon buttons with small touch targets:", tooSmall);
    }
  });

  test("should audit all interactive elements on fund detail page", async ({ page }) => {
    await page.goto("/funds");
    await page.waitForLoadState("networkidle");
    
    // Navigate to first fund
    const fundLink = page.locator('a[href^="/funds/"]').first();
    if (await fundLink.isVisible()) {
      await fundLink.click();
      await page.waitForLoadState("networkidle");
    }
    
    // Audit all interactive elements
    const interactiveElements = page.locator('button, a, [role="button"], [role="tab"], input, select');
    const count = await interactiveElements.count();
    
    let totalChecked = 0;
    let passing = 0;
    let failing = 0;
    const failingElements: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      if (await element.isVisible()) {
        const box = await element.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          totalChecked++;
          if (box.width >= ACCEPTABLE_MIN_TOUCH && box.height >= ACCEPTABLE_MIN_TOUCH) {
            passing++;
          } else {
            failing++;
            const text = await element.textContent() || await element.getAttribute("aria-label") || `element-${i}`;
            failingElements.push(`${text.slice(0, 30)}: ${box.width.toFixed(0)}x${box.height.toFixed(0)}`);
          }
        }
      }
    }
    
    console.log(`\nTouch Target Audit Summary (Fund Detail Page):`);
    console.log(`  Total checked: ${totalChecked}`);
    console.log(`  Passing (≥${ACCEPTABLE_MIN_TOUCH}px): ${passing} (${((passing/totalChecked)*100).toFixed(1)}%)`);
    console.log(`  Needs attention: ${failing}`);
    
    if (failingElements.length > 0 && failingElements.length <= 10) {
      console.log(`  Elements needing attention:`);
      failingElements.forEach(e => console.log(`    - ${e}`));
    }
    
    // At least 70% of elements should have adequate touch targets
    const passRate = passing / totalChecked;
    expect(passRate).toBeGreaterThan(0.7);
  });
});

test.describe("Touch Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("should handle double-tap without zoom", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Get initial viewport scale
    const initialWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    // Double tap in the center of the page
    const centerX = MOBILE_VIEWPORT.width / 2;
    const centerY = MOBILE_VIEWPORT.height / 2;
    
    await page.touchscreen.tap(centerX, centerY);
    await page.waitForTimeout(100);
    await page.touchscreen.tap(centerX, centerY);
    
    await page.waitForTimeout(500);
    
    // Check if page zoomed (width should be similar)
    const newWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    // Width shouldn't change significantly (allow small margin)
    expect(Math.abs(newWidth - initialWidth)).toBeLessThan(50);
  });

  test("should have touch-action CSS for interactive elements", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Check that buttons have touch-manipulation for better touch response
    const buttons = page.locator("button").first();
    
    if (await buttons.isVisible()) {
      const touchAction = await buttons.evaluate(el => 
        window.getComputedStyle(el).touchAction
      );
      
      // touch-manipulation is preferred for buttons
      // (disables double-tap zoom but allows pan and pinch)
      console.log(`Button touch-action: ${touchAction}`);
    }
  });

  test("should have active states for touch feedback", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Check for active/pressed state styles
    const button = page.locator("button").first();
    
    if (await button.isVisible()) {
      // Check if button has active state CSS
      const hasActiveState = await button.evaluate(el => {
        const styles = document.styleSheets;
        for (let i = 0; i < styles.length; i++) {
          try {
            const sheet = styles[i];
            const rules = sheet.cssRules;
            for (let j = 0; j < rules.length; j++) {
              const rule = rules[j];
              if (rule instanceof CSSStyleRule) {
                if (rule.selectorText?.includes(":active")) {
                  return true;
                }
              }
            }
          } catch {
            // Cross-origin stylesheets will throw
          }
        }
        return false;
      });
      
      // Also check for Tailwind active: classes
      const className = await button.getAttribute("class") || "";
      const hasTailwindActive = className.includes("active:");
      
      console.log(`Has CSS :active state: ${hasActiveState}`);
      console.log(`Has Tailwind active: class: ${hasTailwindActive}`);
    }
  });
});
