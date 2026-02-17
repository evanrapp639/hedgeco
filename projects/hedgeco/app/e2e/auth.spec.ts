import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * 
 * Tests for login, registration, and session management flows
 */

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      
      // Check page title and heading
      await expect(page).toHaveTitle(/HedgeCo/);
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
      
      // Check form elements
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
      
      // Check registration link
      await expect(page.getByRole('link', { name: /create.*account|register|sign up/i })).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');
      
      // Try to submit empty form
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Should show validation message
      await expect(page.getByText(/email|required/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Fill in invalid credentials
      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      
      // Submit form
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Should show error message
      await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible({ timeout: 10000 });
    });

    test('should redirect to dashboard after successful login', async ({ page }) => {
      // This test requires a test user to exist in the database
      // Skip if no test credentials are configured
      const testEmail = process.env.TEST_USER_EMAIL;
      const testPassword = process.env.TEST_USER_PASSWORD;
      
      if (!testEmail || !testPassword) {
        test.skip();
        return;
      }
      
      await page.goto('/login');
      
      // Fill in valid credentials
      await page.getByLabel(/email/i).fill(testEmail);
      await page.getByLabel(/password/i).fill(testPassword);
      
      // Submit form
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
      
      // Should show user greeting
      await expect(page.getByText(/welcome/i)).toBeVisible();
    });

    test('should navigate to register page', async ({ page }) => {
      await page.goto('/login');
      
      // Click registration link
      await page.getByRole('link', { name: /create.*account|register|sign up/i }).click();
      
      // Should be on register page
      await expect(page).toHaveURL(/register/);
    });
  });

  test.describe('Registration Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');
      
      // Check heading
      await expect(page.getByRole('heading', { name: /create.*account|register|sign up/i })).toBeVisible();
      
      // Check form fields exist
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/last name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
      
      // Check role selector
      await expect(page.getByText(/investor|manager|service provider/i)).toBeVisible();
      
      // Check submit button
      await expect(page.getByRole('button', { name: /create|register|sign up/i })).toBeVisible();
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto('/register');
      
      // Fill in invalid email
      await page.getByLabel(/email/i).fill('not-an-email');
      
      // Fill in short password
      const passwordField = page.getByLabel(/^password$/i).or(page.getByPlaceholder(/password/i).first());
      await passwordField.fill('123');
      
      // Try to submit
      await page.getByRole('button', { name: /create|register|sign up/i }).click();
      
      // Should show validation errors
      await expect(page.getByText(/valid email|email.*invalid/i).or(page.getByText(/password.*characters/i))).toBeVisible();
    });

    test('should show error for existing email', async ({ page }) => {
      await page.goto('/register');
      
      // Fill in form with existing email (use a known test email)
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/email/i).fill('test@hedgeco.net');
      
      const passwordField = page.getByLabel(/^password$/i).or(page.getByPlaceholder(/password/i).first());
      await passwordField.fill('TestPassword123!');
      
      // Submit form
      await page.getByRole('button', { name: /create|register|sign up/i }).click();
      
      // Should show error about existing email
      await expect(
        page.getByText(/already exists|already registered|email.*taken/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test('should have link back to login', async ({ page }) => {
      await page.goto('/register');
      
      // Click login link
      await page.getByRole('link', { name: /sign in|log in|already have/i }).click();
      
      // Should be on login page
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access dashboard without being logged in
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    });

    test('should redirect to admin with proper credentials', async ({ page }) => {
      // Admin routes should redirect non-admins
      await page.goto('/admin');
      
      // Should redirect to login (when not authenticated) or unauthorized
      await expect(page).toHaveURL(/login|unauthorized/);
    });
  });

  test.describe('Session Management', () => {
    test('should persist session across page reloads', async ({ page }) => {
      // This test requires a test user
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
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Wait for dashboard
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
      
      // Reload page
      await page.reload();
      
      // Should still be on dashboard (session persisted)
      await expect(page).toHaveURL(/dashboard/);
      await expect(page.getByText(/welcome/i)).toBeVisible();
    });
  });
});
