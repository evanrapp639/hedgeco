#!/usr/bin/env tsx
/**
 * Generate OpenAPI Specification
 * Sprint 7: HedgeCo.Net
 *
 * Exports the OpenAPI spec to public/openapi.json
 * Run as: npx tsx scripts/generate-openapi.ts
 * Or add to package.json: "generate:openapi": "tsx scripts/generate-openapi.ts"
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { generateOpenAPISpec, getOpenAPISpecJSON } from '../src/lib/openapi';

const OUTPUT_PATH = join(process.cwd(), 'public', 'openapi.json');

async function main() {
  console.log('📝 Generating OpenAPI specification...\n');

  // Ensure public directory exists
  const publicDir = dirname(OUTPUT_PATH);
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
    console.log(`  Created directory: ${publicDir}`);
  }

  // Generate the spec
  const spec = generateOpenAPISpec({
    title: 'HedgeCo.Net API',
    version: '1.0.0',
    description: `
HedgeCo.Net API provides programmatic access to hedge fund data, analytics, and comparison tools.

## Authentication

Most endpoints require authentication via JWT tokens. Obtain a token by calling POST /api/auth/login.

Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`

Alternatively, tokens are stored in httpOnly cookies and sent automatically with browser requests.

## Rate Limiting

API requests are rate-limited:
- Unauthenticated: 60 requests per minute
- Authenticated: 300 requests per minute
- Premium: 1000 requests per minute

Rate limit headers are included in responses:
- X-RateLimit-Limit
- X-RateLimit-Remaining
- X-RateLimit-Reset

## tRPC Integration

This API is built on tRPC. While REST-like endpoints are documented here, you can also use the tRPC client directly for type-safe access.

## Versioning

The API uses URL versioning. The current version is v1 (implicit in paths).
    `.trim(),
    serverUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  });

  // Write JSON file
  const jsonContent = JSON.stringify(spec, null, 2);
  writeFileSync(OUTPUT_PATH, jsonContent, 'utf-8');
  console.log(`  ✅ Written: ${OUTPUT_PATH}`);

  // Print summary
  const pathCount = Object.keys(spec.paths || {}).length;
  const schemaCount = Object.keys(spec.components?.schemas || {}).length;

  console.log('\n📊 Specification Summary:');
  console.log(`  - Endpoints: ${pathCount}`);
  console.log(`  - Schemas: ${schemaCount}`);
  console.log(`  - Tags: ${spec.tags?.length || 0}`);
  console.log(`  - OpenAPI Version: ${spec.openapi}`);

  // Validate basic structure
  console.log('\n🔍 Validation:');
  
  const errors: string[] = [];
  
  if (!spec.info?.title) errors.push('Missing info.title');
  if (!spec.info?.version) errors.push('Missing info.version');
  if (!spec.paths || Object.keys(spec.paths).length === 0) errors.push('No paths defined');
  
  if (errors.length > 0) {
    console.log('  ❌ Errors:');
    errors.forEach(e => console.log(`    - ${e}`));
    process.exit(1);
  } else {
    console.log('  ✅ Spec is valid');
  }

  console.log('\n✨ Done! OpenAPI spec generated successfully.\n');
  console.log('View the documentation at: /api/docs');
}

main().catch((error) => {
  console.error('❌ Failed to generate OpenAPI spec:', error);
  process.exit(1);
});
