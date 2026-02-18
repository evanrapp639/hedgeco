import { test, expect, type Page } from '@playwright/test';

/**
 * Performance Test Suite
 * 
 * Tests for page load times, API response times, and Core Web Vitals.
 * These tests help catch performance regressions.
 */

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  // Page load times
  PAGE_LOAD_GOOD: 2000,
  PAGE_LOAD_ACCEPTABLE: 4000,
  
  // API response times
  API_RESPONSE_GOOD: 200,
  API_RESPONSE_ACCEPTABLE: 500,
  
  // Time to First Byte
  TTFB_GOOD: 200,
  TTFB_ACCEPTABLE: 500,
  
  // First Contentful Paint
  FCP_GOOD: 1800,
  FCP_ACCEPTABLE: 3000,
  
  // Largest Contentful Paint
  LCP_GOOD: 2500,
  LCP_ACCEPTABLE: 4000,
};

// Helper to measure page load time
async function measurePageLoad(page: Page, url: string): Promise<{
  loadTime: number;
  ttfb: number;
  fcp: number;
  lcp: number;
}> {
  const navigationPromise = page.goto(url, { waitUntil: 'domcontentloaded' });
  const startTime = Date.now();
  
  await navigationPromise;
  const loadTime = Date.now() - startTime;
  
  // Get performance metrics from browser
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
    
    // Try to get LCP
    let lcp = 0;
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      lcp = lcpEntries[lcpEntries.length - 1].startTime;
    }
    
    return {
      ttfb: navigation?.responseStart - navigation?.requestStart || 0,
      fcp,
      lcp,
    };
  });
  
  return {
    loadTime,
    ...metrics,
  };
}

// Helper to login for authenticated tests
async function login(page: Page): Promise<boolean> {
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;
  
  if (!testEmail || !testPassword) {
    return false;
  }
  
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/password/i).fill(testPassword);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  
  try {
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('Performance Tests', () => {
  // ==========================================================================
  // Page Load Times
  // ==========================================================================
  test.describe('Page Load Times', () => {
    test('homepage loads within threshold', async ({ page }) => {
      const { loadTime, ttfb, fcp } = await measurePageLoad(page, '/');
      
      console.log(`Homepage: loadTime=${loadTime}ms, TTFB=${ttfb.toFixed(0)}ms, FCP=${fcp.toFixed(0)}ms`);
      
      expect(loadTime).toBeLessThan(THRESHOLDS.PAGE_LOAD_ACCEPTABLE);
      
      // Log warning if not "good"
      if (loadTime > THRESHOLDS.PAGE_LOAD_GOOD) {
        console.warn(`⚠️ Homepage load time (${loadTime}ms) exceeds "good" threshold (${THRESHOLDS.PAGE_LOAD_GOOD}ms)`);
      }
    });

    test('login page loads within threshold', async ({ page }) => {
      const { loadTime, ttfb } = await measurePageLoad(page, '/login');
      
      console.log(`Login page: loadTime=${loadTime}ms, TTFB=${ttfb.toFixed(0)}ms`);
      
      expect(loadTime).toBeLessThan(THRESHOLDS.PAGE_LOAD_ACCEPTABLE);
    });

    test('dashboard loads within threshold (authenticated)', async ({ page }) => {
      const loggedIn = await login(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      const { loadTime, ttfb, lcp } = await measurePageLoad(page, '/dashboard');
      
      console.log(`Dashboard: loadTime=${loadTime}ms, TTFB=${ttfb.toFixed(0)}ms, LCP=${lcp.toFixed(0)}ms`);
      
      expect(loadTime).toBeLessThan(THRESHOLDS.PAGE_LOAD_ACCEPTABLE);
    });

    test('funds page loads within threshold (authenticated)', async ({ page }) => {
      const loggedIn = await login(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      
      const { loadTime, ttfb } = await measurePageLoad(page, '/funds');
      
      console.log(`Funds page: loadTime=${loadTime}ms, TTFB=${ttfb.toFixed(0)}ms`);
      
      expect(loadTime).toBeLessThan(THRESHOLDS.PAGE_LOAD_ACCEPTABLE);
    });
  });

  // ==========================================================================
  // API Response Times
  // ==========================================================================
  test.describe('API Response Times', () => {
    test('health endpoint responds quickly', async ({ request }) => {
      const start = Date.now();
      const response = await request.get('/api/health');
      const duration = Date.now() - start;
      
      console.log(`Health endpoint: ${duration}ms`);
      
      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(THRESHOLDS.API_RESPONSE_ACCEPTABLE);
      
      if (duration > THRESHOLDS.API_RESPONSE_GOOD) {
        console.warn(`⚠️ Health endpoint (${duration}ms) exceeds "good" threshold`);
      }
    });

    test('readiness endpoint responds quickly', async ({ request }) => {
      const start = Date.now();
      const response = await request.get('/api/health/ready');
      const duration = Date.now() - start;
      
      console.log(`Readiness endpoint: ${duration}ms`);
      
      // May be 200 or 503
      expect([200, 503]).toContain(response.status());
      expect(duration).toBeLessThan(THRESHOLDS.API_RESPONSE_ACCEPTABLE * 2); // Allow more time for dependency checks
    });

    test('auth endpoint responds within threshold', async ({ request }) => {
      const start = Date.now();
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'perf-test@example.com',
          password: 'wrongpassword',
        },
      });
      const duration = Date.now() - start;
      
      console.log(`Auth endpoint: ${duration}ms`);
      
      // Should fail auth but respond quickly
      expect([400, 401]).toContain(response.status());
      expect(duration).toBeLessThan(THRESHOLDS.API_RESPONSE_ACCEPTABLE);
    });
  });

  // ==========================================================================
  // Core Web Vitals
  // ==========================================================================
  test.describe('Core Web Vitals', () => {
    test('homepage meets FCP threshold', async ({ page }) => {
      await page.goto('/');
      
      const fcp = await page.evaluate(() => {
        const paint = performance.getEntriesByType('paint');
        return paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
      });
      
      console.log(`Homepage FCP: ${fcp.toFixed(0)}ms`);
      
      if (fcp > 0) {
        expect(fcp).toBeLessThan(THRESHOLDS.FCP_ACCEPTABLE);
        
        if (fcp > THRESHOLDS.FCP_GOOD) {
          console.warn(`⚠️ FCP (${fcp.toFixed(0)}ms) exceeds "good" threshold (${THRESHOLDS.FCP_GOOD}ms)`);
        }
      }
    });

    test('homepage meets LCP threshold', async ({ page }) => {
      await page.goto('/');
      
      // Wait a bit for LCP to be calculated
      await page.waitForTimeout(2000);
      
      const lcp = await page.evaluate(() => {
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;
      });
      
      console.log(`Homepage LCP: ${lcp.toFixed(0)}ms`);
      
      if (lcp > 0) {
        expect(lcp).toBeLessThan(THRESHOLDS.LCP_ACCEPTABLE);
        
        if (lcp > THRESHOLDS.LCP_GOOD) {
          console.warn(`⚠️ LCP (${lcp.toFixed(0)}ms) exceeds "good" threshold (${THRESHOLDS.LCP_GOOD}ms)`);
        }
      }
    });

    test('homepage TTFB is acceptable', async ({ page }) => {
      await page.goto('/');
      
      const ttfb = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return navigation?.responseStart - navigation?.requestStart || 0;
      });
      
      console.log(`Homepage TTFB: ${ttfb.toFixed(0)}ms`);
      
      if (ttfb > 0) {
        expect(ttfb).toBeLessThan(THRESHOLDS.TTFB_ACCEPTABLE);
        
        if (ttfb > THRESHOLDS.TTFB_GOOD) {
          console.warn(`⚠️ TTFB (${ttfb.toFixed(0)}ms) exceeds "good" threshold (${THRESHOLDS.TTFB_GOOD}ms)`);
        }
      }
    });

    test('no layout shift on homepage', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page to stabilize
      await page.waitForTimeout(3000);
      
      const cls = await page.evaluate(() => {
        let clsValue = 0;
        const clsEntries = performance.getEntriesByType('layout-shift') as PerformanceEntry[];
        clsEntries.forEach((entry: PerformanceEntry) => {
          // @ts-ignore - LayoutShift type
          if (!entry.hadRecentInput) {
            // @ts-ignore - LayoutShift type
            clsValue += entry.value;
          }
        });
        return clsValue;
      });
      
      console.log(`Homepage CLS: ${cls.toFixed(4)}`);
      
      // CLS should be < 0.1 for "good"
      expect(cls).toBeLessThan(0.25); // Acceptable threshold
      
      if (cls > 0.1) {
        console.warn(`⚠️ CLS (${cls.toFixed(4)}) exceeds "good" threshold (0.1)`);
      }
    });
  });

  // ==========================================================================
  // Resource Loading
  // ==========================================================================
  test.describe('Resource Loading', () => {
    test('no excessive JavaScript bundles', async ({ page }) => {
      const jsRequests: { url: string; size: number }[] = [];
      
      page.on('response', async (response) => {
        const url = response.url();
        if (url.endsWith('.js') || url.includes('.js?')) {
          const headers = response.headers();
          const size = parseInt(headers['content-length'] || '0', 10);
          jsRequests.push({ url, size });
        }
      });
      
      await page.goto('/');
      
      // Wait for all JS to load
      await page.waitForLoadState('networkidle');
      
      const totalJsSize = jsRequests.reduce((sum, r) => sum + r.size, 0);
      const totalJsSizeKB = totalJsSize / 1024;
      
      console.log(`Total JS: ${totalJsSizeKB.toFixed(0)}KB across ${jsRequests.length} files`);
      
      // Total JS should be reasonable (< 1MB)
      expect(totalJsSize).toBeLessThan(1024 * 1024);
      
      // Warn if > 500KB
      if (totalJsSize > 500 * 1024) {
        console.warn(`⚠️ Total JS (${totalJsSizeKB.toFixed(0)}KB) is large. Consider code splitting.`);
      }
    });

    test('images are optimized', async ({ page }) => {
      const imageRequests: { url: string; size: number }[] = [];
      
      page.on('response', async (response) => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        if (contentType.startsWith('image/')) {
          const headers = response.headers();
          const size = parseInt(headers['content-length'] || '0', 10);
          imageRequests.push({ url, size });
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for very large images
      const largeImages = imageRequests.filter(r => r.size > 500 * 1024);
      
      if (largeImages.length > 0) {
        console.warn(`⚠️ Found ${largeImages.length} images > 500KB:`);
        largeImages.forEach(img => {
          console.warn(`  - ${img.url}: ${(img.size / 1024).toFixed(0)}KB`);
        });
      }
      
      // Should not have images > 1MB
      const veryLargeImages = imageRequests.filter(r => r.size > 1024 * 1024);
      expect(veryLargeImages.length).toBe(0);
    });
  });

  // ==========================================================================
  // Performance Report
  // ==========================================================================
  test('generate performance summary', async ({ page }) => {
    console.log('\n📊 Performance Summary');
    console.log('='.repeat(50));
    
    // Homepage metrics
    const homeMetrics = await measurePageLoad(page, '/');
    console.log(`\n🏠 Homepage:`);
    console.log(`   Load Time: ${homeMetrics.loadTime}ms ${homeMetrics.loadTime < THRESHOLDS.PAGE_LOAD_GOOD ? '✅' : '⚠️'}`);
    console.log(`   TTFB: ${homeMetrics.ttfb.toFixed(0)}ms ${homeMetrics.ttfb < THRESHOLDS.TTFB_GOOD ? '✅' : '⚠️'}`);
    console.log(`   FCP: ${homeMetrics.fcp.toFixed(0)}ms ${homeMetrics.fcp < THRESHOLDS.FCP_GOOD ? '✅' : '⚠️'}`);
    
    // Login metrics
    const loginMetrics = await measurePageLoad(page, '/login');
    console.log(`\n🔐 Login Page:`);
    console.log(`   Load Time: ${loginMetrics.loadTime}ms ${loginMetrics.loadTime < THRESHOLDS.PAGE_LOAD_GOOD ? '✅' : '⚠️'}`);
    
    console.log('\n' + '='.repeat(50));
    console.log('Thresholds:');
    console.log(`   Page Load (good): < ${THRESHOLDS.PAGE_LOAD_GOOD}ms`);
    console.log(`   TTFB (good): < ${THRESHOLDS.TTFB_GOOD}ms`);
    console.log(`   FCP (good): < ${THRESHOLDS.FCP_GOOD}ms`);
    console.log(`   LCP (good): < ${THRESHOLDS.LCP_GOOD}ms`);
    console.log('='.repeat(50) + '\n');
    
    // This test always passes - it's for reporting
    expect(true).toBe(true);
  });
});
