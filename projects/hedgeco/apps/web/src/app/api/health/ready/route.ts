/**
 * Readiness Probe Endpoint
 * 
 * Kubernetes readiness probe - indicates whether the application
 * is ready to receive traffic. All dependencies must be available.
 * 
 * Unlike the basic health check, this endpoint MUST return 200
 * only when ALL dependencies are ready.
 * 
 * GET /api/health/ready
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ReadinessStatus {
  ready: boolean;
  timestamp: string;
  checks: {
    database: DependencyCheck;
    redis: DependencyCheck;
    migrations: DependencyCheck;
  };
}

interface DependencyCheck {
  ready: boolean;
  responseTime?: number;
  error?: string;
}

/**
 * Check database connectivity and basic operations
 */
async function checkDatabase(): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    // Verify connection and basic query capability
    await prisma.$queryRaw`SELECT 1`;
    
    // Verify we can read from a table (users table should exist)
    await prisma.$queryRaw`SELECT COUNT(*) FROM "User" LIMIT 1`;
    
    return {
      ready: true,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      ready: false,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Database not ready',
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<DependencyCheck> {
  const start = Date.now();
  
  try {
    const { redis } = await import('@/lib/redis');
    
    if (!redis) {
      // Redis is optional in some environments
      const redisRequired = process.env.REDIS_REQUIRED === 'true';
      return {
        ready: !redisRequired,
        responseTime: Date.now() - start,
        error: redisRequired ? 'Redis required but not configured' : undefined,
      };
    }
    
    // Test read and write
    const testKey = '_health_check_';
    await redis.set(testKey, Date.now().toString(), 'EX', 10);
    const value = await redis.get(testKey);
    
    if (!value) {
      return {
        ready: false,
        responseTime: Date.now() - start,
        error: 'Redis read/write failed',
      };
    }
    
    return {
      ready: true,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    const redisRequired = process.env.REDIS_REQUIRED === 'true';
    return {
      ready: !redisRequired,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Redis not available',
    };
  }
}

/**
 * Check that database migrations are up to date
 */
async function checkMigrations(): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    // Check if _prisma_migrations table exists and has entries
    const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name 
      FROM _prisma_migrations 
      WHERE finished_at IS NOT NULL 
      ORDER BY finished_at DESC 
      LIMIT 1
    `;
    
    if (!migrations || migrations.length === 0) {
      return {
        ready: false,
        responseTime: Date.now() - start,
        error: 'No migrations applied',
      };
    }
    
    return {
      ready: true,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    // Migrations table might not exist in dev/test environments using db push
    // This is acceptable - check if User table exists as fallback
    try {
      await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 0`;
      return {
        ready: true,
        responseTime: Date.now() - start,
      };
    } catch {
      return {
        ready: false,
        responseTime: Date.now() - start,
        error: 'Database schema not ready',
      };
    }
  }
}

export async function GET() {
  try {
    // Run all checks in parallel
    const [database, redis, migrations] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkMigrations(),
    ]);
    
    const checks = { database, redis, migrations };
    
    // All critical checks must pass
    const ready = database.ready && migrations.ready && redis.ready;
    
    const status: ReadinessStatus = {
      ready,
      timestamp: new Date().toISOString(),
      checks,
    };
    
    return NextResponse.json(status, {
      status: ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ready: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Readiness check failed',
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
