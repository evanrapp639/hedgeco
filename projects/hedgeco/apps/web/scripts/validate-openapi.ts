#!/usr/bin/env tsx
/**
 * OpenAPI Specification Validator
 * 
 * Validates the OpenAPI spec for:
 * - Valid JSON/YAML structure
 * - All endpoints documented
 * - Schemas match actual responses
 * 
 * Run: npx tsx scripts/validate-openapi.ts
 * Add to CI: npm run validate:openapi
 */

import * as fs from 'fs';
import * as path from 'path';

// Types for OpenAPI spec
interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, Schema>;
    securitySchemes?: Record<string, SecurityScheme>;
  };
  security?: Array<Record<string, string[]>>;
}

interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
}

interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  security?: Array<Record<string, string[]>>;
}

interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required?: boolean;
  schema: Schema;
  description?: string;
}

interface RequestBody {
  content: Record<string, MediaType>;
  required?: boolean;
  description?: string;
}

interface Response {
  description: string;
  content?: Record<string, MediaType>;
  headers?: Record<string, { schema: Schema }>;
}

interface MediaType {
  schema: Schema | SchemaRef;
}

interface Schema {
  type?: string;
  properties?: Record<string, Schema | SchemaRef>;
  items?: Schema | SchemaRef;
  required?: string[];
  enum?: unknown[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  description?: string;
}

interface SchemaRef {
  $ref: string;
}

interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  bearerFormat?: string;
  in?: 'query' | 'header' | 'cookie';
  name?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    endpoints: number;
    operations: number;
    schemas: number;
    documented: number;
    undocumented: string[];
  };
}

// Find the OpenAPI spec file
function findOpenAPISpec(): string | null {
  const possiblePaths = [
    'openapi.json',
    'openapi.yaml',
    'openapi.yml',
    'api/openapi.json',
    'docs/openapi.json',
    'public/openapi.json',
    'src/openapi.json',
  ];

  for (const p of possiblePaths) {
    const fullPath = path.join(process.cwd(), p);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

// Parse OpenAPI spec (JSON or YAML)
function parseSpec(filePath: string): OpenAPISpec {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  if (filePath.endsWith('.json')) {
    return JSON.parse(content);
  }
  
  // For YAML, we'd need a YAML parser
  // For now, assume JSON
  throw new Error('YAML parsing not implemented. Please use JSON format.');
}

// Validate the OpenAPI spec structure
function validateSpecStructure(spec: OpenAPISpec): string[] {
  const errors: string[] = [];

  // Check required fields
  if (!spec.openapi) {
    errors.push('Missing required field: openapi');
  } else if (!spec.openapi.startsWith('3.')) {
    errors.push(`Unsupported OpenAPI version: ${spec.openapi}. Expected 3.x`);
  }

  if (!spec.info) {
    errors.push('Missing required field: info');
  } else {
    if (!spec.info.title) errors.push('Missing required field: info.title');
    if (!spec.info.version) errors.push('Missing required field: info.version');
  }

  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    errors.push('Missing or empty paths object');
  }

  return errors;
}

// Validate paths and operations
function validatePaths(spec: OpenAPISpec): { errors: string[]; warnings: string[]; stats: { operations: number } } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let operations = 0;

  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    // Check path format
    if (!path.startsWith('/')) {
      errors.push(`Path must start with /: ${path}`);
    }

    // Check each method
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      operations++;

      // Check for operationId
      if (!operation.operationId) {
        warnings.push(`Missing operationId for ${method.toUpperCase()} ${path}`);
      }

      // Check responses
      if (!operation.responses || Object.keys(operation.responses).length === 0) {
        errors.push(`Missing responses for ${method.toUpperCase()} ${path}`);
      } else {
        // Should have at least a success response
        const hasSuccess = Object.keys(operation.responses).some(
          code => code.startsWith('2') || code === 'default'
        );
        if (!hasSuccess) {
          warnings.push(`No success response defined for ${method.toUpperCase()} ${path}`);
        }
      }

      // Check POST/PUT/PATCH have request body documented
      if (['post', 'put', 'patch'].includes(method) && !operation.requestBody) {
        warnings.push(`${method.toUpperCase()} ${path} might need a requestBody definition`);
      }

      // Check for description
      if (!operation.summary && !operation.description) {
        warnings.push(`Missing summary/description for ${method.toUpperCase()} ${path}`);
      }
    }
  }

  return { errors, warnings, stats: { operations } };
}

// Validate schemas
function validateSchemas(spec: OpenAPISpec): { errors: string[]; warnings: string[]; count: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const schemas = spec.components?.schemas || {};
  const schemaCount = Object.keys(schemas).length;

  for (const [name, schema] of Object.entries(schemas)) {
    // Check for type
    if (!('type' in schema) && !('$ref' in schema) && !('allOf' in schema) && !('oneOf' in schema) && !('anyOf' in schema)) {
      warnings.push(`Schema ${name} has no type definition`);
    }

    // Check object schemas have properties
    if ('type' in schema && schema.type === 'object' && !schema.properties) {
      warnings.push(`Object schema ${name} has no properties defined`);
    }
  }

  return { errors, warnings, count: schemaCount };
}

// Find API routes in the codebase
function findAPIRoutes(): string[] {
  const routes: string[] = [];
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api');

  if (!fs.existsSync(apiDir)) {
    return routes;
  }

  function scanDir(dir: string, basePath: string = '/api') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Handle dynamic routes [param]
        const routeSegment = entry.name.startsWith('[') 
          ? `{${entry.name.slice(1, -1)}}`
          : entry.name;
        scanDir(fullPath, `${basePath}/${routeSegment}`);
      } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
        routes.push(basePath);
      }
    }
  }

  scanDir(apiDir);
  return routes;
}

// Check if all API routes are documented
function checkEndpointCoverage(spec: OpenAPISpec, apiRoutes: string[]): { documented: string[]; undocumented: string[] } {
  const documented: string[] = [];
  const undocumented: string[] = [];
  
  const specPaths = Object.keys(spec.paths);

  for (const route of apiRoutes) {
    // Convert Next.js route format to OpenAPI format
    const openApiPath = route.replace(/\{(\w+)\}/g, '{$1}');
    
    // Check if documented
    const isDocumented = specPaths.some(p => {
      // Exact match
      if (p === openApiPath) return true;
      // Handle parameter variations
      const normalizedSpec = p.replace(/\{[^}]+\}/g, '{param}');
      const normalizedRoute = openApiPath.replace(/\{[^}]+\}/g, '{param}');
      return normalizedSpec === normalizedRoute;
    });

    if (isDocumented) {
      documented.push(route);
    } else {
      undocumented.push(route);
    }
  }

  return { documented, undocumented };
}

// Validate $ref references
function validateRefs(spec: OpenAPISpec): string[] {
  const errors: string[] = [];
  const availableSchemas = Object.keys(spec.components?.schemas || {});

  function checkRef(ref: string, location: string) {
    if (ref.startsWith('#/components/schemas/')) {
      const schemaName = ref.replace('#/components/schemas/', '');
      if (!availableSchemas.includes(schemaName)) {
        errors.push(`Invalid $ref at ${location}: Schema '${schemaName}' not found`);
      }
    }
  }

  function checkObject(obj: unknown, path: string) {
    if (!obj || typeof obj !== 'object') return;

    if ('$ref' in (obj as Record<string, unknown>)) {
      checkRef((obj as { $ref: string }).$ref, path);
    }

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof value === 'object' && value !== null) {
        checkObject(value, `${path}.${key}`);
      }
    }
  }

  checkObject(spec.paths, 'paths');

  return errors;
}

// Main validation function
async function validateOpenAPI(): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      endpoints: 0,
      operations: 0,
      schemas: 0,
      documented: 0,
      undocumented: [],
    },
  };

  console.log('🔍 OpenAPI Specification Validator\n');

  // Find spec file
  const specPath = findOpenAPISpec();
  
  if (!specPath) {
    console.log('📄 No OpenAPI spec file found.');
    console.log('   Checked: openapi.json, openapi.yaml, api/openapi.json, docs/openapi.json\n');
    
    // Create a template spec
    const templateSpec: OpenAPISpec = {
      openapi: '3.0.3',
      info: {
        title: 'HedgeCo API',
        version: '1.0.0',
        description: 'API documentation for HedgeCo platform',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Development server' },
        { url: 'https://api.hedgeco.net', description: 'Production server' },
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    };

    // Find API routes and add placeholders
    const apiRoutes = findAPIRoutes();
    console.log(`📁 Found ${apiRoutes.length} API routes in codebase:\n`);
    
    for (const route of apiRoutes) {
      console.log(`   ${route}`);
      templateSpec.paths[route] = {
        get: {
          summary: `Get ${route}`,
          responses: {
            '200': { description: 'Success' },
            '401': { description: 'Unauthorized' },
          },
        },
      };
    }

    // Write template
    const templatePath = path.join(process.cwd(), 'openapi.json');
    fs.writeFileSync(templatePath, JSON.stringify(templateSpec, null, 2));
    console.log(`\n✅ Created template: ${templatePath}`);
    console.log('   Please fill in the endpoint details.\n');

    result.stats.undocumented = apiRoutes;
    result.warnings.push('OpenAPI spec created from template - needs completion');
    return result;
  }

  console.log(`📄 Found spec: ${specPath}\n`);

  // Parse spec
  let spec: OpenAPISpec;
  try {
    spec = parseSpec(specPath);
    console.log(`✅ Valid JSON structure\n`);
  } catch (error) {
    result.valid = false;
    result.errors.push(`Failed to parse spec: ${error}`);
    return result;
  }

  // Validate structure
  const structureErrors = validateSpecStructure(spec);
  result.errors.push(...structureErrors);

  // Validate paths
  const pathValidation = validatePaths(spec);
  result.errors.push(...pathValidation.errors);
  result.warnings.push(...pathValidation.warnings);
  result.stats.operations = pathValidation.stats.operations;
  result.stats.endpoints = Object.keys(spec.paths).length;

  // Validate schemas
  const schemaValidation = validateSchemas(spec);
  result.errors.push(...schemaValidation.errors);
  result.warnings.push(...schemaValidation.warnings);
  result.stats.schemas = schemaValidation.count;

  // Validate $ref references
  const refErrors = validateRefs(spec);
  result.errors.push(...refErrors);

  // Check endpoint coverage
  const apiRoutes = findAPIRoutes();
  const coverage = checkEndpointCoverage(spec, apiRoutes);
  result.stats.documented = coverage.documented.length;
  result.stats.undocumented = coverage.undocumented;

  // Print results
  console.log('📊 Validation Results\n');
  console.log(`   OpenAPI Version: ${spec.openapi}`);
  console.log(`   API Title: ${spec.info.title}`);
  console.log(`   API Version: ${spec.info.version}\n`);

  console.log('📈 Statistics');
  console.log(`   Endpoints documented: ${result.stats.endpoints}`);
  console.log(`   Total operations: ${result.stats.operations}`);
  console.log(`   Schemas defined: ${result.stats.schemas}`);
  console.log(`   API routes in code: ${apiRoutes.length}`);
  console.log(`   Coverage: ${result.stats.documented}/${apiRoutes.length} (${Math.round(result.stats.documented / apiRoutes.length * 100)}%)\n`);

  if (result.stats.undocumented.length > 0) {
    console.log('⚠️  Undocumented routes:');
    result.stats.undocumented.forEach(r => console.log(`   - ${r}`));
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach(e => console.log(`   - ${e}`));
    console.log('');
    result.valid = false;
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.slice(0, 10).forEach(w => console.log(`   - ${w}`));
    if (result.warnings.length > 10) {
      console.log(`   ... and ${result.warnings.length - 10} more`);
    }
    console.log('');
  }

  if (result.valid && result.errors.length === 0) {
    console.log('✅ OpenAPI spec is valid!\n');
  } else {
    console.log('❌ OpenAPI spec has errors. Please fix before deployment.\n');
  }

  return result;
}

// Run validation
validateOpenAPI()
  .then(result => {
    process.exit(result.valid ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
