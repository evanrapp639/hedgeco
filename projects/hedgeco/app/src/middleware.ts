/**
 * Next.js Middleware for Security Headers and Request Processing
 * 
 * This middleware runs on every request and:
 * - Adds security headers (CSP, X-Frame-Options, etc.)
 * - Handles authentication redirects
 * - Implements basic rate limiting headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security headers configuration
const securityHeaders = {
  // Content Security Policy
  // Restricts sources for scripts, styles, images, etc.
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://www.google-analytics.com wss:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; '),

  // Prevent clickjacking attacks
  // DENY = page cannot be displayed in a frame
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  // Forces browser to use declared Content-Type
  'X-Content-Type-Options': 'nosniff',

  // Control referrer information
  // Only send origin for cross-origin requests
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Restrict browser features
  // Disable unnecessary browser APIs for security
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),

  // Enable XSS protection in older browsers
  // Modern browsers have this built-in
  'X-XSS-Protection': '1; mode=block',

  // DNS prefetch control
  'X-DNS-Prefetch-Control': 'on',

  // Strict Transport Security (HSTS)
  // Forces HTTPS connections
  // max-age=1 year, include subdomains, allow preload
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/webhooks',
];

// Routes that require admin access
const adminRoutes = [
  '/admin',
  '/api/admin',
];

// Static file extensions to skip
const staticExtensions = [
  '.js',
  '.css',
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
];

/**
 * Check if a path matches any of the given routes
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Check if the request is for a static file
 */
function isStaticFile(pathname: string): boolean {
  return staticExtensions.some(ext => pathname.endsWith(ext)) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }

  // Create response with security headers
  const response = NextResponse.next();

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Skip auth checks for public routes
  if (matchesRoute(pathname, publicRoutes)) {
    return response;
  }

  // Get access token from cookies
  const accessToken = request.cookies.get('accessToken')?.value;

  // Redirect unauthenticated users to login
  if (!accessToken) {
    // Store the original URL to redirect back after login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For admin routes, verify admin role
  if (matchesRoute(pathname, adminRoutes)) {
    try {
      // Decode the JWT to check the role (without full verification - that's done by the API)
      const [, payloadBase64] = accessToken.split('.');
      const payload = JSON.parse(atob(payloadBase64));
      
      if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
        // Redirect non-admins to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // Invalid token format - redirect to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Add rate limit headers for API routes
  if (pathname.startsWith('/api/')) {
    // Rate limit headers are typically set by the API handlers
    // These are informational headers for clients
    response.headers.set('X-RateLimit-Policy', 'standard');
  }

  return response;
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
