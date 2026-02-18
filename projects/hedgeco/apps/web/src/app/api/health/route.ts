/**
 * Health Check Endpoint
 * 
 * Basic health check for load balancers and monitoring.
 * Returns 200 OK if the application is running.
 * Includes optional dependency checks for detailed status.
 * 
 * GET /api/health
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: CheckResult;
    redis: CheckResult;
  };
}

interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  message?: string;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'pass',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<CheckResult> {
  const start = Date.now();
  
  // Try to import Redis if available
  try {
    const { redis } = await import('@/lib/redis');
    
    if (!redis) {
      return {
        status: 'warn',
        message: 'Redis not configured',
      };
    }
    
    const pong = await redis.ping();
    if (pong === 'PONG') {
      return {
        status: 'pass',
        responseTime: Date.now() - start,
      };
    }
    
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: 'Redis ping failed',
    };
  } catch (error) {
    // Redis is optional - warn but don't fail
    return {
      status: 'warn',
      responseTime: Date.now() - start,
      message: 'Redis not available',
    };
  }
}

/**
 * Calculate overall health status
 */
function calculateOverallStatus(checks: HealthStatus['checks']): HealthStatus['status'] {
  const results = Object.values(checks);
  
  // If any critical check fails, we're unhealthy
  if (checks.database.status === 'fail') {
    return 'unhealthy';
  }
  
  // If any check has warnings, we're degraded
  if (results.some(r => r.status === 'warn' || r.status === 'fail')) {
    return 'degraded';
  }
  
  return 'healthy';
}

// Track server start time for uptime calculation
const startTime = Date.now();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const verbose = url.searchParams.get('verbose') === 'true';
  
  try {
    // Run checks in parallel
    const [database, redis] = await Promise.all([
      checkDatabase(),
      checkRedis(),
    ]);
    
    const checks = { database, redis };
    const status = calculateOverallStatus(checks);
    
    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks,
    };
    
    // For simple health checks, just return status
    if (!verbose) {
      return NextResponse.json(
        { status: healthStatus.status },
        { 
          status: status === 'unhealthy' ? 503 : 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }
    
    // Verbose mode returns full details
    return NextResponse.json(healthStatus, {
      status: status === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    // If we can't even run checks, we're definitely unhealthy
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

// HEAD request for simple ping checks
export async function HEAD() {
  try {
    // Quick database check only
    await prisma.$queryRaw`SELECT 1`;
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
